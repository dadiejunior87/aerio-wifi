const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const session = require("express-session");
const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

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

// --- ROUTES AUTHENTIFICATION ---
app.post("/api/login-partenaire", (req, res) => {
    const { email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    if (email === "admin@aerio.com" && password === "admin123") {
        req.session.partnerID = "AE-0001";
        return res.redirect("/dashboard");
    }
    const partner = partners.find(p => p.email === email && p.password === password);
    if (partner) {
        req.session.partnerID = partner.partnerID;
        res.redirect("/dashboard");
    } else {
        res.send("<script>alert('ÉCHEC : Accès refusé par le protocole Alpha.'); window.location.href='/connexion';</script>");
    }
});

app.post("/api/register-account", (req, res) => {
    const { name, email, password } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    if (partners.find(p => p.email === email)) return res.send("<script>alert('CONFLIT RÉSEAU : Email déjà utilisé.'); window.location.href='/inscription';</script>");
    const partnerID = "AE-" + Math.floor(1000 + Math.random() * 9000);
    partners.push({ name, email, password, partnerID, rates: [{prix:100, duree:"1H"}, {prix:250, duree:"3H"}], createdAt: new Date() });
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    res.redirect("/success-init");
});

// --- SYSTÈME DE RETRAIT AUTOMATIQUE (PAYOUT) ---
app.post("/api/request-payout", checkAuth, async (req, res) => {
    const { amount, phone, network, country } = req.body;
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    
    const mySales = tickets.filter(t => t.partnerID === req.session.partnerID);
    const totalGains = mySales.reduce((sum, t) => sum + (t.amount * 0.85), 0);
    
    if (amount > totalGains) {
        return res.json({ success: false, message: "SOLDE INSUFFISANT : Extraction hors limites." });
    }

    try {
        await axios.post('https://api.moneroo.io', {
            amount: parseInt(amount),
            currency: (country === 'CM' || country === 'TD' || country === 'GA') ? 'XAF' : 'XOF',
            method: network,
            address: phone,
            description: `Retrait AERIO - ID ${req.session.partnerID}`
        }, { headers: { 'Authorization': `Bearer ${process.env.MONEROO_API_KEY}` } });

        tickets.push({
            code: "WITHDRAW-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
            amount: -Math.abs(amount / 0.85),
            partnerID: req.session.partnerID,
            date: new Date(),
            status: "PAID_OUT"
        });
        fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
        res.json({ success: true, message: "TRANSFERT INJECTÉ : Vérifiez votre mobile." });
    } catch (e) { res.status(500).json({ success: false, message: "ERREUR BANCAIRE : Échec de la liaison." }); }
});

// --- ROUTES ADMIN ALPHA (TON QG PRIVÉ) ---
app.get("/admin-alpha", (req, res) => {
    if (req.session.partnerID === "AE-0001") {
        res.sendFile(path.join(__dirname, "public", "admin-alpha.html"));
    } else {
        res.send("ACCÈS REFUSÉ : Privilèges insuffisants.");
    }
});

app.get("/api/admin-global-stats", (req, res) => {
    if (req.session.partnerID !== "AE-0001") return res.status(403).json({error: "Interdit"});
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const totalBrut = tickets.reduce((sum, t) => sum + t.amount, 0);
    res.json({ partners, totalBrut });
});

// --- ROUTES API BOUTIQUE & STATS ---
app.get("/api/get-rates", (req, res) => {
    const { id } = req.query;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.partnerID === id);
    res.json(partner ? partner.rates : []);
});

app.get("/api/my-stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    res.json(tickets.filter(t => t.partnerID === req.session.partnerID));
});

app.post("/api/pay", async (req, res) => {
    const { amount, duration, router_id, phone } = req.body;
    try {
        const response = await axios.post('https://api.moneroo.io', {
            amount: parseInt(amount), currency: 'XOF', customer: { phone: phone, name: "Client WiFi" },
            return_url: `https://${req.get('host')}/success.html`, metadata: { router_id, duration, phone }
        }, { headers: { 'Authorization': `Bearer ${process.env.MONEROO_API_KEY}` } });
        res.json({ checkout_url: response.data.data.checkout_url });
    } catch (e) { res.status(500).json({ error: "Interruption Moneroo" }); }
});

// --- ROUTES PAGES ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/inscription", (req, res) => res.sendFile(path.join(__dirname, "public", "register-partenaire.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/compta", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "compta.html")));
app.get("/logout", (req, res) => { req.session.destroy(); res.redirect("/"); });

app.listen(PORT, () => console.log(`🚀 AERIO ALPHA V3 LIVE SUR PORT ${PORT}`));
