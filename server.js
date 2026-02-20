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
// Configuration des tarifs AERIO
const TARIFS = {
"1H": { prix: 100, commission: 15 },
"24H": { prix: 500, commission: 75 },
"30J": { prix: 10000, commission: 1500 }
};

// Route pour simuler un achat et générer un code
app.get('/buy/:plan', (req, res) => {
const plan = req.params.plan;
if (TARIFS[plan]) {
// Génération d'un code aléatoire style AE-1234
const codeTicket = "AE-" + Math.floor(1000 + Math.random() * 9000);
res.send("<h1>Paiement Réussi !</h1><p>Votre code WiFi " + plan + " est : <strong>" + codeTicket + "</strong></p><a href='/login'>Se connecter maintenant</a>");
} else {
res.send("Plan invalide");
}
});

// Route d'authentification pour ton bouton SE CONNECTER
app.post('/auth', (req, res) => {
const { username, password } = req.body;
console.log("Tentative avec le code : " + username);
if (username && username.startsWith("AE-")) {
res.redirect(''); // Simule une redirection vers internet
} else {
res.send("<script>alert('Code invalide'); window.location.href='/login';</script>");
}
});
