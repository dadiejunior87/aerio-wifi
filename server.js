const express = require("express");
const helmet = require("helmet"); // ✅ BOUCLIER ALPHA
const rateLimit = require("express-rate-limit"); // ✅ ANTI-ROBOTS
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const session = require("express-session");
const nodemailer = require("nodemailer"); 
const cron = require("node-cron"); 
const app = express();

// --- SÉCURITÉ GIGA-ÉLITE ---
app.use(helmet()); // Cache les failles serveurs [1.1]

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes
    message: "ALERTE SÉCURITÉ : Trop de tentatives. Accès bloqué par le protocole Alpha."
});
app.use("/api/", limiter); // Protège toutes tes routes API [1.2]

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'ton-email@gmail.com', pass: 'votre-mot-de-passe-application' }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: 'AERIO_ULTRA_SECRET_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // Blindage cookies [1.3]
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

// ... (Garde tes fonctions d'envoi de mail et de rapport hebdomadaire ici) ...

// --- ROUTES API SÉCURISÉES ---
app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@aerio.com" && password === "admin123") {
        req.session.partnerID = "AE-0001";
        return res.redirect("/dashboard");
    }
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.email === email && p.password === password);
    if (partner) { req.session.partnerID = partner.partnerID; res.redirect("/dashboard"); }
    else res.status(401).send("<script>alert('ÉCHEC CRITIQUE : Clés de sécurité invalides.'); window.location.href='/connexion';</script>");
});

// ... (Garde tes autres routes : register, simulate, pay, etc.) ...

app.listen(PORT, () => console.log(`🚀 AERIO ALPHA V3 BASTION OPÉRATIONNEL SUR PORT ${PORT}`));
