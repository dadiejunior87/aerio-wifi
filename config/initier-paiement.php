<?php
// config/initier-paiement.php

// Ta clé secrète Moneroo
$secret_key = "pvk_4vq949|01KJ97B9YT5PNYDQ64026G9GZP";

// Récupération des données du formulaire
$montant = $_POST['montant'];
$forfait = $_POST['forfait_nom'];
$partenaire = $_POST['partenaire_id'];

// On définit l'URL de base pour Render
$base_url = "https://aerio-wifi.onrender.com";

$url = "https://api.moneroo.io/v1/payments/initialize";

$data = [
    "amount"      => (int)$montant,
    "currency"    => "XAF",
    "description" => "AERIO WiFi : " . $forfait . " (Partenaire: " . $partenaire . ")",
    "customer"    => [
        "name"    => "Client AERIO",
        "email"   => "client@aerio-wifi.com"
    ],
    // URL de retour pour le client (Visuel)
    "return_url"  => $base_url . "/succes.html?pid=" . $partenaire . "&forfait=" . $forfait,
    
    // URL Webhook (C'est ici que DADIE IA valide les 15% en arrière-plan)
    "webhook_url" => $base_url . "/config/callback-moneroo.php",
    
    "metadata"    => [
        "partenaire_id" => $partenaire,
        "forfait"       => $forfait,
        "system"        => "DADIE_IA_ALPHA"
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $secret_key,
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);

if (isset($result['data']['checkout_url'])) {
    // Redirection vers la page de paiement Moneroo (MOMO/OM)
    header("Location: " . $result['data']['checkout_url']);
} else {
    // En cas d'erreur, affichage propre
    echo "<h3>Erreur d'initialisation AERIO</h3>";
    echo "Détails : " . (isset($result['message']) ? $result['message'] : "Connexion impossible avec Moneroo");
}
?>
