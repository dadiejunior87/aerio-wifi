<?php
// --- CONFIGURATION AERIO SYSTEM ---
$mon_api_key = "TON_API_KEY_ICI";
$commission_rate = 0.15; // Tes 15%

// 1. RÉCUPÉRATION DES DONNÉES DU PORTAIL
$montant = $_POST['montant'];
$forfait = $_POST['forfait_nom'];
$partenaire_id = $_POST['partenaire_id'];
$telephone = $_POST['telephone_client']; // À ajouter dans un petit champ si besoin

// 2. CALCUL AUTOMATIQUE DES PARTS
$ma_commission = $montant * $commission_rate;
$part_partenaire = $montant - $ma_commission;

// 3. APPEL À L'API DE PAIEMENT (Exemple logique)
/* Ici, le script envoie une requête à l'API. 
   L'API déclenche le "Push" sur le téléphone du client (*126# ou *150#).
*/

$statut_paiement = "SUCCESS"; // Simulé pour l'exemple

if($statut_paiement == "SUCCESS") {
    
    // 4. GÉNÉRATION DU CODE WIFI (Connexion à ton MikroTik ou via API Mikhmon)
    $user_wifi = "AX-" . rand(1000, 9999);
    $pass_wifi = rand(100, 999);

    // 5. ENVOI DU SMS AUTOMATIQUE
    // Utilisation d'un service comme Twilio ou un gateway SMS local
    $message = "AERIO ZONE : Votre ticket est pret. User: $user_wifi | Pass: $pass_wifi. Durée: $forfait. Merci !";
    
    // Commande d'envoi SMS ici...

    // 6. REDIRECTION VERS UNE PAGE DE SUCCÈS
    header("Location: succes.html?user=$user_wifi&pass=$pass_wifi");
} else {
    echo "Erreur lors du paiement. Veuillez réessayer.";
}
?>
