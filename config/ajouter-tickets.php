<?php
// config/ajouter-tickets.php

// 1. Connexion / Création automatique de la base de données
$db = new PDO('sqlite:aerio.db');
$db->exec("CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    prix INTEGER,
    partenaire_id TEXT,
    statut TEXT DEFAULT 'libre',
    telephone_client TEXT
)");

// 2. Si le partenaire envoie des tickets
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $partenaire_id = $_POST['partenaire_id'];
    $prix = $_POST['prix'];
    $liste_tickets = explode("\n", $_POST['codes']); // On coupe chaque ligne

    $count = 0;
    foreach ($liste_tickets as $ligne) {
        $data = explode(",", $ligne); // On attend le format: user,pass
        if (count($data) == 2) {
            $stmt = $db->prepare("INSERT INTO tickets (username, password, prix, partenaire_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([trim($data[0]), trim($data[1]), $prix, $partenaire_id]);
            $count++;
        }
    }
    echo "Succès ! $count tickets ajoutés pour le partenaire $partenaire_id.";
}
?>

<!DOCTYPE html>
<html>
<head><title>Ajouter des Tickets - AERIO</title></head>
<body style="background:#020617; color:white; font-family:sans-serif; padding:20px;">
    <h2>Charger des tickets MikroTik</h2>
    <form method="POST">
        <label>ID Partenaire :</label><br>
        <input type="text" name="partenaire_id" placeholder="Ex: BOUTIQUE_ALAIN" required><br><br>
        
        <label>Prix du forfait (F CFA) :</label><br>
        <select name="prix">
            <option value="100">100F</option>
            <option value="500">500F</option>
        </select><br><br>

        <label>Liste des codes (Format: user,pass - Un par ligne) :</label><br>
        <textarea name="codes" rows="10" style="width:100%" placeholder="AX123,4455&#10;AX124,6677"></textarea><br><br>
        
        <button type="submit" style="padding:10px 20px; cursor:pointer;">ENREGISTRER LES TICKETS</button>
    </form>
</body>
</html>
