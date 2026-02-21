const express = require("express");
const helmet = require("helmet"); 
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const session = require("express-session");
const nodemailer = require("nodemailer"); 
const cron = require("node-cron"); 
const app = express();

// --- SÉCURITÉ BASTION ALPHA ---
app.use(helmet()); 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: "ALERTE SÉCURITÉ : Trop de tentatives. Protocole Alpha activé."
});
app.use("/api/", limiter);

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

// ✅ CONFIGURATION EMAIL (Mets tes identifiants Gmail ici)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: 'ton-email@gmail.com', 
        pass: 'ton-mot-de-pass-application' 
    }
});

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

// ✅ FONCTION ALERTE VENTE INSTANTANÉE
async function envoyerAlerteVente(partnerID, montant) {
    const mailOptions = {
        from: '"AERIO ALPHA" <ton-email@gmail.com>',
        to: 'ton-email@gmail.com',
        subject: '⚡ NOUVELLE INJECTION DÉTECTÉE',
        html: `<div style="background:#020617; color:white; padding:30px; border:2px solid #00C2FF; border-radius:15px; font-family:sans-serif;">
                <h2 style="color:#00C2FF;">AERIO ALPHA 🛰️</h2>
                <p>Vente confirmée pour le partenaire <b>${partnerID}</b></p>
                <p style="color:#00F5A0; font-size:20px;"><b>TA COMMISSION (15%) : + ${(montant * 0.15).toFixed(0)} F</b></p>
               </div>`
    };
    try { await transporter.sendMail(mailOptions); } catch (e) { console.log("Erreur Mail"); }
}

// ✅ RAPPORT HEBDOMADAIRE (Chaque Dimanche à 23h59)
cron.schedule('59 23 * * 0', async () => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const brut = tickets.reduce((sum, t) => sum + t.amount, 0);
    const comm = brut * 0.15;
    const reportMail = {
        from: '"AERIO HQ" <ton-email@gmail.com>',
        to: 'ton-email@gmail.com',
        subject: '📊 BILAN HEBDOMADAIRE AERIO',
        html: `<div style="background:#020617; color:white; padding:40px; border:3px solid #7000FF; border-radius:25px; text-align:center;">
                <h1 style="color:#7000FF;">RAPPORT ALPHA 🌍</h1>
                <p>Volume Brut : ${brut.toLocaleString()} F</p>
                <h2 style="color:#00F5A0;">TON PROFIT NET : ${comm.toLocaleString()} F</h2>
               </div>`
    };
    try { await transporter.sendMail(reportMail); } catch (e) { console.log("Erreur Rapport"); }
});

// ✅ WEBHOOK MONEROO (Génération de Tickets Réels)
app.post("/api/moneroo-webhook", async (req, res) => {
    const { status, metadata, amount } = req.body.data;
    if (status === "completed") {
        const { router_id, duration, phone } = metadata;
        const wifiCode = "AE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        let tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
        tickets.push({ code: wifiCode, amount, partnerID: router_id, duration, customer_phone: phone, date: new Date(), status: "SUCCESS" });
        fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
        await envoyerAlerteVente(router_id, amount);
        res.status(200).send("OK");
    } else { res.status(400).send("Échec"); }
});

// --- ROUTES PAGES ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/inscription", (req, res) => res.sendFile(path.join(__dirname, "public", "register-partenaire.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/wifi-zone", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "wifi-zone.html")));
app.get("/tickets", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tickets.html")));
app.get("/compta", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "compta.html")));
app.get("/profil", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "profil.html")));
app.get("/admin-alpha", (req, res) => {
    if (req.session.partnerID === "AE-0001") res.sendFile(path.join(__dirname, "public", "admin-alpha.html"));
    else res.status(403).send("ACCÈS REFUSÉ");
});

// --- API AUTH & LOGIQUE ---
app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@aerio.com" && password === "admin123") {
        req.session.partnerID = "AE-0001";
        return res.redirect("/dashboard");
    }
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.email === email && p.password === password);
    if (partner) { req.session.partnerID = partner.partnerID; res.redirect("/dashboard"); }
    else res.status(401).send("<script>alert('Clés invalides'); window.location.href='/connexion';</script>");
});

app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    res.json(tickets.filter(t => t.partnerID === req.session.partnerID));
});

app.post("/api/simulate-sale", checkAuth, async (req, res) => {
    let tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const montant = 500;
    tickets.push({ code: "SIM-" + Math.random().toString(36).substring(2, 7).toUpperCase(), amount: montant, partnerID: req.session.partnerID, date: new Date(), status: "SUCCESS" });
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
    await envoyerAlerteVente(req.session.partnerID, montant);
    res.json({ success: true });
});

app.get("/logout", (req, res) => { req.session.destroy(); res.redirect("/"); });

app.listen(PORT, () => console.log(`🚀 AERIO ALPHA BASTION OPÉRATIONNEL SUR PORT ${PORT}`));
