<?php
// config/callback-moneroo.php
// DADIE IA - Système de validation automatique

// 1. Récupération du signal de Moneroo
$input = file_get_contents("php://input");
$event = json_decode($input, true);

if (!$event || $event['event'] !== 'payment.success') {
    exit(); // On ignore si ce n'est pas un succès
}

// 2. Extraction des données
$data = $event['data'];
$partenaire_id = $data['metadata']['partenaire_id'] ?? 'SYSTEM';
$forfait = $data['metadata']['forfait'] ?? 'Inconnu';
$montant = $data['amount'];

// 3. LOGIQUE TACTIQUE : Génération d'un code unique
$characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
$nouveau_code = '';
for ($i = 0; $i < 6; $i++) {
    $nouveau_code .= $characters[rand(0, strlen($characters) - 1)];
}

// 4. CALCUL DE LA COMMISSION DADIE IA (15%)
$commission = $montant * 0.15;

// 5. ENREGISTREMENT DANS LA BASE DE DONNÉES (tickets_vendus.json)
$database_file = '../database/tickets_vendus.json';

// Création du dossier database s'il n'existe pas
if (!is_dir('../database')) {
    mkdir('../database', 0777, true);
}

$current_data = file_exists($database_file) ? json_decode(file_get_contents($database_file), true) : [];

$nouveau_ticket = [
    "id" => uniqid(),
    "code" => $nouveau_code,
    "montant" => $montant,
    "commission_dadie" => $commission,
    "partenaire_id" => $partenaire_id,
    "forfait" => $forfait,
    "date" => date('Y-m-d H:i:s'),
    "status" => "actif"
];

$current_data[] = $nouveau_ticket;
file_put_contents($database_file, json_encode($current_data, JSON_PRETTY_PRINT));

// 6. RÉPONSE À MONEROO
http_response_code(200);
echo json_encode(["status" => "success", "message" => "Ticket généré : $nouveau_code"]);
?>
