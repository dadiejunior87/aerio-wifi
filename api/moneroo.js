const express = require('express');
const router = express.Router();

// Route principale du Webhook : /api/webhook/moneroo
router.post('/', (req, res) => {
    // Moneroo envoie les détails dans le "body" de la requête
    const payload = req.body;

    console.log("=== NOUVEL ÉVÉNEMENT MONEROO ===");
    console.log("Événement :", payload.event);

    // On vérifie si le paiement a réussi
    if (payload.event === 'payment.success') {
        const transaction = payload.data;
        
        const montant = transaction.amount;
        const devise = transaction.currency;
        const ref = transaction.reference;
        const emailClient = transaction.customer ? transaction.customer.email : "Inconnu";

        console.log("✅ PAIEMENT REÇU !");
        console.log("Montant : " + montant + " " + devise);
        console.log("Référence Moneroo : " + ref);
        console.log("Client : " + emailClient);

        // ICI : C'est ici que ton système doit générer le code WiFi
        // Exemple : genererTicketAerio(montant);
    } 
    else if (payload.event === 'payment.failed') {
        console.log("❌ ÉCHEC DU PAIEMENT pour la transaction : " + payload.data.reference);
    }

    // IMPORTANT : On répond toujours 200 à Moneroo pour dire "Bien reçu !"
    res.status(200).send('OK');
});

module.exports = router;
