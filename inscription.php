<?php session_start(); ?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AERIO | Enrôlement Alpha</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;700;900&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #00C2FF; --bg: #020617; --accent: #00F5A0; --neon: #7000FF; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        
        body { 
            background: var(--bg); 
            color: white; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            padding: 40px 0;
            overflow-y: auto;
            background-image: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
        }

        .bg-dots {
            position: fixed; width: 100%; height: 100%; top:0; left:0;
            background-image: radial-gradient(var(--primary) 1px, transparent 1px);
            background-size: 50px 50px; opacity: 0.05; z-index: -1;
        }

        .lang-switcher { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
        .lang-btn { cursor: pointer; font-size: 16px; opacity: 0.4; transition: 0.3s; filter: grayscale(1); }
        .lang-btn.active { opacity: 1; filter: grayscale(0); transform: scale(1.2); }

        .auth-container { position: relative; width: 92%; max-width: 480px; padding: 3px; border-radius: 35px; background: linear-gradient(135deg, var(--primary), var(--neon)); animation: borderRotate 10s linear infinite; }
        @keyframes borderRotate { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }

        .auth-card { 
            background: #020617; padding: 40px 35px; border-radius: 32px; 
            text-align: center; position: relative;
        }

        .header-box { margin-bottom: 30px; }
        .header-box h1 { font-weight: 900; font-size: 28px; letter-spacing: -1px; color: white; }
        .header-box span { color: var(--primary); }
        .badge { background: rgba(0, 194, 255, 0.1); color: var(--primary); padding: 5px 15px; border-radius: 20px; font-size: 9px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; display: inline-block; }

        .form-group { position: relative; margin-bottom: 20px; text-align: left; }
        label { font-size: 10px; font-weight: 900; color: #475569; text-transform: uppercase; margin-bottom: 8px; display: block; margin-left: 5px; }
        
        input { 
            width: 100%; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); 
            padding: 16px 20px; border-radius: 18px; color: white; font-size: 14px; transition: 0.4s;
        }
        input:focus { outline: none; border-color: var(--primary); background: rgba(0, 194, 255, 0.05); box-shadow: 0 0 15px rgba(0, 194, 255, 0.1); }

        .row { display: flex; gap: 15px; }

        .submit-btn { 
            width: 100%; padding: 20px; border-radius: 20px; border: none; 
            background: linear-gradient(90deg, var(--primary), var(--neon)); 
            color: white; font-weight: 900; font-size: 15px; cursor: pointer; 
            transition: 0.5s; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;
        }
        .submit-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(112, 0, 255, 0.4); }

        .footer-text { margin-top: 25px; font-size: 13px; color: #64748b; }
        .footer-text a { color: var(--primary); text-decoration: none; font-weight: 700; }
        
        .scanner {
            position: absolute; top: 0; left: 0; width: 100%; height: 2px;
            background: linear-gradient(90deg, transparent, var(--primary), transparent);
            animation: scanMove 3s linear infinite; opacity: 0.5;
        }
        @keyframes scanMove { 0% { top: 0; } 100% { top: 100%; } }

        #successBox { display: none; background: rgba(0, 245, 160, 0.1); border: 1px solid var(--accent); padding: 20px; border-radius: 20px; margin-top: 20px; }

        @media (max-width: 480px) {
            .row { flex-direction: column; gap: 0; }
            .auth-card { padding: 30px 20px; }
        }
    </style>
</head>
<body>

    <div class="bg-dots"></div>

    <div class="auth-container">
        <div class="auth-card">
            <div class="scanner"></div>

            <div class="lang-switcher">
                <span class="lang-btn active" onclick="changeLang('fr')">🇫🇷</span>
                <span class="lang-btn" onclick="changeLang('en')">🇺🇸</span>
                <span class="lang-btn" onclick="changeLang('pt')">🇧🇷</span>
            </div>
            
            <div class="header-box">
                <div class="badge" data-key="badge_init">Node Initialization</div>
                <h1>AERIO<span data-key="title_partner">PARTNER</span></h1>
                <p style="color: #64748b; font-size: 12px; margin-top: 10px;" data-key="hero_desc">Rejoignez le premier réseau WiFi décentralisé.</p>
            </div>

            <form id="registerForm">
                <div class="form-group">
                    <label data-key="label_id">Identité Business</label>
                    <input type="text" id="bizName" name="name" placeholder="Nom du Partenaire ou Structure" required>
                </div>

                <div class="row">
                    <div class="form-group" style="flex: 1;">
                        <label data-key="label_city">Ville</label>
                        <input type="text" id="bizCity" name="city" placeholder="Ex: Maroua" required>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label data-key="label_contact">Contact (Paiement)</label>
                        <input type="tel" id="bizTel" name="tel" placeholder="6xx xxx xxx" required>
                    </div>
                </div>

                <div class="form-group">
                    <label data-key="label_email">Email de Gestion</label>
                    <input type="email" id="bizEmail" name="email" placeholder="admin@aerio.net" required>
                </div>

                <div class="form-group">
                    <label data-key="label_pass">Clé d'Accès (Pass)</label>
                    <input type="password" id="bizPass" name="pass" placeholder="••••••••••••" required>
                </div>

                <button type="submit" class="submit-btn" id="submitBtn" data-key="btn_activate">Activer mon Nœud Réseau</button>
            </form>

            <div id="successBox">
                <p style="color: var(--accent); font-weight: 900; font-size: 12px;" data-key="alert_success">NŒUD ACTIVÉ !</p>
                <p style="font-size: 10px; margin: 10px 0;">Votre lien de vente :</p>
                <code id="partnerLink" style="color: var(--primary); font-size: 11px; word-break: break-all;"></code>
            </div>

            <div class="footer-text">
                <span data-key="footer_alt">Déjà dans le réseau ?</span> <a href="connexion.php" data-key="link_login">Accéder au Terminal</a>
            </div>
        </div>
    </div>

    <script>
        const langData = {
            fr: {
                badge_init: "Initialisation du Nœud",
                title_partner: "PARTENAIRE",
                hero_desc: "Rejoignez le premier réseau WiFi décentralisé.",
                label_id: "Identité Business",
                label_city: "Ville",
                label_contact: "Contact (Paiement)",
                label_email: "Email de Gestion",
                label_pass: "Clé d'Accès (Pass)",
                btn_activate: "Activer mon Nœud Réseau",
                footer_alt: "Déjà dans le réseau ?",
                link_login: "Accéder au Terminal",
                alert_success: "SYSTÈME : Nœud activé avec succès sur le protocole ALPHA.",
                btn_sync: "SYNCHRONISATION..."
            },
            en: {
                badge_init: "Node Initialization",
                title_partner: "PARTNER",
                hero_desc: "Join the first decentralized WiFi network.",
                label_id: "Business Identity",
                label_city: "City",
                label_contact: "Contact (Payment)",
                label_email: "Management Email",
                label_pass: "Access Key (Pass)",
                btn_activate: "Activate my Network Node",
                footer_alt: "Already in the network?",
                link_login: "Access Terminal",
                alert_success: "SYSTEM: Node successfully activated on ALPHA protocol.",
                btn_sync: "SYNCHRONIZING..."
            }
        };

        function changeLang(lang) {
            document.querySelectorAll('[data-key]').forEach(el => {
                const key = el.getAttribute('data-key');
                if (langData[lang] && langData[lang][key]) el.innerText = langData[lang][key];
            });
            document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
            if(event) event.target.classList.add('active');
            localStorage.setItem('aerio_lang', lang);
        }

        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const currentLang = localStorage.getItem('aerio_lang') || 'fr';
            
            btn.innerText = langData[currentLang].btn_sync;
            btn.disabled = true;

            const partnerData = {
                name: document.getElementById('bizName').value,
                city: document.getElementById('bizCity').value,
                tel: document.getElementById('bizTel').value,
                email: document.getElementById('bizEmail').value,
                pass: document.getElementById('bizPass').value
            };

            try {
                // Liaison avec ton script PHP local (DADIE IA Secure)
                const response = await fetch('register_process.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(partnerData)
                });

                const result = await response.json();

                if (result.status === "success") {
                    document.getElementById('registerForm').style.display = 'none';
                    document.getElementById('successBox').style.display = 'block';
                    const myLink = window.location.origin + "/index.html?partnerID=" + result.partnerID;
                    document.getElementById('partnerLink').innerText = myLink;
                } else {
                    alert("Erreur Système: " + result.message);
                    btn.disabled = false;
                    btn.innerText = langData[currentLang].btn_activate;
                }
            } catch (error) {
                console.error("Liaison interrompue");
                btn.disabled = false;
                btn.innerText = langData[currentLang].btn_activate;
            }
        });
    </script>
</body>
</html>
