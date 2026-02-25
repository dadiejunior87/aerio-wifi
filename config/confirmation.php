<?php
// config/confirmation.php

// 1. Lire le message de Moneroo
$input = file_get_contents("php://input");
$event = json_decode($input, true);

// 2. Vérifier si le paiement est réussi
if (isset($event['event']) && $event['event'] === 'payment.success') {
    
    $montant = $event['data']['amount'];
    $phone_client = $event['data']['customer']['phone'];
    $partenaire = $event['data']['metadata']['partenaire_id'];

    // 3. ICI : LA LOGIQUE DU TICKET
    // Pour l'instant, on génère un code de test
    $ticket_user = "AER-" . rand(100, 999);
    $ticket_pass = rand(1000, 9999);

    // TODO: Connecter ton service SMS ici pour envoyer $ticket_user au $phone_client
    
    // On répond à Moneroo que c'est reçu
    http_response_code(200);
    exit();
}

http_response_code(400); // Erreur si ce n'est pas un succès
?>
