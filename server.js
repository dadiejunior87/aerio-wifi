const express = require("express");
const helmet = require("helmet"); 
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const axios = require("axios"); // [NOUVEAU] Pour parler à Moneroo
const app = express();

// --- CONFIGURATION ÉLITE ---
const PORT = process.env.PORT || 10000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");
const MONEROO_API_KEY = "TO_CLE_SECRET_ICI"; // 🔑 À remplacer par ta clé secrète Moneroo

// --- INITIALISATION DES NOYAUX ---
const initFile = (filePath) => {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([], null, 2));
};
initFile(TICKETS_FILE);
initFile(PARTNERS_FILE);

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

function checkAuth(req, res, next) {
    if (req.session.partnerID) next();
    else res.redirect("/connexion");
}

// ==========================================
// 💳 [NOUVEAU] MOTEUR DE PAIEMENT MONEROO
// ==========================================

// 1. Générer le lien de paiement pour le client
app.post("/api/paiement/creer-lien", async (req, res) => {
    const { amount, duration, partnerID } = req.body;

    try {
        const response = await axios.post("https://api.moneroo.io/v1/payments/initialize", {
            amount: amount,
            currency: "XAF",
            description: `Accès Wi-Fi ${duration} - Partenaire ${partnerID}`,
            return_url: `https://${req.get('host')}/paiement-succes?partner=${partnerID}&amt=${amount}`,
            metadata: {
                partnerID: partnerID,
                amount: amount,
                duration: duration
            }
        }, {
            headers: { 'Authorization': `Bearer ${MONEROO_API_KEY}` }
        });

        res.json({ url: response.data.data.checkout_url });
    } catch (error) {
        console.error("❌ Erreur Moneroo:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Impossible de générer le lien de paiement" });
    }
});

// 2. Page de succès (Traitement après paiement)
app.get("/paiement-succes", (req, res) => {
    const { partner, amt } = req.query;
    
    // Ici on affiche la page de succès qui va appeler une API pour récupérer le code
    res.sendFile(path.join(__dirname, "public", "paiement-succes.html"));
});

// ==========================================
// ✅ APIS DE GESTION ALPHA (PRÉCÉDENT)
// ==========================================

app.get("/api/my-profile", checkAuth, (req, res) => {
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.partnerID === req.session.partnerID);
    if (partner) res.json(partner);
    else res.status(404).send("Profil introuvable");
});

app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const myTickets = tickets.filter(t => t.partnerID === req.session.partnerID);
    
    let montantBrutTotal = 0;
    let taCommissionAdmin = 0;

    myTickets.forEach(t => {
        if(t.status === "VENDU") { // On ne compte que les vendus pour les stats
            montantBrutTotal += t.amount; 
            taCommissionAdmin += (t.amount * 0.15); 
        }
    });

    res.json({
        tickets: myTickets.sort((a,b) => new Date(b.date) - new Date(a.date)),
        summary: { gain: Math.floor(montantBrutTotal), count: myTickets.filter(t => t.status === "VENDU").length }
    });
});

app.post("/api/import-tickets-csv", checkAuth, (req, res) => {
    const { tickets, amount, duration } = req.body; 
    let allTickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const newTickets = tickets.map(code => ({
        ticketID: "TK-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        partnerID: req.session.partnerID,
        code: code.trim(),
        amount: parseInt(amount),
        duration: duration,
        status: "ACTIF",
        date: new Date()
    }));
    allTickets = [...allTickets, ...newTickets];
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(allTickets, null, 2));
    res.json({ success: true, count: newTickets.length });
});

// ==========================================
// ✅ GESTION DES COMPTES (AUTO-ACTIVATION)
// ==========================================

app.post("/api/inscription-partenaire", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    
    if (partners.find(p => p.email === email)) return res.send("Email déjà utilisé.");

    const newID = "AE-" + (partners.length + 1).toString().padStart(4, '0');

    partners.push({ 
        partnerID: newID, 
        name, 
        email, 
        password, 
        licence: "ACTIVE", 
        dateInscription: new Date() 
    });

    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    req.session.partnerID = newID;
    res.redirect("/dashboard");
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
// ✅ ROUTES PAGES
// ==========================================
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/compta", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "compta.html")));
app.get("/tickets/ajouter", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "ajouter-ticket.html")));
app.get("/tickets", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tickets.html")));
app.get("/guide", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "guide.html")));
app.get("/boutique", (req, res) => res.sendFile(path.join(__dirname, "public", "boutique.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/wifi-zone", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "wifi-zone.html")));
app.get("/liste-wifi", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "liste-wifi.html")));
app.get("/profil", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "profil.html")));
app.get("/recettes", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "recettes.html")));

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 EMPIRE AERIO DÉPLOYÉ SUR PORT ${PORT}`));
