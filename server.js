const express = require("express");
const app = express();
app.use(express.json());

// --- TA CONFIGURATION ---
const MONEROO_SECRET_KEY = "pvk_sandbox_bp27mz|01KHSH3XQWXRMDGD6VCBGDCFE9"; 
let maCommissionTotale = 0;
let tickets = [];

// Route d'accueil : Affiche ton Dashboard de gains
app.get("/", (req, res) => { 
    res.send(`<h1>AERIO ZONE WIFI 🚀</h1><p>Statut : EN LIGNE</p><hr><h3>Mes Commissions (15%) : ${maCommissionTotale} FCFA</h3>`); 
});

// Route pour le MikroTik : Récupère les tickets
app.get("/api/get-pending-tickets", (req, res) => {
    res.json(tickets.filter(t => t.status === "pending"));
});

// Route de confirmation : Ajoute l'argent à ton solde
app.post("/api/confirm-ticket", (req, res) => {
    const { id, prix } = req.query;
    maCommissionTotale += (prix * 0.15);
    res.json({ success: true, nouveau_solde: maCommissionTotale });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Aerio Server is Ready!"));
