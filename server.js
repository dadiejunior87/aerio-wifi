const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const session = require("express-session");
const nodemailer = require("nodemailer"); 
const cron = require("node-cron"); // ✅ AJOUT DU MOTEUR DE TEMPS
const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

// ✅ CONFIGURATION EMAIL (À remplir avec tes accès Google)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ton-email@gmail.com', 
        pass: 'votre-mot-de-passe-application' 
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: 'AERIO_CYBER_PRO_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// --- INITIALISATION DES FICHIERS ---
const initFile = (filePath) => {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([], null, 2));
};
initFile(TICKETS_FILE);
initFile(PARTNERS_FILE);

function checkAuth(req, res, next) {
    if (req.session.partnerID) next();
    else res.redirect("/connexion");
}

// ✅ FONCTION D'ALERTE INSTANTANÉE
async function envoyerAlerteVente(partnerID, montant) {
    const mailOptions = {
        from: '"AERIO ALPHA" <ton-email@gmail.com>',
        to: 'ton-email@gmail.com',
        subject: '⚡ NOUVELLE INJECTION DÉTECTÉE',
        html: `<div style="font-family:sans-serif; background:#020617; color:white; padding:30px; border:2px solid #00C2FF; border-radius:20px;">
                <h1 style="color:#00C2FF;">AERIO ALPHA 🛰️</h1>
                <p>Vente validée pour ID : <b>${partnerID}</b></p>
                <p style="color:#00F5A0; font-size:20px;"><b>TA COMMISSION (15%) : + ${(montant * 0.15).toFixed(0)} F</b></p>
               </div>`
    };
    try { await transporter.sendMail(mailOptions); } catch (e) { console.log("Erreur Mail"); }
}

// ✅ RAPPORT HEBDOMADAIRE AUTOMATIQUE (Chaque Dimanche à 23h59)
cron.schedule('59 23 * * 0', async () => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    
    const volumeBrut = tickets.reduce((sum, t) => sum + t.amount, 0);
    const taCommission = volumeBrut * 0.15;

    const reportMail = {
        from: '"AERIO ALPHA HQ" <ton-email@gmail.com>',
        to: 'ton-email@gmail.com',
        subject: '📊 BILAN HEBDOMADAIRE DU RÉSEAU',
        html: `<div style="font-family:sans-serif; background:#020617; color:white; padding:40px; border:3px solid #7000FF; border-radius:30px; text-align:center;">
                <h1 style="color:#7000FF;">RAPPORT ALPHA 🌍</h1>
                <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:15px; margin-top:20px;">
                    <p>📈 Volume Brut : ${volumeBrut.toLocaleString()} F</p>
                    <p>👥 Partenaires : ${partners.length}</p>
                    <h2 style="color:#00F5A0;">TON PROFIT NET : ${taCommission.toLocaleString()} F</h2>
                </div>
               </div>`
    };
    try { await transporter.sendMail(reportMail); } catch (e) { console.log("Erreur Rapport"); }
});

// --- ROUTES API ---

app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@aerio.com" && password === "admin123") {
        req.session.partnerID = "AE-0001";
        return res.redirect("/dashboard");
    }
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.email === email && p.password === password);
    if (partner) { req.session.partnerID = partner.partnerID; res.redirect("/dashboard"); }
    else res.send("<script>alert('Clés incorrectes'); window.location.href='/connexion';</script>");
});

app.post("/api/simulate-sale", checkAuth, async (req, res) => {
    let tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const montant = 500;
    tickets.push({ code: "SIM-" + Math.random().toString(36).substring(2, 7).toUpperCase(), amount: montant, partnerID: req.session.partnerID, date: new Date(), status: "SUCCESS" });
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
    await envoyerAlerteVente(req.session.partnerID, montant);
    res.json({ success: true });
});

// --- ROUTES PAGES ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/admin-alpha", (req, res) => {
    if (req.session.partnerID === "AE-0001") res.sendFile(path.join(__dirname, "public", "admin-alpha.html"));
    else res.send("Interdit");
});

app.listen(PORT, () => console.log(`🚀 AERIO ALPHA LIVE SUR PORT ${PORT}`));
