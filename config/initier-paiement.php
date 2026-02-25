<?php
// --- CONFIGURATION SÉCURISÉE ---
$secret_key = "pvk_4vq949|01KJ97B9YT5PNYDQ64026G9GZP"; // Ta clé privée

// Récupération des données envoyées par ton portal.html
$montant = isset($_POST['montant']) ? $_POST['montant'] : 0;
$forfait = isset($_POST['forfait_nom']) ? $_POST['forfait_nom'] : 'WiFi';
$partenaire = isset($_POST['partenaire_id']) ? $_POST['partenaire_id'] : 'AERIO_GLOBAL';

// Préparation de la requête pour Moneroo
$url = "https://api.moneroo.io/v1/payments/initialize";

$data = [
    "amount"      => (int)$montant,
    "currency"    => "XAF",
    "description" => "AERIO WiFi : Forfait " . $forfait,
    "customer"    => [
        "name"    => "Client AERIO",
        "email"   => "client@aerio.com" // Moneroo demande souvent un email par défaut
    ],
    "return_url"  => "https://aerio-wifi.onrender.com/succes.html",
    "metadata"    => [
        "partenaire_id" => $partenaire,
        "forfait"       => $forfait
    ]
];

// Envoi vers Moneroo via CURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $secret_key,
    "Content-Type: application/json",
    "Accept: application/json"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);

// REDIRECTION DU CLIENT
if (isset($result['data']['checkout_url'])) {
    // On envoie le client vers la page de paiement (Orange/MTN/Moov)
    header("Location: " . $result['data']['checkout_url']);
    exit();
} else {
    // Si ça échoue, on affiche l'erreur pour comprendre
    echo "Désolé, impossible de lancer le paiement : " . $result['message'];
}
?>
