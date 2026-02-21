const express = require("express");
const helmet = require("helmet"); 
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const session = require("express-session");
const nodemailer = require("nodemailer"); 
const cron = require("node-cron"); 
const twilio = require("twilio"); // ✅ MOTEUR SMS ALPHA
const app = express();

// --- SÉCURITÉ BASTION ALPHA ---
app.use(helmet()); 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: "ALERTE SÉCURITÉ : Protocole Alpha activé."
});
app.use("/api/", limiter);

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

// ✅ CONFIGURATION EMAIL
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'votre-email@gmail.com', pass: 'votre-pass-app' }
});

// ✅ CONFIGURATION SMS TWILIO
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

// ✅ FONCTION ALERTE VENTE (EMAIL)
async function envoyerAlerteVente(partnerID, montant) {
    const mailOptions = {
        from: '"AERIO ALPHA" <votre-email@gmail.com>',
        to: 'votre-email@gmail.com',
        subject: '⚡ NOUVELLE INJECTION DÉTECTÉE',
        html: `<div style="background:#020617; color:white; padding:30px; border:2px solid #00C2FF; border-radius:15px; font-family:sans-serif;">
                <h2 style="color:#00C2FF;">AERIO ALPHA 🛰️</h2>
                <p>Vente confirmée : <b>${partnerID}</b> | Commission (15%): <b>+ ${(montant * 0.15).toFixed(0)} F</b></p>
               </div>`
    };
    try { await transporter.sendMail(mailOptions); } catch (e) { console.log("Erreur Mail"); }
}

// ✅ FONCTION ENVOI TICKET (SMS)
async function envoyerSmsTicket(phone, code, duration) {
    try {
        await smsClient.messages.create({
            body: `[AERIO ALPHA] 🎟️ Votre ticket WiFi est prêt !\nCODE : ${code}\nDUREE : ${duration}\nBonne navigation sur le réseau Élite.`,
            from: 'AERIO',
            to: phone
        });
        console.log(`📱 SMS envoyé au ${phone}`);
    } catch (e) { console.log("Erreur SMS Twilio"); }
}

// ✅ RAPPORT HEBDOMADAIRE (Dimanche 23h59)
cron.schedule('59 23 * * 0', async () => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const brut = tickets.reduce((sum, t) => sum + t.amount, 0);
    const reportMail = {
        from: '"AERIO HQ" <votre-email@gmail.com>',
        to: 'votre-email@gmail.com',
        subject: '📊 BILAN HEBDOMADAIRE AERIO',
        html: `<h1 style="color:#7000FF;">RAPPORT ALPHA 🌍</h1><p>Profit Net : ${(brut * 0.15).toLocaleString()} F</p>`
    };
    try { await transporter.sendMail(reportMail); } catch (e) { console.log("Erreur Rapport"); }
});

// ✅ WEBHOOK MONEROO (GENERATEUR + SMS)
app.post("/api/moneroo-webhook", async (req, res) => {
    const { status, metadata, amount } = req.body.data;
    if (status === "completed") {
        const { router_id, duration, phone } = metadata;
        const wifiCode = "AE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        let tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
        tickets.push({ code: wifiCode, amount, partnerID: router_id, duration, customer_phone: phone, date: new Date(), status: "SUCCESS" });
        fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
        
        await envoyerAlerteVente(router_id, amount);
        if (phone) await envoyerSmsTicket(phone, wifiCode, duration); // 📲 ENVOI SMS
        
        res.status(200).send("OK");
    } else { res.status(400).send("ECHEC"); }
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

// --- API AUTH ---
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
    tickets.push({ code: "SIM-" + Math.random().toString(36).substring(2, 7).toUpperCase(), amount: 500, partnerID: req.session.partnerID, date: new Date(), status: "SUCCESS" });
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
    await envoyerAlerteVente(req.session.partnerID, 500);
    res.json({ success: true });
});

app.get("/logout", (req, res) => { req.session.destroy(); res.redirect("/"); });

app.listen(PORT, () => console.log(`🚀 AERIO ALPHA BASTION V3 LIVE SUR PORT ${PORT}`));
