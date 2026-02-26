<?php
session_start();
require_once 'db_connect.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_SESSION['agent_id'])) {
    $agent_id = $_SESSION['agent_id'];
    $codes = json_decode($_POST['codes']);
    $tarif_id = $_POST['tarif_id']; // Tu peux lier cela à un prix fixe pour l'instant

    try {
        $db->beginTransaction();
        $stmt = $db->prepare("INSERT INTO tickets (agent_id, code, prix, statut, date_creation) VALUES (?, ?, ?, 'libre', NOW())");
        
        foreach ($codes as $code) {
            // Ici, tu peux mettre un prix par défaut ou récupérer celui du tarif_id
            $stmt->execute([$agent_id, $code, 100]); 
        }
        
        $db->commit();
        echo json_encode(['success' => true, 'message' => count($codes) . ' tickets injectés']);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
