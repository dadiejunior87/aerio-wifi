const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const session = require("express-session");
const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configuration des Sessions (Sécurité Élite)
app.use(session({
    secret: 'AERIO_CYBER_PRO_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// --- INITIALISATION DES FICHIERS JSON ---
const initFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        console.log(`✅ Système : Fichier ${path.basename(filePath)} initialisé.`);
    }
};
initFile(TICKETS_FILE);
initFile(PARTNERS_FILE);

// Protection des accès privés
function checkAuth(req, res, next) {
    if (req.session.partnerID) next();
    else res.redirect("/connexion");
}

// --- WEBHOOK MONEROO (RECEPTION DES PAIEMENTS) ---
app.post("/api/webhook/moneroo", (req, res) => {
    const payload = req.body;
    if (payload.event === 'payment.success') {
        const { amount, metadata } = payload.data;
        const code = "AE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        try {
            const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
            tickets.push({
                code,
                amount,
                customer_phone: metadata.phone,
                partnerID: metadata.router_id,
                date: new Date(),
                status: "SUCCESS"
            });
            fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
        } catch (e) { console.error("Erreur Webhook:", e); }
    }
    res.status(200).send('OK');
});

// --- ROUTES AUTHENTIFICATION ---

app.post("/api/register-account", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    
    if (partners.find(p => p.email === email)) {
        return res.redirect("/inscription?error=exists");
    }
    
    const partnerID = "AE-" + Math.floor(1000 + Math.random() * 9000);
    partners.push({ name, email, password, partnerID, rates: [], createdAt: new Date() });
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    
    // Redirection propre vers la connexion sans alert()
    res.redirect("/connexion?signup=success");
});

app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.email === email && p.password === password);

    if (partner) {
        req.session.partnerID = partner.partnerID;
        res.redirect("/dashboard");
    } else {
        res.redirect("/connexion?error=login");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// --- ROUTES API & BOUTIQUE DYNAMIQUE ---

// Récupérer les tarifs pour le client (via ID partenaire dans l'URL)
app.get("/api/get-partner-rates", (req, res) => {
    const { id } = req.query;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.partnerID === id);
    if (partner) res.json({ name: partner.name, rates: partner.rates });
    else res.status(404).json({ error: "Zone introuvable" });
});

// Statistiques réelles du Dashboard
app.get("/api/admin/stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const myTickets = tickets.filter(t => t.partnerID === req.session.partnerID && t.status === "SUCCESS");
    const totalCA = myTickets.reduce((sum, t) => sum + t.amount, 0);
    res.json({ solde: totalCA * 0.15, totalGeneré: totalCA, ventes: myTickets.length });
});

app.post("/api/pay", async (req, res) => {
    const { amount, duration, router_id, phone } = req.body;
    try {
        const response = await axios.post('https://api.moneroo.io/v1/payments', {
            amount: parseInt(amount),
            currency: 'XAF',
            customer: { phone: phone, name: "Client WiFi" },
            return_url: `https://${req.get('host')}/success.html?phone=${phone}`,
            notify_url: `https://${req.get('host')}/api/webhook/moneroo`,
            metadata: { router_id, duration, phone }
        }, {
            headers: { 'Authorization': `Bearer ${process.env.MONEROO_API_KEY}` }
        });
        res.json({ checkout_url: response.data.data.checkout_url });
    } catch (e) {
        res.status(500).json({ error: "Interruption Moneroo" });
    }
});

app.get('/api/recover-ticket', (req, res) => {
    const { phone } = req.query;
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const found = tickets.reverse().find(t => t.customer_phone === phone);
    if (found) res.json({ success: true, code: found.code });
    else res.json({ success: false });
});

// --- ROUTES PAGES ---

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/inscription", (req, res) => res.sendFile(path.join(__dirname, "public", "register-partenaire.html")));
app.get("/map", (req, res) => res.sendFile(path.join(__dirname, "public", "map.html")));
app.get("/recover", (req, res) => res.sendFile(path.join(__dirname, "public", "recover.html")));
app.get("/contrat", (req, res) => res.sendFile(path.join(__dirname, "public", "contrat.html")));

// Pages Privées
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/profil", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "profil.html")));
app.get("/tickets", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tickets.html")));
app.get("/wifi-zone", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "wifi-zone.html")));
app.get("/compta", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "compta.html")));

app.listen(PORT, () => console.log(`🚀 AERIO ALPHA LIVE SUR LE PORT ${PORT}`));
