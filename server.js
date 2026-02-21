const express = require("express");
const helmet = require("helmet"); 
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const app = express();

// --- CONFIGURATION ÉLITE ---
const PORT = process.env.PORT || 10000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

// --- SÉCURITÉ BASTION ---
app.use(helmet({ contentSecurityPolicy: false })); 
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); 

app.use(session({
    secret: 'AERIO_ULTRA_SECRET_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
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

// ✅ [NOUVEAU] PROTOCOLE DE PURGE ALPHA (RÉSERVÉ AE-0001) [1.2]
// Tape ://ton-site.com pour remettre les compteurs à 0 F
app.get("/api/admin/purge", checkAuth, (req, res) => {
    if (req.session.partnerID !== "AE-0001") return res.status(403).send("ACCÈS REFUSÉ");
    
    // On écrase les ventes de test par un tableau vide
    fs.writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2));
    
    res.send("<script>alert('EMPIRE PURGÉ : Toutes les données de test ont été supprimées. Votre compteur affiche désormais 0 F CFA.'); window.location.href='/dashboard';</script>");
});

// ✅ ROUTE TOP 3 ALPHA - SÉCURISÉE [1.2]
app.get("/api/top-performers", checkAuth, (req, res) => {
    if (req.session.partnerID !== "AE-0001") return res.status(403).json({ error: "Accès réservé" });
    try {
        const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
        if (tickets.length === 0) return res.json([]); // Renvoie vide si pas de ventes

        const salesByPartner = {};
        tickets.forEach(t => { salesByPartner[t.partnerID] = (salesByPartner[t.partnerID] || 0) + t.amount; });
        const top3 = Object.entries(salesByPartner).map(([id, total]) => ({ id, total })).sort((a, b) => b.total - a.total).slice(0, 3);
        res.json(top3);
    } catch (e) { res.json([]); }
});

// ✅ RÉCUPÉRER LES TARIFS POUR LA BOUTIQUE
app.get("/api/get-shop-tarifs/:partnerID", (req, res) => {
    const { partnerID } = req.params;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.partnerID === partnerID);
    if (partner && partner.tarifs) res.json(partner.tarifs);
    else res.json([{ name: "Pass Flash", price: 100, duration: "1H" }]);
});

// ✅ ROUTES PAGES
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/boutique", (req, res) => res.sendFile(path.join(__dirname, "public", "boutique.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/wifi-zone", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "wifi-zone.html")));
app.get("/tarifs", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tarifs.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));

// ✅ API AUTH
app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@aerio.com" && password === "admin123") {
        req.session.partnerID = "AE-0001";
        return res.redirect("/dashboard");
    }
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.email === email && p.password === password);
    if (partner) { req.session.partnerID = partner.partnerID; res.redirect("/dashboard"); }
    else res.status(401).send("Identifiants invalides.");
});

app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    res.json(tickets.filter(t => t.partnerID === req.session.partnerID).sort((a,b) => new Date(b.date) - new Date(a.date)));
});

app.get("/logout", (req, res) => { req.session.destroy(); res.redirect("/"); });

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 BASTION ALPHA LIVE SUR PORT ${PORT}`));
