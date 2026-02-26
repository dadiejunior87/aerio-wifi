<?php
session_start();

// Connexion à la base de données
$host = "localhost";
$dbname = "aerio_db"; // Vérifie que c'est bien le nom de ta base
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
} catch (PDOException $e) {
    die("Erreur de liaison : " . $e->getMessage());
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $pass = $_POST['password'];

    // Recherche de l'agent dans la base
    $stmt = $pdo->prepare("SELECT * FROM agents WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Vérification du mot de passe
    if ($user && password_verify($pass, $user['password'])) {
        // --- ÉTAPE 3 : ON REMPLIT LES VARIABLES POUR LE DASHBOARD ---
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['nom'];
        $_SESSION['user_city'] = $user['ville'];
        $_SESSION['user_rank'] = "GOLD PILOT"; // Tu pourras changer ça plus tard

        header("Location: dashboard.php");
        exit();
    } else {
        // Retour à la connexion avec une erreur
        header("Location: connexion.php?error=1");
        exit();
    }
}
