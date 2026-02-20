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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: 'AERIO_CYBER_PRO_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// --- INITIALISATION ---
const initFile = (filePath) => {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([], null, 2));
};
initFile(TICKETS_FILE);
initFile(PARTNERS_FILE);

function checkAuth(req, res, next) {
    if (req.session.partnerID) next();
    else res.redirect("/connexion");
}

// --- CHATBOT ALPHA (RÉPONSES AUTOMATIQUES) ---
app.post("/api/chatbot", (req, res) => {
    const msg = req.body.message.toLowerCase();
    let response = "Requête non reconnue par le noyau. Tapez 'AIDE' pour les protocoles.";

    if (msg.includes("ticket") || msg.includes("perdu")) {
        response = "Protocole de récupération 🎟️ : Allez sur la page RECOVER et saisissez votre numéro de paiement.";
    } else if (msg.includes("argent") || msg.includes("gain") || msg.includes("pourcentage")) {
        response = "Trésorerie 💰 : Le partenaire perçoit 85% net. Commission réseau 15%. Retrait via l'onglet COMPTA.";
    } else if (msg.includes("mikrotik") || msg.includes("configurer")) {
        response = "Activation ⚙️ : Consultez le GUIDE technique pour lier votre routeur en 3 étapes API.";
    } else if (msg.includes("aide") || msg.includes("bonjour")) {
        response = "Système Alpha actif 🤖. Je peux vous aider sur : TICKETS, GAINS, MIKROTIK ou RETRAITS.";
    }
    res.json({ reply: response });
});

// --- ROUTES AUTHENTIFICATION ---
app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    if (email === "admin@aerio.com" && password === "admin123") {
        req.session.partnerID = "AE-0001";
        return res.redirect("/dashboard");
    }
    const partner = partners.find(p => p.email === email && p.password === password);
    if (partner) {
        req.session.partnerID = partner.partnerID;
        res.redirect("/dashboard");
    } else {
        res.send("<script>alert('ÉCHEC : Accès refusé par le protocole Alpha.'); window.location.href='/connexion';</script>");
    }
});

app.post("/api/register-account", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    if (partners.find(p => p.email === email)) return res.send("<script>alert('CONFLIT RÉSEAU : Email déjà utilisé.'); window.location.href='/inscription';</script>");
    const partnerID = "AE-" + Math.floor(1000 + Math.random() * 9000);
    partners.push({ name, email, password, partnerID, rates: [], createdAt: new Date() });
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    res.redirect("/success-init");
});

// --- ROUTES API ---
app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    res.json(tickets.filter(t => t.partnerID === req.session.partnerID));
});

// --- ROUTES PAGES ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/inscription", (req, res) => res.sendFile(path.join(__dirname, "public", "register-partenaire.html")));
app.get("/success-init", (req, res) => res.sendFile(path.join(__dirname, "public", "success-animation.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/recover", (req, res) => res.sendFile(path.join(__dirname, "public", "recover.html")));
app.get("/guide", (req, res) => res.sendFile(path.join(__dirname, "public", "guide.html")));
app.get("/faq", (req, res) => res.sendFile(path.join(__dirname, "public", "faq.html")));
app.get("/contrat", (req, res) => res.sendFile(path.join(__dirname, "public", "contrat.html")));
app.get("/compta", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "compta.html")));
app.get("/logout", (req, res) => { req.session.destroy(); res.redirect("/"); });

app.listen(PORT, () => console.log(`🚀 AERIO ALPHA V3 OPÉRATIONNEL SUR PORT ${PORT}`));
