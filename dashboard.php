<?php
// --- ÉTAPE 2 : LE VERROU DE SÉCURITÉ DADIE IA ---
session_start();

// Si la session n'existe pas, on redirige vers la connexion
if (!isset($_SESSION['user_id'])) {
    header('Location: connexion.html');
    exit();
}

// Récupération des infos de l'utilisateur connecté
$userName = $_SESSION['user_name'] ?? 'Agent Alpha';
$userCity = $_SESSION['user_city'] ?? 'Secteur Inconnu';
$userRank = $_SESSION['user_rank'] ?? 'GOLD PILOT';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AERIO | Centre de Commande Alpha (DADIE IA)</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #00C2FF;
            --accent: #00F5A0;
            --purple: #BC00FF;
            --bg-deep: #020617;
            --card-bg: rgba(15, 23, 42, 0.6);
            --border: rgba(255, 255, 255, 0.1);
            --sidebar-w: 280px;
            --dadie-glow: rgba(112, 0, 255, 0.3);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        
        body { 
            background: var(--bg-deep); 
            color: white; 
            display: flex; 
            min-height: 100vh; 
            overflow-x: hidden;
            background-image: radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%);
        }

        /* --- EFFET OVERLAY QUANTIQUE --- */
        .aerio-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            display: flex; justify-content: center; align-items: center;
            z-index: 10000;
        }
        .quantum-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--primary);
            border-radius: 20px;
            padding: 30px;
            width: 450px;
            box-shadow: 0 0 40px rgba(0, 194, 255, 0.2);
            text-align: left;
        }

        /* --- SIDEBAR ALPHA STYLISÉE --- */
        .sidebar {
            width: var(--sidebar-w); background: rgba(11, 15, 26, 0.8); 
            backdrop-filter: blur(15px); padding: 30px 15px; height: 100vh;
            position: fixed; border-right: 1px solid var(--border); display: flex; flex-direction: column;
            overflow-y: auto; z-index: 100;
        }
        .logo-title { 
            color: var(--primary); font-weight: 900; font-size: 26px; 
            margin-bottom: 35px; padding-left: 10px; letter-spacing: -1px;
            text-shadow: 0 0 15px rgba(0, 194, 255, 0.5);
        }

        .group-label { font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 900; margin: 20px 0 10px 10px; letter-spacing: 2px; }

        .nav-button {
            background: rgba(255,255,255,0.02); padding: 12px 15px; border-radius: 12px;
            display: flex; align-items: center; text-decoration: none; font-size: 12px; margin-bottom: 5px; 
            border: 1px solid var(--border); color: #94a3b8; transition: 0.3s;
        }
        .nav-button:hover { 
            background: rgba(0, 194, 255, 0.08); color: white; transform: translateX(5px);
            border-color: var(--primary);
        }
        .nav-button.active { 
            background: linear-gradient(90deg, rgba(0, 194, 255, 0.2), transparent);
            border-left: 4px solid var(--primary); color: var(--primary); font-weight: 600;
        }

        /* --- TOP BAR & NOTIFS --- */
        .top-bar {
            display: flex; justify-content: flex-end; align-items: center; gap: 20px;
            padding: 20px 40px; position: sticky; top: 0; z-index: 90;
            background: rgba(2, 6, 23, 0.6); backdrop-filter: blur(12px);
        }
        .logout-btn { background: #ef4444; border: none; color: white; padding: 8px 15px; border-radius: 10px; font-size: 10px; font-weight: 900; cursor: pointer; text-decoration: none; }

        /* --- DADIE IA INTERFACE --- */
        .content { margin-left: var(--sidebar-w); flex: 1; padding: 10px 40px 40px 40px; }
        
        .dadie-brain {
            background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
            border: 1px solid var(--purple);
            border-radius: 25px; padding: 25px; margin-bottom: 35px;
            box-shadow: 0 10px 40px var(--dadie-glow);
            display: flex; align-items: center; gap: 20px;
            position: relative; overflow: hidden;
        }

        .dadie-avatar {
            width: 70px; height: 70px; background: var(--purple);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 35px; box-shadow: 0 0 20px var(--purple);
            animation: pulseIA 2s infinite;
        }
        @keyframes pulseIA { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

        .rank-badge {
            display: inline-block; padding: 4px 10px; border-radius: 8px;
            font-size: 9px; font-weight: 900; text-transform: uppercase;
            background: linear-gradient(45deg, #ffd700, #ffa500);
            color: black; box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            margin-left: 10px; vertical-align: middle;
        }

        .card-main { 
            background: var(--card-bg); padding: 35px; border-radius: 35px; border: 1px solid var(--border); 
            text-align: center; backdrop-filter: blur(15px); position: relative; overflow: hidden;
        }
        .particles-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.4; }

        .action-card {
            background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px;
            padding: 15px 20px; display: flex; align-items: center; gap: 15px;
            text-decoration: none; transition: 0.4s; backdrop-filter: blur(10px);
        }

        .val-large { font-size: 48px; font-weight: 900; margin: 10px 0; letter-spacing: -2px; z-index: 2; position: relative; }

        .mini-card { 
            padding: 25px 15px; border-radius: 25px; border: 1px solid var(--border); 
            text-align: center; background: rgba(255,255,255,0.03);
        }

        .ai-control {
            margin-top: 30px; background: rgba(188, 0, 255, 0.05);
            border: 1px solid rgba(188, 0, 255, 0.2); border-radius: 20px; padding: 20px;
            display: flex; justify-content: space-between; align-items: center;
        }

        @media (max-width: 1024px) {
            .sidebar { width: 80px; }
            .sidebar .logo-title, .sidebar .group-label, .sidebar .nav-button span { display: none; }
            .content { margin-left: 80px; }
        }
    </style>
</head>
<body>

    <div class="sidebar">
        <div class="logo-title">AERIO</div>
        
        <div class="group-label">Pilotage Réseaux</div>
        <a href="dashboard.php" class="nav-button active"><i>🏠</i> <span>Tableau de bord</span></a>
        <a href="ajouter-ticket.html" class="nav-button"><i>🎫</i> <span>Générer un Pass</span></a>
        <a href="liste-tickets.html" class="nav-button"><i>🔑</i> <span>Registre des Accès</span></a>

        <div class="group-label">Gestion Financière</div>
        <a href="comptabilite.html" class="nav-button"><i>💰</i> <span>Flux de Trésorerie</span></a>
        <a href="logout.php" class="nav-button" style="color: #ef4444;"><i>🚪</i> <span>Déconnexion</span></a>
    </div>

    <main style="flex:1; display:flex; flex-direction:column;">
        <div class="top-bar">
             <div style="font-size: 11px; color: #475569;">Connecté : <b style="color:var(--primary)"><?php echo htmlspecialchars($userName); ?></b></div>
             <a href="logout.php" class="logout-btn">QUITTER</a>
        </div>

        <div class="content">
            <div class="top-nav" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 40px;">
                <a href="profil.html" class="action-card">
                    <div class="icon-box" style="width:45px; height:45px; border-radius:12px; display:flex; align-items:center; justify-content:center; background: rgba(188, 0, 255, 0.1); border: 1px solid var(--purple);">👤</div>
                    <div><b style="font-size: 11px; display:block; letter-spacing:1px;">MON COMPTE</b><span style="font-size: 10px; color:#64748b;">Gérer mon profil Alpha</span></div>
                </a>
                
                <a href="support.html" class="action-card">
                    <div class="icon-box" style="width:45px; height:45px; border-radius:12px; display:flex; align-items:center; justify-content:center; background: rgba(0, 245, 160, 0.1); border: 1px solid var(--accent);">💬</div>
                    <div><b style="font-size: 11px; display:block; letter-spacing:1px;">ASSISTANCE LIVE</b><span style="font-size: 10px; color:#64748b;">DADIE IA de nouvelle génération</span></div>
                </a>

                <a href="docs.html" class="action-card">
                    <div class="icon-box" style="width:45px; height:45px; border-radius:12px; display:flex; align-items:center; justify-content:center; background: rgba(0, 194, 255, 0.1); border: 1px solid var(--primary);">📚</div>
                    <div><b style="font-size: 11px; display:block; letter-spacing:1px;">ACADÉMIE</b><span style="font-size: 10px; color:#64748b;">Guides & Tutoriels Alpha</span></div>
                </a>
            </div>

            <div class="dadie-brain">
                <div class="dadie-avatar">🧠</div>
                <div>
                    <span style="background:var(--purple); color:white; padding:4px 12px; border-radius:20px; font-size:10px; font-weight:900;">DADIE IA v1.1</span>
                    <p style="margin-top:12px; font-weight:600; font-size:15px; letter-spacing:-0.3px; color: #fff;" id="welcome-msg">
                        Bonjour Agent <?php echo htmlspecialchars($userName); ?>. DADIE IA analyse votre secteur de <?php echo htmlspecialchars($userCity); ?>. Statut : Stable.
                    </p>
                </div>
            </div>

            <div class="main-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 35px;">
                <div class="card-main">
                    <canvas id="balance-particles" class="particles-bg"></canvas>
                    <p style="font-size: 11px; font-weight: 900; color: #64748b; letter-spacing: 1px; position: relative; z-index: 2;">
                        SOLDE DISPONIBLE
                        <span class="rank-badge"><?php echo htmlspecialchars($userRank); ?></span>
                    </p>
                    <div class="val-large">0 <small style="font-size: 18px; color: var(--primary);">XAF</small></div>
                    <p style="font-size: 10px; color: #475569; position: relative; z-index: 2;">Aucun retrait en attente</p>
                </div>

                <div class="card-main">
                    <p style="font-size: 11px; font-weight: 900; color: #64748b; letter-spacing: 1px;">CHIFFRE D'AFFAIRES GLOBAL</p>
                    <div class="val-large">0 <small style="font-size: 18px; color: var(--accent);">XAF</small></div>
                    <p style="font-size: 10px; color: #475569;">Performance du réseau : 0%</p>
                </div>
            </div>

            <div class="mini-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                <div class="mini-card" style="border-bottom: 4px solid #FFCC00;">
                    <p style="font-size: 9px; font-weight: 900; color: #64748b; margin-bottom: 10px;">PASS VENDUS</p>
                    <div style="font-size: 28px; font-weight: 900;">0</div>
                </div>
                <div class="mini-card" style="border-bottom: 4px solid #FF4B4B;">
                    <p style="font-size: 9px; font-weight: 900; color: #64748b; margin-bottom: 10px;">EXTRACTIONS</p>
                    <div style="font-size: 28px; font-weight: 900;">0</div>
                </div>
                <div class="mini-card" style="border-bottom: 4px solid #BC00FF;">
                    <p style="font-size: 9px; font-weight: 900; color: #64748b; margin-bottom: 10px;">RECETTE JOUR</p>
                    <div style="font-size: 28px; font-weight: 900;">0</div>
                </div>
                <div class="mini-card" style="border-bottom: 4px solid #00F5A0;">
                    <p style="font-size: 9px; font-weight: 900; color: #64748b; margin-bottom: 10px;">AFFLUENCE LIVE</p>
                    <div style="font-size: 28px; font-weight: 900;">0</div>
                </div>
            </div>

            <div class="ai-control">
                <div>
                    <h4 style="font-size: 12px; color: var(--purple);">OPTIMISATION SATELLITAIRE</h4>
                    <p style="font-size: 10px; color: #64748b;">DADIE IA surveille la latence de vos passerelles.</p>
                </div>
                <button onclick="boostAction()" style="background: var(--purple); border:none; color:white; padding:10px 20px; border-radius:10px; font-weight:900; cursor:pointer; font-size:10px;">
                    BOOST ALPHA
                </button>
            </div>
        </div>
    </main>

    <script>
        function initHologram() {
            const canvas = document.getElementById('balance-particles');
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            let particles = [];
            for(let i = 0; i < 40; i++) {
                particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: Math.random() * 0.4 + 0.1, size: Math.random() * 2 });
            }
            function animate() {
                ctx.clearRect(0,0,canvas.width, canvas.height);
                ctx.fillStyle = "#00C2FF";
                particles.forEach(p => {
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                    p.y -= p.speed; if(p.y < 0) p.y = canvas.height;
                });
                requestAnimationFrame(animate);
            }
            animate();
        }

        function showQuantumAlert(message) {
            const alertHtml = `
            <div class="aerio-overlay" id="quantumAlert">
                <div class="quantum-card">
                    <div style="opacity: 0.5; font-size: 0.7rem; margin-bottom: 10px;">🌐 system.aerio.alpha</div>
                    <div style="color:var(--primary); font-weight:900; letter-spacing:1px; margin-bottom:5px;">AERIO CORE & DADIE IA</div>
                    <div style="font-size:0.9rem; color:#fff; margin-bottom:15px;">${message}</div>
                    <button onclick="document.getElementById('quantumAlert').remove()" 
                            style="background:var(--primary); border:none; color:#000; padding:8px 20px; border-radius:8px; font-weight:900; cursor:pointer; float:right;">
                        CONTINUER
                    </button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', alertHtml);
        }

        const dadieQuotes = [
            "Analyse terminée : +12% de connexions ce soir.",
            "Signal optimal dans le secteur <?php echo $userCity; ?>.",
            "Agent <?php echo $userName; ?>, vos revenus sont sécurisés.",
            "Optimisation : J'ai libéré de la bande passante.",
            "Félicitations Agent, vous maintenez le rang <?php echo $userRank; ?>."
        ];

        function boostAction() {
            showQuantumAlert("DADIE IA : Calibration des ondes terminée. Vitesse boostée.");
        }

        setInterval(() => {
            const welcome = document.getElementById('welcome-msg');
            welcome.style.opacity = 0;
            setTimeout(() => {
                welcome.innerText = dadieQuotes[Math.floor(Math.random() * dadieQuotes.length)];
                welcome.style.opacity = 1;
            }, 500);
        }, 15000);

        window.onload = () => {
            initHologram();
            setTimeout(() => showQuantumAlert("Initialisation terminée. DADIE IA est connectée."), 1000);
        };
    </script>
</body>
</html>
