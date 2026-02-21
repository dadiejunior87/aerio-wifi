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

// --- INITIALISATION DES NOYAUX ---
const initFile = (filePath) => {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([], null, 2));
};
initFile(TICKETS_FILE);
initFile(PARTNERS_FILE);

function checkAuth(req, res, next) {
    if (req.session.partnerID) next();
    else res.redirect("/connexion");
}

// ✅ [PRO] STATISTIQUES GLOBALES POUR L'ACCUEIL (INDEX.HTML) [1.2, 1.4]
app.get("/api/global-stats", (req, res) => {
    try {
        const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
        const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
        let total = 0;
        tickets.forEach(t => total += (t.amount || 0));
        res.json({ total: total, nodeCount: partners.length });
    } catch (e) { res.json({ total: 0, nodeCount: 0 }); }
});

// ✅ INSCRIPTION AUTOMATIQUE ALPHA
app.post("/api/inscription-partenaire", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    if (partners.find(p => p.email === email)) return res.send("Email déjà utilisé.");

    const newID = "AE-" + (partners.length + 1).toString().padStart(4, '0');
    const newPartner = {
        partnerID: newID, name, email, password,
        licence: "INACTIVE", tarifs: [], dateInscription: new Date()
    };
    partners.push(newPartner);
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    res.redirect("/connexion?signup=success");
});

// ✅ PROTOCOLE DE PURGE (RÉSERVÉ ADMIN AE-0001)
app.get("/api/admin/purge", checkAuth, (req, res) => {
    if (req.session.partnerID !== "AE-0001") return res.status(403).send("ACCÈS REFUSÉ");
    fs.writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2));
    res.send("<script>alert('EMPIRE PURGÉ : Compteurs à 0 F.'); window.location.href='/dashboard';</script>");
});

// ✅ STATISTIQUES PARTENAIRES (DASHBOARD)
app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const myTickets = tickets.filter(t => t.partnerID === req.session.partnerID);
    let brut = 0;
    myTickets.forEach(t => brut += (t.amount || 0));
    res.json({
        tickets: myTickets.sort((a,b) => new Date(b.date) - new Date(a.date)),
        summary: { brut: brut, net: brut * 0.85, count: myTickets.length }
    });
});

// ✅ RÉCUPÉRATION DES TARIFS DYNAMIQUE
app.get("/api/get-shop-tarifs/:partnerID", (req, res) => {
    const { partnerID } = req.params;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.partnerID === partnerID);
    if (partner && partner.tarifs) res.json(partner.tarifs);
    else res.json([{ name: "Pass Flash", price: 100, duration: "1H" }]);
});

// ✅ ROUTES PAGES RÉORGANISÉES [1.1, 1.3]
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/boutique", (req, res) => res.sendFile(path.join(__dirname, "public", "boutique.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/wifi-zone", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "wifi-zone.html")));
app.get("/tarifs", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tarifs.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/inscription", (req, res) => res.sendFile(path.join(__dirname, "public", "inscription.html")));

// ✅ AUTHENTIFICATION
app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@aerio.com" && password === "admin123") {
        req.session.partnerID = "AE-0001";
        return res.redirect("/dashboard");
    }
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.email === email && p.password === password);
    if (partner) { req.session.partnerID = partner.partnerID; res.redirect("/dashboard"); }
    else res.status(401).send("Erreur.");
});

app.get("/logout", (req, res) => { req.session.destroy(); res.redirect("/"); });

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 EMPIRE AERIO LIVE SUR PORT ${PORT}`));
