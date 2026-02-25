<?php
// On inclut la configuration pour avoir les clés API et le taux de 15%
require_once('config-pay.php');

/**
 * Ce script est appelé quand le client clique sur "Acheter"
 * On récupère les infos du forfait (normalement envoyées par le bouton)
 */

$montant_forfait = $_POST['montant'] ?? 0; // Le montant choisi (ex: 500)
$nom_forfait = $_POST['forfait_nom'] ?? 'Forfait WiFi';
$id_partenaire = $_POST['partenaire_id'] ?? '0'; // Pour savoir qui a vendu le ticket

if ($montant_forfait <= 0) {
    die("Erreur : Montant invalide.");
}

// 1. Calcul de la commission AERIO (15%) avant d'envoyer à Moneroo
$repartition = calculerRepartition($montant_forfait);
$commission_aerio = $repartition['aerio'];
$net_partenaire = $repartition['partenaire'];

// 2. Préparation de l'appel à l'API Moneroo
$url_moneroo = "https://api.moneroo.io/v1/payments/initialize";

$donnees_paiement = [
    'amount'      => $montant_forfait,
    'currency'    => 'XAF',
    'description' => "Achat " . $nom_forfait . " - AERIO",
    'customer'    => [
        'email' => 'client@aerio.com', // Optionnel
        'name'  => 'Client WiFi'
    ],
    'return_url'  => 'https://ton-site.com/succes.php', // Où le client revient après avoir payé
    'metadata'    => [
        'commission_aerio' => $commission_aerio,
        'gain_partenaire'  => $net_partenaire,
        'partenaire_id'    => $id_partenaire
    ]
];

// 3. Envoi de la requête à Moneroo (via CURL)
$ch = curl_init($url_moneroo);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . MONEROO_SECRET_KEY,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($donnees_paiement));

$reponse = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

$resultat = json_decode($reponse, true);

// 4. Redirection vers Moneroo si tout est OK
if (isset($resultat['data']['checkout_url'])) {
    header('Location: ' . $resultat['data']['checkout_url']);
    exit();
} else {
    echo "Erreur d'initialisation : " . ($resultat['message'] ?? 'Impossible de contacter Moneroo.');
}
?>
