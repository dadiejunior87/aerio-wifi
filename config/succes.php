<?php
// On inclut la config pour les clés et le calcul des 15%
require_once('config-pay.php');

/**
 * Cette page reçoit le client après son paiement sur Moneroo
 * Moneroo envoie généralement un ID de transaction dans l'URL
 */
$transaction_id = $_GET['transaction_id'] ?? $_GET['id'] ?? null;

if (!$transaction_id) {
    die("Erreur : ID de transaction manquant.");
}

// 1. On vérifie auprès de Moneroo si le paiement est RÉELLEMENT réussi
$url_verif = "https://api.moneroo.io/v1/payments/" . $transaction_id;

$ch = curl_init($url_verif);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . MONEROO_SECRET_KEY,
    'Content-Type: application/json'
]);

$reponse = curl_exec($ch);
curl_close($ch);

$resultat = json_decode($reponse, true);

// 2. Si le paiement est confirmé (status 'success')
if (isset($resultat['data']['status']) && $resultat['data']['status'] === 'success') {
    
    // On récupère les calculs qu'on avait cachés dans les metadata
    $montant_total = $resultat['data']['amount'];
    $commission_aerio = $resultat['data']['metadata']['commission_aerio'];
    $gain_partenaire = $resultat['data']['metadata']['gain_partenaire'];
    
    // --- ICI TU INSÈRES TON CODE POUR GÉNÉRER LE TICKET WIFI ---
    $code_wifi = strtoupper(substr(md5(time()), 0, 8)); // Exemple de code : A1B2C3D4
    
    ?>
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Paiement Réussi | AERIO</title>
        <style>
            body { background: #020617; color: white; font-family: 'Poppins', sans-serif; text-align: center; padding: 50px; }
            .ticket-card { background: rgba(255,255,255,0.05); border: 2px solid #00C2FF; border-radius: 30px; padding: 30px; display: inline-block; }
            .code { font-size: 40px; font-weight: 900; color: #00F5A0; letter-spacing: 5px; margin: 20px 0; }
            .btn { background: #00C2FF; color: #020617; padding: 15px 30px; border-radius: 15px; text-decoration: none; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="ticket-card">
            <h1>✅ Paiement Confirmé !</h1>
            <p>Merci pour votre achat. Voici votre accès WiFi :</p>
            <div class="code"><?php echo $code_wifi; ?></div>
            <p>Montant payé : <?php echo $montant_total; ?> XAF</p>
            <br>
            <a href="#" class="btn">SE CONNECTER MAINTENANT</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #475569;">
            Transaction ID: <?php echo $transaction_id; ?> | Commission AERIO : <?php echo $commission_aerio; ?> XAF enregistrée.
        </p>
    </body>
    </html>
    <?php

} else {
    // Si le paiement a échoué ou est en attente
    echo "<h1>❌ Échec du paiement</h1>";
    echo "<p>Le paiement n'a pas pu être validé. Veuillez réessayer.</p>";
    echo "<a href='index.html'>Retour à l'accueil</a>";
}
?>
