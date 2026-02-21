const express = require("express");
const helmet = require("helmet"); 
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const session = require("express-session");
const nodemailer = require("nodemailer"); 
const cron = require("node-cron"); 
const twilio = require("twilio"); 
const app = express();

// --- CONFIGURATION ÉLITE ---
const PORT = process.env.PORT || 3000;
const ADMIN_PHONE = "237691285152"; // ✅ TON ORANGE MONEY POUR LES REVENUS
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

// --- SÉCURITÉ BASTION ---
app.use(helmet()); 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 100, 
    message: "ALERTE SÉCURITÉ : Protocole Alpha activé."
});
app.use("/api/", limiter);

// --- SERVICES (EMAIL & SMS) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'votre-email@gmail.com', pass: 'votre-pass-app' }
});
const smsClient = new twilio('TON_ACCOUNT_SID', 'TON_AUTH_TOKEN');

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

// ✅ ROUTE PAIEMENT LICENCE (5 000 F)
app.post("/api/pay-license", checkAuth, async (req, res) => {
    try {
        const response = await axios.post("https://api.moneroo.io", {
            amount: 5000, 
            currency: "XAF",
            description: `Activation Licence Alpha - Partenaire ${req.session.partnerID}`,
            metadata: { type: "LICENSE_ACTIVATION", partnerID: req.session.partnerID },
            return_url: `${req.protocol}://${req.get('host')}/dashboard?success=true`
        }, {
            headers: { 'Authorization': `Bearer ${process.env.MONEROO_SECRET}` }
        });
        res.json({ checkout_url: response.data.data.checkout_url });
    } catch (e) { res.status(500).json({ error: "Erreur Moneroo" }); }
});

// ✅ WEBHOOK MONEROO (VENTES + LICENCES)
app.post("/api/moneroo-webhook", async (req, res) => {
    const { status, metadata, amount } = req.body.data;
    if (status === "completed") {
        if (metadata.type === "LICENSE_ACTIVATION") {
            // ACTIVATION AUTO DE LA LICENCE
            let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
            const idx = partners.findIndex(p => p.partnerID === metadata.partnerID);
            if (idx !== -1) {
                partners[idx].licence = "ACTIVE";
                fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
            }
        } else {
            // GÉNÉRATION DE TICKET WIFI
            const { router_id, duration, phone } = metadata;
            const wifiCode = "AE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
            let tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
            tickets.push({ code: wifiCode, amount, partnerID: router_id, duration, customer_phone: phone, date: new Date(), status: "SUCCESS" });
            fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
            if (phone) await envoyerSmsTicket(phone, wifiCode, duration);
        }
        res.status(200).send("OK");
    }
});

// ✅ RETRAIT VERS TON ORANGE MONEY (691285152)
app.post("/api/admin-withdraw", async (req, res) => {
    if (req.session.partnerID !== "AE-0001") return res.status(403).send("Interdit");
    try {
        const response = await axios.post("https://api.moneroo.io", {
            amount: req.body.amount,
            currency: "XAF",
            method: "orange_money",
            phone: ADMIN_PHONE,
            description: "Retrait Commission AERIO Alpha"
        }, {
            headers: { 'Authorization': `Bearer ${process.env.MONEROO_SECRET}` }
        });
        res.json({ success: true, msg: "Transfert vers Orange Money lancé" });
    } catch (e) { res.status(500).json({ error: "Erreur de transfert" }); }
});

// --- ROUTES PAGES & AUTH ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/admin-alpha", (req, res) => {
    if (req.session.partnerID === "AE-0001") res.sendFile(path.join(__dirname, "public", "admin-alpha.html"));
    else res.status(403).send("Accès refusé");
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
    else res.status(401).send("<script>alert('Identifiants invalides'); window.location.href='/connexion';</script>");
});

app.listen(PORT, () => console.log(`🚀 AERIO ALPHA BASTION V3 LIVE SUR PORT ${PORT}`));
