<?php
// config/initier-paiement.php

$secret_key = "pvk_4vq949|01KJ97B9YT5PNYDQ64026G9GZP";

$montant = $_POST['montant'];
$forfait = $_POST['forfait_nom'];
$partenaire = $_POST['partenaire_id'];

$url = "https://api.moneroo.io/v1/payments/initialize";

$data = [
    "amount"      => (int)$montant,
    "currency"    => "XAF",
    "description" => "AERIO WiFi : " . $forfait,
    "customer"    => [
        "name"    => "Client AERIO",
        "email"   => "client@aerio-wifi.com"
    ],
    // Après le paiement, on renvoie vers le succès
    "return_url"  => "https://aerio-wifi.onrender.com/succes.html?user=Vérification...",
    "metadata"    => [
        "partenaire_id" => $partenaire,
        "forfait"       => $forfait
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
    header("Location: " . $result['data']['checkout_url']);
} else {
    echo "Erreur Moneroo : " . $result['message'];
}
?>
