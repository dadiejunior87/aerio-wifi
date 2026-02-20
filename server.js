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

// --- ROUTES API ---

// 1. Enregistrer un partenaire et générer son ID Unique AERIO
app.post("/api/register-partner", (req, res) => {
    const { router_ip, payout_number, payout_method } = req.body;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    
    const partnerID = "AE-" + Math.floor(1000 + Math.random() * 9000);
    const newPartner = {
        partnerID,
        router_ip,
        payout_number,
        payout_method,
        rates: [],
        createdAt: new Date()
    };

    partners.push(newPartner);
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    res.json({ success: true, partnerID });
});

// 2. Ajouter un tarif personnalisé
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

// 3. Récupérer les tarifs pour le Portail Captif
app.get("/api/get-rates", (req, res) => {
    const { id } = req.query;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.partnerID === id);
    res.json(partner ? partner.rates : []);
});

// 4. Initialiser le paiement Moneroo
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

// 5. Webhook Moneroo : Confirmation de paiement
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

// 6. Récupérer un ticket perdu
app.get('/api/recover-ticket', (req, res) => {
    const { phone } = req.query;
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const found = tickets.reverse().find(t => t.customer_phone === phone);
    if (found) {
        res.json({ success: true, code: found.code });
    } else {
        res.json({ success: false });
    }
});

// 7. Route API Connexion Partenaire (Vérification identifiants)
app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    // Identifiants de test (À modifier pour une vraie base de données plus tard)
    if (email === "admin@aerio.com" && password === "admin123") {
        res.redirect("/dashboard");
    } else {
        res.send("<script>alert('Identifiants incorrects'); window.location.href='/connexion';</script>");
    }
});

// --- ROUTES PAGES ---

// Page d'accueil
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Page de Connexion (Style Ticket WiFi Zone)
app.get("/connexion", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login-partenaire.html"));
});

// Page de localisation des zones WiFi (Carte)
app.get("/map", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "map.html"));
});

// Page de récupération de ticket
app.get("/recover", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "recover.html"));
});

// Page du Dashboard Partenaire
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// API pour l'historique des tickets
app.get("/api/tickets", (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    res.json(tickets);
});

// Lancement du serveur
app.listen(PORT, () => console.log(`🚀 AERIO SAAS opérationnel sur le port ${PORT}`));
