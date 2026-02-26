<?php
header('Content-Type: application/json');

// --- CONFIGURATION DE LA BDD (DADIE IA SECURE) ---
$host = "localhost";
$dbname = "aerio_db"; // Assure-toi que c'est le nom de ta base
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Échec de connexion au réseau Alpha"]);
    exit;
}

// --- RÉCUPÉRATION DES DONNÉES DU SCANNER ---
$data = json_decode(file_get_contents("php://input"), true);

if ($data) {
    // Nettoyage des données
    $nom = htmlspecialchars($data['name']);
    $ville = htmlspecialchars($data['city']);
    $tel = htmlspecialchars($data['tel']);
    $email = htmlspecialchars($data['email']);
    
    // Cryptage du mot de passe (Protocole DADIE)
    $pass = password_hash($data['pass'], PASSWORD_BCRYPT);

    // Génération d'un Identifiant Partenaire Unique (Ex: AERIO-A1B2)
    $partnerID = "AERIO-" . strtoupper(substr(md5(uniqid()), 0, 4));

    try {
        // --- VÉRIFICATION SI L'EMAIL EXISTE DÉJÀ ---
        $check = $pdo->prepare("SELECT id FROM agents WHERE email = ?");
        $check->execute([$email]);
        
        if ($check->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "Cet agent est déjà enregistré."]);
        } else {
            // --- INSERTION DANS LA BASE ---
            $sql = "INSERT INTO agents (nom, ville, email, password, tel, partnerID) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);

            if ($stmt->execute([$nom, $ville, $email, $pass, $tel, $partnerID])) {
                echo json_encode([
                    "status" => "success",
                    "partnerID" => $partnerID,
                    "message" => "Nœud activé avec succès"
                ]);
            }
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Erreur de protocole BDD : " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Données de formulaire corrompues."]);
}
