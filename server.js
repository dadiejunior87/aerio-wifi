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
    secret: 'AERIO_SUPER_SECRET_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Initialisation des fichiers JSON
const initFile = (filePath) => {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([], null, 2));
};
initFile(TICKETS_FILE);
initFile(PARTNERS_FILE);

function checkAuth(req, res, next) {
    if (req.session.partnerID) next();
    else res.redirect("/connexion");
}

// --- LE WEBHOOK MONEROO (DIRECTEMENT ICI) ---
app.post("/api/webhook/moneroo", (req, res) => {
    const payload = req.body;
    console.log("=== SIGNAL MONEROO REÇU ===");

    if (payload.event === 'payment.success') {
        const { amount, metadata } = payload.data;
        const code = "AE-" + Math.random().toString(36).substring(2, 7).toUpperCase();
        
        try {
            const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
            tickets.push({
                code,
                amount,
                customer_phone: metadata.phone,
                partnerID: metadata.router_id,
                date: new Date(),
                status: "SUCCESS"
            });
            fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
            console.log("✅ Ticket généré : " + code);
        } catch (e) {
            console.error("Erreur écriture ticket:", e);
        }
    }
    res.status(200).send('OK');
});

// --- ROUTES API ---

app.get("/api/admin/stats", checkAuth, (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const myTickets = tickets.filter(t => t.partnerID === req.session.partnerID && t.status === "SUCCESS");
    const totalCA = myTickets.reduce((sum, t) => sum + t.amount, 0);
    res.json({ solde: totalCA * 0.15, totalGeneré: totalCA });
});

app.post("/api/pay", async (req, res) => {
    const { amount, duration, router_id, phone } = req.body;
    try {
        const response = await axios.post('https://api.moneroo.io/v1/payments', {
            amount: parseInt(amount),
            currency: 'XAF',
            customer: { phone: phone, name: "Client WiFi" },
            return_url: `https://${req.get('host')}/success.html?phone=${phone}`,
            notify_url: `https://${req.get('host')}/api/webhook/moneroo`,
            metadata: { router_id, duration, phone }
        }, {
            headers: { 'Authorization': `Bearer ${process.env.MONEROO_API_KEY}` }
        });
        res.json({ checkout_url: response.data.data.checkout_url });
    } catch (e) {
        res.status(500).json({ error: "Erreur Moneroo" });
    }
});

app.get('/api/recover-ticket', (req, res) => {
    const { phone } = req.query;
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    const found = tickets.reverse().find(t => t.customer_phone === phone);
    if (found) res.json({ success: true, code: found.code });
    else res.json({ success: false });
});

// --- ROUTES PAGES ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));

app.listen(PORT, () => console.log(`🚀 AERIO LIVE SUR PORT ${PORT}`));
