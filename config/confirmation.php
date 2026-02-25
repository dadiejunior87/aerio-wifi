<?php
// config/confirmation.php

// 1. Lire le signal envoyé par Moneroo
$input = file_get_contents("php://input");
$event = json_decode($input, true);

// 2. Vérifier si le paiement a réussi
if (isset($event['event']) && $event['event'] === 'payment.success') {
    
    $montant = $event['data']['amount'];
    $phone_client = $event['data']['customer']['phone'];
    
    // On récupère l'ID du partenaire qu'on avait caché dans le paiement
    $partenaire_id = isset($event['data']['metadata']['partenaire_id']) ? $event['data']['metadata']['partenaire_id'] : 'AERIO_GLOBAL';

    // 3. Connexion à la base de données
    try {
        $db = new PDO('sqlite:aerio.db');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // 4. On cherche UN ticket LIBRE appartenant à CE PARTENAIRE pour CE PRIX
        $stmt = $db->prepare("SELECT id, username, password FROM tickets 
                              WHERE prix = :prix 
                              AND partenaire_id = :pid 
                              AND statut = 'libre' 
                              LIMIT 1");
        
        $stmt->execute([
            ':prix' => $montant,
            ':pid'  => $partenaire_id
        ]);
        
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($ticket) {
            $user = $ticket['username'];
            $pass = $ticket['password'];

            // 5. On marque le ticket comme utilisé et on enregistre le téléphone du client
            $update = $db->prepare("UPDATE tickets SET statut = 'utilise', telephone_client = :phone WHERE id = :id");
            $update->execute([
                ':phone' => $phone_client,
                ':id'    => $ticket['id']
            ]);

            // --- ICI : APPEL SMS ---
            // Le client reçoit son code : "AERIO: Ton code est $user et ton pass est $pass"
            
        } else {
            // Optionnel : Si plus de tickets, envoyer une alerte au partenaire ou à toi
            file_put_contents("erreurs.log", date('Y-m-d H:i')." - Plus de tickets pour $partenaire_id ($montant F)\n", FILE_APPEND);
        }

    } catch (PDOException $e) {
        file_put_contents("erreurs.log", "Erreur DB: " . $e->getMessage() . "\n", FILE_APPEND);
    }

    http_response_code(200);
    exit();
}
?>
