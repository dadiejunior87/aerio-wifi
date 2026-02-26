<?php
// --- COEUR DE CONNEXION DADIE IA ---
$host = 'sqlXXX.infinityfree.com'; // Ton host InfinityFree
$dbname = 'if0_XXXXXX_aerio';      // Ton nom de base de données
$user = 'if0_XXXXXX';              // Ton nom d'utilisateur
$pass = 'TON_MOT_DE_PASSE';        // Ton mot de passe MySQL

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    // On active la gestion des erreurs pour voir si ça bug
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    // Si la connexion échoue, DADIE IA affiche un message propre
    die("Erreur Critique DADIE IA : Connexion à la base de données impossible.");
}
?>
