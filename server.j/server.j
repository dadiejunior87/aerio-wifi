const express = require("express");
const app = express();
app.use(express.json());

// --- CONFIGURATION MONEROO ET COMMISSIONS ---
const MONEROO_SECRET_KEY = "pvk_sandbox_bp27mz|01KHSH3XQWXRMDGD6VCBGDCFE9"; 
const MA_COMMISSION_PERCENT = 0.15; // Tes 15% de gain

let tickets = [];
let maCommissionTotale = 0;

// 1. Route pour ACHETER un ticket (Test: /buy?amount=500)
app.get("/buy", (req, res) => {
    const montant = parseInt(req.query.amount) || 100;
    const ticketId = "T-" + Math.floor(1000 + Math.random() * 9000);
    
    const nouveauTicket = {
        id: ticketId,
        username: `AERIO-${ticketId}`,
        password: Math.floor(1000 + Math.random() * 9000).toString(),
        uptime: montant >= 500 ? "24h" : "1h",
        status: "pending", // En attente du MikroTik
        prix: montant
    };

    tickets.push(nouveauTicket);
    res.json({ 
        message: "Ticket créé ! Le MikroTik va le récupérer dans 15s.", 
        ticket: nouveauTicket,
        instruction: "Regardez vos logs MikroTik maintenant !"
    });
});

// 2. Route pour que le MikroTik récupère les tickets
app.get("/api/get-pending-tickets", (req, res) => {
    const pending = tickets.filter(t => t.status === "pending");
    res.json(pending);
});

// 3. Route de confirmation (Calcul de tes 15%)
app.post("/api/confirm-ticket", (req, res) => {
    const { id } = req.query;
    const ticket = tickets.find(t => t.id === id);

    if (ticket) {
        ticket.status = "confirmed";
        const gain = ticket.prix * MA_COMMISSION_PERCENT;
        maCommissionTotale += gain;
        console.log(`💰 GAIN ENCAISSÉ : +${gain} F | TOTAL : ${maCommissionTotale} F`);
        res.json({ success: true, gain_total: maCommissionTotale });
    } else {
        res.status(404).json({ error: "Ticket non trouvé" });
    }
});

// Page d'accueil avec ton solde de commissions
app.get("/", (req, res) => { 
    res.send(`
        <h1>AERIO ZONE WIFI 🚀</h1>
        <p>Statut : 🟢 En ligne et connecté au MikroTik</p>
        <hr>
        <h3>Solde de mes Commissions (15%) : ${maCommissionTotale} FCFA</h3>
        <p>Testez une vente : <a href="/buy?amount=500">Simuler un achat de 500F</a></p>
    `); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur Aerio prêt !`));
