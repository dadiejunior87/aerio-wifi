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

// Configuration des Sessions (Sécurité AERIO)
app.use(session({
    secret: 'AERIO_SUPER_SECRET_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// --- INITIALISATION AUTOMATIQUE DES FICHIERS ---
const initFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        console.log(`✅ Fichier ${path.basename(filePath)} créé avec succès !`);
    }
};

initFile(TICKETS_FILE);
initFile(PARTNERS_FILE);

// Fonction de protection des pages privées
function checkAuth(req, res, next) {
    if (req.session.partnerID) next();
    else res.redirect("/connexion");
}

// --- IMPORTATION DES ROUTES API (WEBHOOKS) ---
// On branche ton nouveau dossier api/webhook/moneroo.js ici
const monerooWebhook = require('./api/webhook/moneroo');
app.use('/api/webhook/moneroo', monerooWebhook);


// --- ROUTES AUTHENTIFICATION & COMPTE ---

app.post("/api/register-account", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    if (partners.find(p => p.email === email)) return res.send("<script>alert('Email déjà utilisé'); window.location.href='/inscription';</script>");
    
    const partnerID = "AE-" + Math.floor(1000 + Math.random() * 9000);
    partners.push({ name, email, password, partnerID, rates: [], createdAt: new Date() });
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    res.send("<script>alert('Bienvenue chez AERIO ! Connectez-vous.'); window.location.href='/connexion';</script>");
});

app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.email === email && p.password === password);

    if (partner) {
        req.session.partnerID = partner.partnerID;
        req.session.name = partner.name;
        res.redirect("/dashboard");
    } else {
        res.send("<script>alert('Email ou mot de passe incorrect'); window.location.href='/connexion';</script>");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// --- ROUTES API GESTION ---

app.post("/api/save-rate", checkAuth, (req, res) => {
    const { prix, duree } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    let partner = partners.find(p => p.partnerID === req.session.partnerID);
    if (partner) {
        partner.rates.push({ prix: parseInt(prix), duree });
        fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
        res.json({ success: true });
    }
});

app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const myTickets = tickets.filter(t => t.partnerID === req.session.partnerID);
    res.json(myTickets);
});

// --- SYSTÈME DE PAIEMENT (MONEROO) ---

app.post("/api/pay", async (req, res) => {
    const { amount, duration, router_id, phone } = req.body;
    try {
        const response = await axios.post('https://api.moneroo.io/v1/payments', {
            amount: parseInt(amount),
            currency: 'XAF',
            customer: { phone: phone, name: "Client WiFi" },
            return_url: `https://${req.get('host')}/success.html`,
            notify_url: `https://${req.get('host')}/api/webhook/moneroo`,
            metadata: { router_id, duration, phone }
        }, {
            headers: { 'Authorization': `Bearer ${process.env.MONEROO_API_KEY}` }
        });
        res.json({ checkout_url: response.data.data.checkout_url });
    } catch (e) {
        console.error("Erreur Moneroo:", e.response ? e.response.data : e.message);
        res.status(500).json({ error: "Erreur lors de l'initialisation du paiement" });
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

// Pages privées
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/profil", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "profil.html")));
app.get("/tickets", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tickets.html")));
app.get("/wifi-zone", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "wifi-zone.html")));
app.get("/compta", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "compta.html")));

app.listen(PORT, () => console.log(`🚀 AERIO PLATFORME LIVE SUR PORT ${PORT}`));
