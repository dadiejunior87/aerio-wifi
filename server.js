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

// --- ROUTES AUTHENTIFICATION ---

app.post("/api/register-account", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    if (partners.find(p => p.email === email)) return res.send("<script>alert('Email déjà utilisé'); window.location.href='/inscription';</script>");
    
    const partnerID = "AE-" + Math.floor(1000 + Math.random() * 9000);
    partners.push({ name, email, password, partnerID, rates: [], createdAt: new Date() });
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    res.send("<script>alert('Protocole Alpha Activé ! Connectez-vous.'); window.location.href='/connexion';</script>");
});

app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.email === email && p.password === password);

    if (partner) {
        req.session.partnerID = partner.partnerID;
        res.redirect("/dashboard");
    } else {
        res.send("<script>alert('Clés de sécurité incorrectes'); window.location.href='/connexion';</script>");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// --- ROUTES API & TRESORERIE ---

app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const myTickets = tickets.filter(t => t.partnerID === req.session.partnerID);
    res.json(myTickets);
});

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
        res.status(500).json({ error: "Interruption Moneroo" });
    }
});

// --- ROUTES PAGES PUBLIQUES ---

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/inscription", (req, res) => res.sendFile(path.join(__dirname, "public", "register-partenaire.html")));
app.get("/map", (req, res) => res.sendFile(path.join(__dirname, "public", "map.html")));
app.get("/recover", (req, res) => res.sendFile(path.join(__dirname, "public", "recover.html")));
app.get("/guide", (req, res) => res.sendFile(path.join(__dirname, "public", "guide.html")));

// ✅ ROUTE CONTRAT PARTENAIRE (AJOUTÉE)
app.get("/contrat", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "contrat.html"));
});

// --- ROUTES PAGES PRIVÉES (SÉCURISÉES) ---

app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/profil", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "profil.html")));
app.get("/tickets", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tickets.html")));
app.get("/wifi-zone", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "wifi-zone.html")));
app.get("/compta", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "compta.html")));

app.listen(PORT, () => console.log(`🚀 AERIO ALPHA LIVE SUR LE PORT ${PORT}`));
