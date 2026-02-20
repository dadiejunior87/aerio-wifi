const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TICKETS_FILE = path.join(__dirname, "tickets.json");
const PARTNERS_FILE = path.join(__dirname, "partners.json");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Initialisation des fichiers JSON s'ils n'existent pas
if (!fs.existsSync(TICKETS_FILE)) fs.writeFileSync(TICKETS_FILE, JSON.stringify([]));
if (!fs.existsSync(PARTNERS_FILE)) fs.writeFileSync(PARTNERS_FILE, JSON.stringify([]));

// --- ROUTES API POUR LE DASHBOARD PARTENAIRE ---

// 1. Enregistrer un partenaire et générer son ID Unique AERIO
app.post("/api/register-partner", (req, res) => {
    const { router_ip, payout_number, payout_method } = req.body;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    
    const partnerID = "AE-" + Math.floor(1000 + Math.random() * 9000);
    const newPartner = {
        partnerID,
        router_ip,
        payout_number,
        payout_method,
        rates: [], // Grille tarifaire vide au début
        createdAt: new Date()
    };

    partners.push(newPartner);
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
    res.json({ success: true, partnerID });
});

// 2. Ajouter un tarif personnalisé pour un partenaire
app.post("/api/save-rate", (req, res) => {
    const { partnerID, prix, duree } = req.body;
    let partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    
    let partner = partners.find(p => p.partnerID === partnerID);
    if (partner) {
        partner.rates.push({ prix: parseInt(prix), duree });
        fs.writeFileSync(PARTNERS_FILE, JSON.stringify(partners, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Partenaire non trouvé" });
    }
});

// 3. Récupérer les tarifs pour le Portail Captif
app.get("/api/get-rates", (req, res) => {
    const { id } = req.query;
    const partners = JSON.parse(fs.readFileSync(PARTNERS_FILE));
    const partner = partners.find(p => p.partnerID === id);
    res.json(partner ? partner.rates : []);
});

// --- SYSTÈME DE PAIEMENT & COMMISSION (15%) ---

// 4. Initialiser le paiement Moneroo
app.post("/api/pay", async (req, res) => {
    const { amount, duration, router_id } = req.body;

    try {
        const response = await axios.post('https://api.moneroo.io', {
            amount: parseInt(amount),
            currency: 'XOF',
            customer: { email: "client@aerio.zone", name: "Client WiFi" },
            return_url: `https://${req.get('host')}/success.html`,
            metadata: { 
                router_id: router_id, 
                duration: duration,
                total_amount: amount 
            }
        }, {
            headers: { 'Authorization': `Bearer ${process.env.MONEROO_API_KEY}` }
        });
        res.json({ checkout_url: response.data.data.checkout_url });
    } catch (e) {
        res.status(500).json({ error: "Erreur Moneroo" });
    }
});

// 5. Webhook Moneroo : Confirmation et calcul de commission
app.post("/api/webhook", async (req, res) => {
    const { event, data } = req.body;

    if (event === 'payment.success') {
        const amount = data.amount;
        const partnerID = data.metadata.router_id;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Calcul commission 15% / 85%
        const commissionAerio = amount * 0.15;
        const gainPartenaire = amount - commissionAerio;

        // Sauvegarde de la transaction
        const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
        tickets.push({
            code,
            amount,
            net_partner: gainPartenaire,
            partnerID,
            date: new Date(),
            status: "SUCCESS"
        });
        fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));

        console.log(`Ticket ${code} généré. Gain AERIO: ${commissionAerio}F`);
        // Ici, tu peux ajouter l'appel API vers le MikroTik (mikronode-ng)
    }
    res.sendStatus(200);
});

// --- ROUTES PAGES ---

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/api/tickets", (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE));
    res.json(tickets);
});

// Lancement du serveur
app.listen(PORT, () => console.log(`🚀 AERIO SAAS opérationnel sur le port ${PORT}`));
