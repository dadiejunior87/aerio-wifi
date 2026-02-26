<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AERIO | Connexion Espace Pro</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;700;900&display=swap" rel="stylesheet">
    <style>
        :root { 
            --primary: #00C2FF; 
            --bg: #020617; 
            --glass: rgba(15, 23, 42, 0.6); 
            --accent: #7000FF; 
            --neon-glow: rgba(0, 194, 255, 0.4);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { 
            background: var(--bg); color: white; min-height: 100vh; display: flex; 
            align-items: center; justify-content: center; padding: 20px; 
            background-image: radial-gradient(circle at 10% 10%, rgba(0, 194, 255, 0.05), transparent 40%),
                              radial-gradient(circle at 90% 90%, rgba(112, 0, 255, 0.1), transparent 40%);
        }
        .aerio-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px);
            display: flex; justify-content: center; align-items: center; z-index: 10000;
        }
        .quantum-card {
            background: rgba(255, 255, 255, 0.05); border: 1px solid var(--primary);
            border-radius: 20px; padding: 30px; width: 90%; max-width: 400px;
            box-shadow: 0 0 40px var(--neon-glow);
        }
        #scanner-line {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 4px;
            background: var(--primary); box-shadow: 0 0 20px var(--primary);
            z-index: 10000; animation: scanLoop 2s ease-in-out infinite;
        }
        @keyframes scanLoop { 0% { top: 0%; } 100% { top: 100%; } }

        .login-card { 
            background: var(--glass); backdrop-filter: blur(30px); padding: 45px 35px; 
            border-radius: 35px; border: 1px solid rgba(255, 255, 255, 0.1); 
            width: 100%; max-width: 420px; text-align: center; position: relative; 
        }
        .error-msg {
            background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444;
            color: #ff9999; padding: 10px; border-radius: 12px; font-size: 12px; margin-bottom: 20px;
            display: <?php echo isset($_GET['error']) ? 'block' : 'none'; ?>;
        }
        .lang-switcher { display: flex; gap: 15px; justify-content: center; margin-bottom: 25px; }
        .lang-btn { cursor: pointer; font-size: 18px; opacity: 0.3; transition: 0.4s; filter: grayscale(1); }
        .lang-btn.active { opacity: 1; filter: grayscale(0); transform: scale(1.3); }
        h1 { font-size: 26px; font-weight: 900; margin-bottom: 8px; text-transform: uppercase; }
        p#sub-text { color: #94a3b8; font-size: 13px; margin-bottom: 35px; }
        .input-group { text-align: left; margin-bottom: 20px; }
        label { font-size: 10px; font-weight: 900; color: var(--primary); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; display: block; }
        input { 
            width: 100%; padding: 16px 20px; background: rgba(0, 0, 0, 0.5); 
            border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 15px; 
            color: white; outline: none; transition: 0.3s; 
        }
        input:focus { border-color: var(--primary); box-shadow: 0 0 15px rgba(0, 194, 255, 0.15); }
        .btn-login { 
            width: 100%; padding: 18px; background: linear-gradient(135deg, var(--primary), var(--accent)); 
            color: white; border-radius: 15px; font-weight: 900; border: none; cursor: pointer; 
            text-transform: uppercase; letter-spacing: 1.5px; margin-top: 15px; transition: 0.4s; 
        }
        .logo-box { width: 65px; height: 65px; background: rgba(0, 194, 255, 0.05); border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid var(--primary); font-size: 28px; }
    </style>
</head>
<body>
    <div id="scanner-line"></div>

    <div class="login-card">
        <div class="error-msg">Identifiants incorrects. Accès refusé par DADIE IA.</div>
        
        <div class="logo-box">🔒</div>
        <h1 data-key="title_pro">Espace Pro</h1>
        <p id="sub-text" data-key="hero_desc">Liaison sécurisée au cockpit AERIO.</p>

        <form action="login_process.php" method="POST" onsubmit="startScan()">
            <div class="input-group">
                <label data-key="label_id">Identifiant Agent Alpha</label>
                <input type="email" name="email" placeholder="Votre Email" required>
            </div>
            <div class="input-group">
                <label data-key="label_key">Code de Cryptage</label>
                <input type="password" name="password" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn-login" id="btnText">Initialiser la Session</button>
        </form>
        <a href="index.html" style="display:block; margin-top:20px; color:#475569; font-size:10px; text-decoration:none;">RETOUR</a>
    </div>

    <script>
        function startScan() {
            document.getElementById('scanner-line').style.display = 'block';
            document.getElementById('btnText').innerText = "CRYPTAGE...";
        }
    </script>
</body>
</html>
