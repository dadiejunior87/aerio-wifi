const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const session = require("express-session");
const nodemailer = require("nodemailer"); // ✅ MOTEUR D'ALERTE
const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

// ✅ CONFIGURATION DE TON COMPTE EMAIL (Gmail recommandé)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ton-email@gmail.com', // Met ton vrai Gmail ici
        pass: 'votre-mot-de-passe-application' // Utilise un "Mot de passe d'application" Google
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

// ✅ FONCTION D'ALERTE ALPHA (Envoi d'e-mail)
async function envoyerAlerteVente(partnerID, montant) {
    const mailOptions = {
        from: '"AERIO ALPHA" <ton-email@gmail.com>',
        to: 'ton-email@gmail.com', // Reçois l'alerte ici
        subject: '⚡ AERIO ALPHA - NOUVELLE INJECTION DÉTECTÉE',
        html: `
            <div style="font-family: sans-serif; background: #020617; color: white; padding: 30px; border: 2px solid #00C2FF; border-radius: 20px;">
                <h1 style="color: #00C2FF;">AERIO ALPHA 🛰️</h1>
                <p>Une nouvelle transaction a été validée dans le noyau.</p>
                <hr style="border: 0.5px solid #1e293b;">
                <p><b>ID Partenaire :</b> ${partnerID}</p>
                <p><b>Montant Brut :</b> ${montant} F</p>
                <p style="color: #00F5A0; font-size: 20px;"><b>Ta Commission (15%) : + ${(montant * 0.15).toFixed(0)} F 💰</b></p>
                <p style="font-size: 10px; color: #475569;">Protocole de surveillance actif - 99.9% Stable</p>
            </div>
        `
    };
    try { await transporter.sendMail(mailOptions); } catch (e) { console.log("Erreur mail"); }
}

// --- ROUTES AUTH & API ---

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
    
    // ✅ DÉCLENCHE L'ALERTE DÈS LA VENTE
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
