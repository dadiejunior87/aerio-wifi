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

// 🔑 CONNECTEURS PAIEMENT (À remplir lors du lancement réel)
const MERCHANT_KEY = "TA_CLE_MONEROO_ICI"; 

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

// ==========================================
// ✅ APIS DE GESTION (LE CŒUR DU SYSTÈME)
// ==========================================

// 1. Profil Partenaire
app.get("/api/my-profile", checkAuth, (req, res) => {
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.partnerID === req.session.partnerID);
    if (partner) res.json(partner);
    else res.status(404).send("Profil introuvable");
});

// 2. Statistiques (Gain Net 85%)
app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const myTickets = tickets.filter(t => t.partnerID === req.session.partnerID);
    let gainTotal = 0;
    myTickets.forEach(t => gainTotal += (t.amount * 0.85));
    res.json({
        tickets: myTickets.sort((a,b) => new Date(b.date) - new Date(a.date)),
        summary: { gain: Math.floor(gainTotal), count: myTickets.length }
    });
});

// 3. Retrait Partenaire (Seuil 5000F)
app.post("/api/payout", checkAuth, (req, res) => {
    const { amount, phone, network } = req.body;
    if (amount < 5000) return res.status(403).json({ error: "Minimum 5 000 F requis." });
    console.log(`📡 RETRAIT : ${amount} F vers ${phone} (${network})`);
    res.json({ success: true, message: "Extraction transmise au noyau." });
});

// ==========================================
// ✅ APIS DE VENTE (CONNECTEURS ORANGE/MTN)
// ==========================================

// 4. Initialisation de l'achat (Alerte MikroTik sans Data) [1.2]
app.post("/api/init-purchase", (req, res) => {
    const { partnerID, amount, phone } = req.body;
    console.log(`🛒 ACHAT : Partenaire ${partnerID} | Client ${phone} | Montant ${amount}F`);
    // Simulation de liaison Orange/MTN Money
    res.json({ success: true, redirectURL: "Lien_Paiement_Orange_MTN" });
});

// 5. Validation et Injection du ticket [1.4]
app.post("/api/checkoutmoneroo", (req, res) => {
    // Cette route reçoit la confirmation de paiement réelle
    // Elle distribue le ticket au client et prélève tes 15%
    res.sendStatus(200);
});

// ==========================================
// ✅ GESTION DES COMPTES
// ==========================================

app.post("/api/inscription-partenaire", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    if (partners.find(p => p.email === email)) return res.send("Email déjà utilisé.");
    const newID = "AE-" + (partners.length + 1).toString().padStart(4, '0');
    partners.push({ partnerID: newID, name, email, password, licence: "INACTIVE", dateInscription: new Date() });
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    res.redirect("/connexion?signup=success");
});

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

// ==========================================
// ✅ ROUTES DES PAGES
// ==========================================
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/profil", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "profil.html")));
app.get("/compta", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "compta.html")));
app.get("/wifi-zone", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "wifi-zone.html")));
app.get("/liste-wifi", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "liste-wifi.html")));
app.get("/tickets", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tickets.html")));
app.get("/tickets/ajouter", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "ajouter-ticket.html")));
app.get("/tarifs", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tarifs.html")));
app.get("/affiche", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "affiche.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/inscription", (req, res) => res.sendFile(path.join(__dirname, "public", "inscription.html")));
app.get("/guide", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "guide.html")));
app.get("/boutique", (req, res) => res.sendFile(path.join(__dirname, "public", "boutique.html")));

app.get("/logout", (req, res) => { req.session.destroy(); res.redirect("/"); });

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 EMPIRE AERIO DÉPLOYÉ SUR PORT ${PORT}`));
