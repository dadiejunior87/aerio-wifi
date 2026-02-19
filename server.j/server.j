const express = require("express");
const app = express();
app.use(express.json());

// Simulation de base de données (on utilisera MongoDB plus tard pour que ce soit permanent)
let tickets = [];
let maCommissionTotale = 0;

// Route pour que le MikroTik récupère les tickets payés
app.get("/api/get-pending-tickets", (req, res) => {
    const pending = tickets.filter(t => t.status === "pending");
    res.json(pending);
});

// Route pour confirmer la création du ticket et encaisser la commission
app.post("/api/confirm-ticket", (req, res) => {
    const { id, prix } = req.query;
    const commissionRecue = prix * 0.15;
    maCommissionTotale += commissionRecue;
    
    tickets = tickets.map(t => t.id === id ? { ...t, status: "confirmed" } : t);
    console.log(`Commission de ${commissionRecue} F encaissée ! Total : ${maCommissionTotale} F`);
    res.json({ success: true, total_gain: maCommissionTotale });
});

app.get("/", (req, res) => { res.send("AERIO ZONE WIFI est EN LIGNE 🚀"); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur Aerio sur le port ${PORT}`));
