const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Initialisation des fichiers JSON s'ils n'existent pas
if (!fs.existsSync(TICKETS_FILE)) fs.writeFileSync(TICKETS_FILE, JSON.stringify([]));
if (!fs.existsSync(PARTNERS_FILE)) fs.writeFileSync(PARTNERS_FILE, JSON.stringify([]));

// --- ROUTES API COMPTE & PARTENAIRES ---

// 1. Inscription d'un nouveau partenaire (SaaS)
app.post("/api/register-account", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));

    if (partners.find(p => p.email === email)) {
        return res.send("<script>alert('Cet email est déjà utilisé'); window.location.href='/inscription';</script>");
    }

    const newPartner = {
        name,
        email,
        password, // En production, utilisez un hash (ex: bcrypt)
        partnerID: "AE-" + Math.floor(1000 + Math.random() * 9000),
        router_ip: "",
        payout_number: "",
        payout_method: "orange_money",
        rates: [],
        createdAt: new Date()
    };

    partners.push(newPartner);
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    res.send("<script>alert('Compte Élite créé ! Connectez-vous.'); window.location.href='/connexion';</script>");
});

// 2. Mise à jour du Profil Élite
app.post("/api/update-profile", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    
    // Simulation de mise à jour pour le partenaire actuel
    let partner = partners.find(p => p.email === email);
    if (partner) {
        partner.name = name;
        if (password) partner.password = password;
        fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
        res.send("<script>alert('Profil mis à jour avec succès !'); window.location.href='/dashboard';</script>");
    } else {
        res.status(404).send("Partenaire non trouvé");
    }
});

// 3. Enregistrer les réglages routeur/payout depuis le Dashboard
app.post("/api/register-partner", (req, res) => {
    const { router_ip, payout_number, payout_method, partnerID } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    
    let partner = partners.find(p => p.partnerID === partnerID);
    if (partner) {
        partner.router_ip = router_ip;
        partner.payout_number = payout_number;
        partner.payout_method = payout_method;
        fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "ID Partenaire invalide" });
    }
});

// 4. Ajouter un tarif personnalisé
app.post("/api/save-rate", (req, res) => {
    const { partnerID, prix, duree } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    let partner = partners.find(p => p.partnerID === partnerID);
    if (partner) {
        partner.rates.push({ prix: parseInt(prix), duree });
        fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Partenaire non trouvé" });
    }
});

// 5. Récupérer les tarifs pour le Portail Captif
app.get("/api/get-rates", (req, res) => {
    const { id } = req.query;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.partnerID === id);
    res.json(partner ? partner.rates : []);
});

// --- SYSTÈME DE PAIEMENT & WEBHOOK ---

// 6. Initialiser le paiement Moneroo
app.post("/api/pay", async (req, res) => {
    const { amount, duration, router_id, phone } = req.body;
    try {
        const response = await axios.post('https://api.moneroo.io', {
            amount: parseInt(amount),
            currency: 'XOF',
            customer: { phone: phone, name: "Client WiFi" },
            return_url: `https://${req.get('host')}/success.html`,
            metadata: { router_id, duration, phone }
        }, {
            headers: { 'Authorization': `Bearer ${process.env.MONEROO_API_KEY}` }
        });
        res.json({ checkout_url: response.data.data.checkout_url });
    } catch (e) {
        res.status(500).json({ error: "Erreur Moneroo" });
    }
});

// 7. Webhook Moneroo : Confirmation et calcul commission
app.post("/api/webhook", async (req, res) => {
    const { event, data } = req.body;
    if (event === 'payment.success') {
        const amount = data.amount;
        const partnerID = data.metadata.router_id;
        const customerPhone = data.metadata.phone;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
        tickets.push({
            code,
            amount,
            customer_phone: customerPhone,
            partnerID,
            date: new Date(),
            status: "SUCCESS"
        });
        fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
    }
    res.sendStatus(200);
});

// 8. Récupérer un ticket perdu
app.get('/api/recover-ticket', (req, res) => {
    const { phone } = req.query;
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const found = tickets.reverse().find(t => t.customer_phone === phone);
    if (found) res.json({ success: true, code: found.code });
    else res.json({ success: false });
});

// 9. Connexion Partenaire
app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.email === email && p.password === password);

    if (partner) res.redirect("/dashboard");
    else res.send("<script>alert('Identifiants incorrects'); window.location.href='/connexion';</script>");
});

// --- ROUTES PAGES HTML ---

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/inscription", (req, res) => res.sendFile(path.join(__dirname, "public", "register-partenaire.html")));
app.get("/map", (req, res) => res.sendFile(path.join(__dirname, "public", "map.html")));
app.get("/recover", (req, res) => res.sendFile(path.join(__dirname, "public", "recover.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/profil", (req, res) => res.sendFile(path.join(__dirname, "public", "profil.html")));

app.get("/api/tickets", (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    res.json(tickets);
});

app.listen(PORT, () => console.log(`🚀 AERIO SAAS opérationnel sur le port ${PORT}`));
