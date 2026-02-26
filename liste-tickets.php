<?php
session_start();
require_once 'config/db_connect.php';

// DADIE IA : Vérification de la connexion
if (!isset($_SESSION['agent_id'])) {
    header('Location: connexion.php');
    exit();
}

$agent_id = $_SESSION['agent_id'];

// 1. Récupération des stats en temps réel
$stats_query = $db->prepare("
    SELECT 
        COUNT(CASE WHEN statut = 'libre' THEN 1 END) as stock,
        SUM(CASE WHEN statut = 'vendu' AND DATE(date_vente) = CURDATE() THEN prix ELSE 0 END) as CA_jour,
        COUNT(CASE WHEN statut = 'vendu' THEN 1 END) as total_vendus
    FROM tickets WHERE agent_id = ?
");
$stats_query->execute([$agent_id]);
$stats = $stats_query->fetch();

// 2. Récupération des tickets disponibles
$filter = isset($_GET['type']) ? $_GET['type'] : 'all';
$sql = "SELECT * FROM tickets WHERE agent_id = ? AND statut = 'libre'";
$params = [$agent_id];

if ($filter !== 'all') {
    $sql .= " AND type = ?";
    $params[] = $filter;
}
$sql .= " ORDER BY id DESC";
$tickets_query = $db->prepare($sql);
$tickets_query->execute($params);
$tickets = $tickets_query->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AERIO | Salle des Ventes</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #00C2FF; --accent: #00F5A0; --warning: #FFAB00; --danger: #ff4757;
            --bg-deep: #020617; --card-bg: rgba(15, 23, 42, 0.7);
            --border: rgba(255, 255, 255, 0.08); --sidebar-w: 260px;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { background: var(--bg-deep); color: white; display: flex; min-height: 100vh; background-image: radial-gradient(circle at bottom left, rgba(0, 194, 255, 0.05), transparent 40%); }

        .sidebar { width: var(--sidebar-w); background: #0b0f1a; padding: 30px 20px; height: 100vh; position: fixed; border-right: 1px solid var(--border); z-index: 100; }
        .logo-title { color: var(--primary); font-weight: 900; font-size: 24px; margin-bottom: 40px; letter-spacing: -1px; }
        .nav-link { padding: 14px 18px; color: #64748b; text-decoration: none; display: flex; align-items: center; gap: 12px; font-size: 13px; border-radius: 12px; transition: 0.3s; margin-bottom: 8px; }
        .nav-link.active { background: linear-gradient(90deg, rgba(0, 194, 255, 0.15), transparent); color: var(--primary); font-weight: 600; border-left: 3px solid var(--primary); }

        .main-content { margin-left: var(--sidebar-w); flex: 1; padding: 40px; max-width: 1200px; }
        .filter-bar { display: flex; gap: 10px; margin-bottom: 25px; overflow-x: auto; padding-bottom: 10px; }
        .filter-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: #64748b; padding: 8px 20px; border-radius: 100px; cursor: pointer; text-decoration: none; font-size: 12px; transition: 0.3s; }
        .filter-btn.active { background: var(--primary); color: #000; font-weight: 700; border-color: var(--primary); }

        .stats-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-item { background: var(--card-bg); padding: 25px; border-radius: 22px; border: 1px solid var(--border); backdrop-filter: blur(10px); }
        .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
        .stat-value { font-size: 24px; font-weight: 900; display: block; margin-top: 5px; }

        .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
        .ticket-card { background: linear-gradient(145deg, #1e293b, #0f172a); border-radius: 24px; padding: 25px; border: 1px solid var(--border); position: relative; transition: 0.4s; overflow: hidden; }
        .ticket-card:hover { transform: translateY(-8px); border-color: var(--primary); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .offer-badge { background: rgba(0, 194, 255, 0.1); color: var(--primary); padding: 4px 12px; border-radius: 8px; font-size: 10px; font-weight: 700; border: 1px solid rgba(0, 194, 255, 0.2); }
        .price-tag { font-weight: 900; font-size: 18px; color: var(--accent); }

        .card-body { text-align: center; padding: 20px 0; border-top: 1px dashed var(--border); border-bottom: 1px dashed var(--border); margin-bottom: 20px; }
        .code-display { font-family: 'monospace'; font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #fff; }
        
        .btn-sell { width: 100%; background: linear-gradient(135deg, var(--primary), #0077FF); color: white; border: none; padding: 14px; border-radius: 15px; font-weight: 900; font-size: 12px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: 0.3s; }

        #printSection { display: none; }
        @media print {
            body * { visibility: hidden; }
            #printSection, #printSection * { visibility: visible; }
            #printSection { position: fixed; left: 0; top: 0; width: 80mm; background: white; color: black; padding: 5mm; }
        }
    </style>
</head>
<body>

    <div class="sidebar">
        <div class="logo-title">AERIO</div>
        <a href="dashboard.php" class="nav-link">🏠 Dashboard</a>
        <a href="ajouter-tickets.php" class="nav-link">🎫 Générer un Pass</a>
        <a href="liste-tickets.php" class="nav-link active">🔑 Registre & Vente</a>
        <a href="logout.php" class="nav-link" style="color:#ef4444; margin-top:30px;">🚪 Déconnexion</a>
    </div>

    <div class="main-content">
        <div class="header-flex" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
            <h1 style="font-size: 28px; font-weight: 900;">SALLE DES <span style="color:var(--primary)">VENTES</span></h1>
            <div id="clock" style="font-family:monospace; color:var(--primary); font-weight:bold; background: rgba(0,194,255,0.1); padding: 5px 15px; border-radius: 10px;">--:--:--</div>
        </div>

        <div class="stats-bar">
            <div class="stat-item">
                <span class="stat-label">Tickets en Stock</span>
                <span class="stat-value"><?= $stats['stock'] ?></span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Cagnotte Jour</span>
                <span class="stat-value" style="color:var(--accent)"><?= number_format($stats['CA_jour'], 0, '.', ' ') ?> XAF</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Pass Vendus</span>
                <span class="stat-value" style="color:var(--warning)"><?= $stats['total_vendus'] ?></span>
            </div>
        </div>

        <div class="filter-bar">
            <a href="?type=all" class="filter-btn <?= $filter == 'all' ? 'active' : '' ?>">Tous les Pass</a>
            <a href="?type=1H" class="filter-btn <?= $filter == '1H' ? 'active' : '' ?>">1 Heure</a>
            <a href="?type=3H" class="filter-btn <?= $filter == '3H' ? 'active' : '' ?>">3 Heures</a>
            <a href="?type=JOUR" class="filter-btn <?= $filter == 'JOUR' ? 'active' : '' ?>">24 Heures</a>
            <a href="?type=SEMAINE" class="filter-btn <?= $filter == 'SEMAINE' ? 'active' : '' ?>">7 Jours</a>
        </div>

        <div class="grid-cards">
            <?php foreach($tickets as $ticket): ?>
            <div class="ticket-card" id="ticket-<?= $ticket['id'] ?>">
                <div class="card-header">
                    <span class="offer-badge"><?= $ticket['type'] ?></span>
                    <span class="price-tag"><?= $ticket['prix'] ?> XAF</span>
                </div>
                <div class="card-body">
                    <span class="stat-label">CODE D'ACCÈS</span><br>
                    <span class="code-display"><?= $ticket['code'] ?></span>
                </div>
                <button class="btn-sell" onclick="vendreTicket(<?= $ticket['id'] ?>, '<?= $ticket['code'] ?>', '<?= $ticket['type'] ?>', '<?= $ticket['prix'] ?>')">Vendre & Imprimer ⚡</button>
            </div>
            <?php endforeach; ?>
        </div>

        <?php if(empty($tickets)): ?>
        <div id="emptyState" style="text-align:center; padding:100px; opacity:0.5;">
            <span style="font-size:50px;">📦</span>
            <h2 style="margin-top:20px;">Le stock est vide !</h2>
            <p>Veuillez injecter de nouveaux codes dans l'Architecte de Pass.</p>
        </div>
        <?php endif; ?>
    </div>

    <div id="printSection"></div>

    <script>
        // Horloge temps réel
        setInterval(() => {
            document.getElementById('clock').innerText = new Date().toLocaleTimeString();
        }, 1000);

        function vendreTicket(id, code, type, prix) {
            if(!confirm("Confirmer la vente du pass " + code + " ?")) return;

            // Appel AJAX pour marquer comme vendu en BDD
            fetch('vendre_ticket_action.php?id=' + id)
            .then(res => res.json())
            .then(data => {
                if(data.status === 'success') {
                    // Cacher la carte
                    document.getElementById('ticket-' + id).style.display = 'none';
                    // Lancer l'impression
                    lancerImpression(code, type, prix);
                } else {
                    alert("Erreur : " + data.message);
                }
            });
        }

        function lancerImpression(code, offre, prix) {
            const printSection = document.getElementById('printSection');
            printSection.innerHTML = `
                <div style="text-align:center; font-family: 'Courier New', Courier, monospace; border: 1px solid #000; padding: 10px;">
                    <h2 style="margin:0; font-size:18px;">AERIO NETWORK</h2>
                    <p style="font-size:10px; margin:5px 0;">--------------------------</p>
                    <p style="font-size:12px; font-weight:bold;">PASS WIFI : ${offre}</p>
                    <div style="margin:15px 0; border: 2px solid #000; padding: 10px;">
                        <span style="font-size:10px;">VOTRE CODE</span><br>
                        <strong style="font-size:24px;">${code}</strong>
                    </div>
                    <p style="font-size:14px; font-weight:bold;">PRIX : ${prix} XAF</p>
                    <p style="font-size:10px; margin-top:10px;">${new Date().toLocaleString()}</p>
                    <p style="font-size:9px; margin-top:5px;">Service client: DADIE IA Systems</p>
                </div>
            `;
            window.print();
        }
    </script>
</body>
</html>
