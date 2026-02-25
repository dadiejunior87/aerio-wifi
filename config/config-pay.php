<?php
// CONFIGURATION CENTRALE AERIO & MONEROO

// 1. Tes accès Moneroo (À récupérer sur ton dashboard Moneroo)
define('MONEROO_PUBLIC_KEY', 'pk_live_xxxxxxxxxxxx'); 
define('MONEROO_SECRET_KEY', 'sk_live_xxxxxxxxxxxx'); 

// 2. Configuration des commissions (MISE À JOUR À 15%)
$taux_commission = 15; // Pourcentage que AERIO gagne sur chaque vente

/**
 * Fonction pour calculer la répartition
 * @param float $montant_total Le prix du ticket payé par le client
 * @return array [gain_aerio, gain_partenaire]
 */
function calculerRepartition($montant_total) {
    global $taux_commission;
    
    $commission_aerio = ($montant_total * $taux_commission) / 100;
    $net_partenaire = $montant_total - $commission_aerio;
    
    return [
        'aerio' => $commission_aerio,
        'partenaire' => $net_partenaire
    ];
}

// Exemple pour un ticket de 1000 XAF :
// AERIO gagne : 150 XAF
// Le Partenaire gagne : 850 XAF
?>
