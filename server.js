const express = require("express");
const helmet = require("helmet"); 
const rateLimit = require("express-rate-limit");
const path = require("path");
const session = require("express-session");
const axios = require("axios");
const mongoose = require("mongoose"); // Le nouveau moteur
const app = express();

// --- CONFIGURATION ÉLITE ---
const PORT = process.env.PORT || 10000;
const MONEROO_API_KEY = "pvk_4vq949|01KJ97B9YT5PNYDQ64026G9GZP";

// 🔑 CONNEXION MONGODB (Remplace TON_MOT_DE_PASSE ci-dessous)
const MONGO_URI = "mongodb+srv://aeriodadie:1123dadie@cluster0.yaf9tzq.mongodb.net/aerio_db?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("💎 DATABASE CONNECTÉE : L'EMPIRE EST PRÊT"))
  .catch(err => console.error("❌ ERREUR CONNEXION DB:", err));

// --- SCHÉMAS DE DONNÉES (Remplace les fichiers JSON) ---
const Partner = mongoose.model('Partner', {
    partnerID: String,
    name: String,
    city: String,
    tel: String,
    email: { type: String, unique: true },
    password: String,
    licence: { type: String, default: "ACTIVE" },
    dateInscription: { type: Date, default: Date.now }
});

const Ticket = mongoose.model('Ticket', {
    ticketID: String,
    partnerID: String,
    code: String,
    amount: Number,
    duration: String,
    status: { type: String, default: "ACTIF" },
    date: { type: Date, default: Date.now }
});

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
// 💳 [CONSERVÉ] MOTEUR DE PAIEMENT & LIENS
// ==========================================

app.post("/api/paiement/creer-lien", async (req, res) => {
    const { amount, duration, partnerID } = req.body;
    try {
        const response = await axios.post("https://api.moneroo.io/v1/payments/initialize", {
            amount: amount,
            currency: "XAF",
            description: `Accès Wi-Fi ${duration} - Partenaire ${partnerID}`,
            return_url: `https://${req.get('host')}/paiement-succes?partner=${partnerID}&amt=${amount}`,
            metadata: { partnerID: partnerID, amount: amount }
        }, {
            headers: { 'Authorization': `Bearer ${MONEROO_API_KEY}` }
        });
        res.json({ checkout_url: response.data.data.checkout_url });
    } catch (error) {
        console.error("❌ Erreur Lien Moneroo:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Échec de génération du lien" });
    }
});

app.get("/paiement-succes", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "paiement-succes.html"));
});

// ==========================================
// ✅ [AJOUT] INSCRIPTION DEPUIS INSCRIPTION.HTML (VERSION DB)
// ==========================================

app.post("/api/partenaires/inscription", async (req, res) => {
    const { name, city, tel, email, pass } = req.body;
    try {
        const existing = await Partner.findOne({ email: email });
        if (existing) {
            return res.status(400).json({ success: false, message: "Cet email est déjà enregistré." });
        }

        const count = await Partner.countDocuments();
        const newID = "AE-" + (count + 1).toString().padStart(4, '0');
        
        const newPartner = new Partner({
            partnerID: newID,
            name, city, tel, email,
            password: pass,
            licence: "ACTIVE",
            dateInscription: new Date()
        });

        await newPartner.save();
        req.session.partnerID = newID;
        res.json({ success: true, partnerID: newID });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur lors de l'inscription." });
    }
});

// ==========================================
// ✅ [CONSERVÉES] APIS DE GESTION ALPHA (VERSION DB)
// ==========================================

app.get("/api/my-profile", checkAuth, async (req, res) => {
    const partner = await Partner.findOne({ partnerID: req.session.partnerID });
    if (partner) res.json(partner);
    else res.status(404).send("Profil introuvable");
});

app.get("/api/my-stats", checkAuth, async (req, res) => {
    const myTickets = await Ticket.find({ partnerID: req.session.partnerID });
    
    let montantBrutTotal = 0;
    myTickets.forEach(t => {
        if (t.status === "VENDU") {
            montantBrutTotal += t.amount; 
        }
    });

    res.json({
        tickets: myTickets.sort((a,b) => new Date(b.date) - new Date(a.date)),
        summary: { 
            gain: Math.floor(montantBrutTotal), 
            count: myTickets.filter(t => t.status === "VENDU").length 
        }
    });
});

app.post("/api/import-tickets-csv", checkAuth, async (req, res) => {
    const { tickets, amount, duration } = req.body; 
    const newTickets = tickets.map(code => ({
        ticketID: "TK-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        partnerID: req.session.partnerID,
        code: code.trim(),
        amount: parseInt(amount),
        duration: duration,
        status: "ACTIF",
        date: new Date()
    }));
    
    await Ticket.insertMany(newTickets);
    res.json({ success: true, count: newTickets.length });
});

// ==========================================
// ✅ [CONSERVÉES] GESTION DES COMPTES & AUTH (VERSION DB)
// ==========================================

app.post("/api/inscription-partenaire", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existing = await Partner.findOne({ email });
        if (existing) return res.send("Email déjà utilisé.");
        
        const count = await Partner.countDocuments();
        const newID = "AE-" + (count + 1).toString().padStart(4, '0');
        
        const newPartner = new Partner({ partnerID: newID, name, email, password, licence: "ACTIVE" });
        await newPartner.save();
        
        req.session.partnerID = newID;
        res.redirect("/dashboard");
    } catch (e) { res.status(500).send("Erreur."); }
});

app.post("/api/login-partenaire", async (req, res) => {
    const { email, password } = req.body;
    // Admin Master permanent
    if (email === "admin@aerio.com" && password === "admin123") {
        req.session.partnerID = "AE-0001";
        return res.redirect("/dashboard");
    }
    
    const partner = await Partner.findOne({ email: email, password: password });
    if (partner) { 
        req.session.partnerID = partner.partnerID; 
        res.redirect("/dashboard"); 
    } else { 
        res.status(401).send("Erreur d'authentification."); 
    }
});

// ==========================================
// ✅ [CONSERVÉES] ROUTES PAGES
// ==========================================
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/compta", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "compta.html")));
app.get("/tickets/ajouter", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "ajouter-ticket.html")));
app.get("/tickets", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "tickets.html")));
app.get("/connexion", (req, res) => res.sendFile(path.join(__dirname, "public", "login-partenaire.html")));
app.get("/wifi-zone", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "wifi-zone.html")));
app.get("/profil", checkAuth, (req, res) => res.sendFile(path.join(__dirname, "public", "profil.html")));

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 EMPIRE AERIO DÉPLOYÉ SUR PORT ${PORT} AVEC CLOUD DATABASE`));
