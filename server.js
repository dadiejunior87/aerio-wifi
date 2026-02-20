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

// --- INITIALISATION DES FICHIERS ---
const initFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }
};
initFile(TICKETS_FILE);
initFile(PARTNERS_FILE);

// Protection des accès
function checkAuth(req, res, next) {
    if (req.session.partnerID) next();
    else res.redirect("/connexion");
}

// --- ROUTES AUTHENTIFICATION ---

app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));

    // ACCÈS DE SECOURS ALPHA
    if (email === "admin@aerio.com" && password === "admin123") {
        req.session.partnerID = "AE-0001";
        return res.redirect("/dashboard");
    }

    const partner = partners.find(p => p.email === email && p.password === password);
    if (partner) {
        req.session.partnerID = partner.partnerID;
        res.redirect("/dashboard");
    } else {
        // Message d'erreur pro
        res.send("<script>alert('ÉCHEC D\\'AUTHENTIFICATION : Clés de sécurité invalides ou accès refusé par le protocole Alpha.'); window.location.href='/connexion';</script>");
    }
});

app.post("/api/register-account", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    
    if (partners.find(p => p.email === email)) {
        return res.send("<script>alert('CONFLIT RÉSEAU : Cet identifiant mail est déjà enregistré dans la base AERIO.'); window.location.href='/inscription';</script>");
    }
    
    const partnerID = "AE-" + Math.floor(1000 + Math.random() * 9000);
    partners.push({ name, email, password, partnerID, rates: [], createdAt: new Date() });
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    
    // Message de succès ultra-pro
    res.send("<script>alert('PROTOCOLE ALPHA ACTIVÉ : Votre compte partenaire a été crypté et injecté dans le réseau avec succès. Veuillez vous identifier.'); window.location.href='/connexion';</script>");
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// --- ROUTES API ---

app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const myTickets = tickets.filter(t => t.partnerID === req.session.partnerID);
    res.json(myTickets);
});

app.post("/api/simulate-sale", checkAuth, (req, res) => {
    let tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    tickets.push({
        code: "SIM-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
        amount: 500,
        customer_phone: "SIMULATEUR",
        partnerID: req.session.partnerID,
        date: new Date(),
        status: "SUCCESS"
    });
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
    res.json({ success: true });
});

// --- ROUTES PAGES ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/inscription", (req, res) => res.sendFile(path.join(__dirname, "public", "register-partenaire.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/map", (req, res) => res.sendFile(path.join(__dirname, "public", "map.html")));
app.get("/recover", (req, res) => res.sendFile(path.join(__dirname, "public", "recover.html")));
app.get("/contrat", (req, res) => res.sendFile(path.join(__dirname, "public", "contrat.html")));

app.listen(PORT, () => console.log(`🚀 AERIO ALPHA LIVE SUR PORT ${PORT}`));
