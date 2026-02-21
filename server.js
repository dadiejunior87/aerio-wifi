const express = require("express");
const helmet = require("helmet"); 
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const session = require("express-session");
const nodemailer = require("nodemailer"); 
const twilio = require("twilio"); 
const app = express();

// --- CONFIGURATION ÉLITE ---
const PORT = process.env.PORT || 10000;
const ADMIN_PHONE = "237691285152"; 
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");
const MONEROO_KEY = process.env.MONEROO_SECRET || "CLE_TEST_MONEROO";

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

// ✅ [PRO] ROUTE TOP 3 ALPHA - VERROUILLÉE AU QG (AE-0001) [1.2]
app.get("/api/top-performers", checkAuth, (req, res) => {
    // 🛡️ SÉCURITÉ ADMIN : Seul le compte Maître peut voir ces données stratégiques
    if (req.session.partnerID !== "AE-0001") {
        return res.status(403).json({ error: "Accès réservé au QG Alpha" });
    }

    try {
        const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
        const salesByPartner = {};

        tickets.forEach(t => {
            salesByPartner[t.partnerID] = (salesByPartner[t.partnerID] || 0) + t.amount;
        });

        const top3 = Object.entries(salesByPartner)
            .map(([id, total]) => ({ id, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);

        res.json(top3);
    } catch (e) { res.json([]); }
});

// ✅ AJOUTER UN TARIF (POUR LE PARTENAIRE)
app.post("/api/add-tarif", checkAuth, (req, res) => {
    const { name, price, duration } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const idx = partners.findIndex(p => p.partnerID === req.session.partnerID);
    if (idx !== -1) {
        if (!partners[idx].tarifs) partners[idx].tarifs = [];
        partners[idx].tarifs.push({ id: "TRF-" + Date.now(), name, price, duration, active: true });
        fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
        res.json({ success: true });
    } else { res.status(404).json({ error: "Non trouvé" }); }
});

// ✅ RÉCUPÉRER LES TARIFS POUR LA BOUTIQUE
app.get("/api/get-shop-tarifs/:partnerID", (req, res) => {
    const { partnerID } = req.params;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.partnerID === partnerID);
    if (partner && partner.tarifs) res.json(partner.tarifs);
    else res.json([{ name: "Pass Flash", price: 100, duration: "1H" }]);
});

// ✅ SIMULATION DE VENTE
app.post("/api/simulate-sale", checkAuth, (req, res) => {
    let tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const fakeTicket = {
        code: "SIM-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
        amount: 500,
        partnerID: req.session.partnerID,
        date: new Date(),
        status: "SUCCESS"
    };
    tickets.push(fakeTicket);
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
    res.json({ success: true, ticket: fakeTicket });
});

// ✅ WEBHOOK MONEROO
app.post("/api/moneroo-webhook", async (req, res) => {
    const { status, metadata, amount } = req.body.data;
    if (status === "completed") {
        const { partnerID, type, router_id } = metadata;
        if (type === "LICENSE_ACTIVATION") {
            let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
            const idx = partners.findIndex(p => p.partnerID === partnerID);
            if (idx !== -1) {
                partners[idx].licence = "ACTIVE";
                fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
            }
        } else {
            const wifiCode = "AE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
            let tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
            tickets.push({ code: wifiCode, amount, partnerID: router_id || partnerID, date: new Date(), status: "SUCCESS" });
            fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
        }
        res.status(200).send("OK");
    }
});

// ✅ ROUTES PAGES & AUTH
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/wifi-zone", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "wifi-zone.html")));
app.get("/tarifs", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tarifs.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));

app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@aerio.com" && password === "admin123") {
        req.session.partnerID = "AE-0001";
        return res.redirect("/dashboard");
    }
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.email === email && p.password === password);
    if (partner) { req.session.partnerID = partner.partnerID; res.redirect("/dashboard"); }
    else res.status(401).send("Erreur");
});

app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    res.json(tickets.filter(t => t.partnerID === req.session.partnerID).sort((a,b) => new Date(b.date) - new Date(a.date)));
});

app.get("/logout", (req, res) => { req.session.destroy(); res.redirect("/"); });

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 BASTION ALPHA LIVE SUR PORT ${PORT}`));
