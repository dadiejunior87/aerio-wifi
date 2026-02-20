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
// Utilisation d'un TRY/CATCH pour éviter que Render ne plante si le fichier est mal placé
try {
    const monerooWebhook = require('./api/webhook/moneroo');
    app.use('/api/webhook/moneroo', monerooWebhook);
    console.log("✅ Webhook Moneroo chargé");
} catch (e) {
    console.log("⚠️ Attention: Fichier api/webhook/moneroo.js introuvable. Créez-le pour activer les paiements.");
}

// --- ROUTES AUTHENTIFICATION ---

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

app.get("/api/admin/stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const myTickets = tickets.filter(t => t.partnerID === req.session.partnerID && t.status === "SUCCESS");
    const totalCA = myTickets.reduce((sum, t) => sum + t.amount, 0);
    res.json({ solde: totalCA * 0.15, totalGeneré: totalCA });
});

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
        res.status(500).json({ error: "Erreur Moneroo" });
    }
});

// --- ROUTES PAGES ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/inscription", (req, res) => res.sendFile(path.join(__dirname, "public", "register-partenaire.html")));

app.listen(PORT, () => console.log(`🚀 AERIO LIVE SUR PORT ${PORT}`));
