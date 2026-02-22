// ✅ LE CERVEAU MULTILINGUE GLOBAL AERIO (ZÉRO PERTE - VERSION LIAISON STRATÉGIQUE)
const translations = {
    fr: {
        // --- ACCUEIL ---
        nav_home: "Accueil", nav_partners: "Partenariats", nav_docs: "Documentation", nav_pro: "ESPACE PRO",
        hero_tag: "🛰️ PROTOCOLE ALPHA ACTIVÉ",
        hero_title: "Le Futur du <br><span style='color:#00C2FF'>WiFi Zone.</span>",
        hero_p: "Monétisez votre connexion MikroTik avec la puissance du Mobile Money à l'échelle internationale.",
        btn_partner: "Devenir Partenaire",
        live_title: "VOTRE BUSINESS EN LIVE", live_flow: "FLUX GÉNÉRÉ EN LIVE",
        live_status: "RÉSEAU : <span style='color:#00F5A0'>ACTIF</span>", live_hub: "HUB : INTERNATIONAL",
        
        // Arsenal & Hub
        arsenal_title: "L'ARSENAL <span style='color:#00C2FF'>TACTIQUE</span>",
        card_1_t: "🛰️ DÉPLOIEMENT", card_1_p: "Importation CSV MikroTik industrielle en 1 seconde.",
        card_2_t: "💸 VENTE AUTO", card_2_p: "Paiements Mobile Money sécurisés et sans data.",
        card_3_t: "📈 RADAR PERF", card_3_p: "Suivi des recettes brutes en temps réel 24h/7j.",
        card_4_t: "🔓 ZERO DATA", card_4_p: "Le Walled Garden permet de payer sans forfait internet.",
        hub_title: "HUB <span style='color:#00C2FF'>INTERNATIONAL</span>",
        flag_1: "CAMEROUN", flag_1_s: "Hub Central", flag_2: "CÔTE D'IVOIRE", flag_2_s: "Nœud Actif",

        // ✅ NOUVEAU TITRE & CONTACTS ORIGINAUX
        contact_sub: "🛰️ LIAISON STRATÉGIQUE",
        contact_title: "Propulsez votre <span style='color:#00C2FF'>Infrastructure WiFi.</span>",
        contact_p: "Nos experts déploient votre matériel et configurent votre noyau AERIO.",

        // --- DASHBOARD & MANUEL ---
        dash_title: "Console", dash_status: "STATUT : ACCRÉDITÉ", dash_nav_home: "📊 Tableau de bord",
        dash_stat_gain: "GAIN RÉEL DISPONIBLE", dash_stat_stock: "SESSIONS EN STOCK",
        guide_title: "MANUEL DE CONFIGURATION <span style='color:#00C2FF'>ALPHA</span>",
        btn_copy: "COPIER LE SCRIPT ALPHA"
    },
    en: {
        // --- HOME ---
        nav_home: "Home", nav_partners: "Partnerships", nav_docs: "Documentation", nav_pro: "PRO SPACE",
        hero_tag: "🛰️ ALPHA PROTOCOL ACTIVATED",
        hero_title: "The Future of <br><span style='color:#00C2FF'>WiFi Zone.</span>",
        hero_p: "Monetize your MikroTik connection with the power of Mobile Money on an international scale.",
        btn_partner: "Become a Partner",
        live_title: "YOUR BUSINESS LIVE", live_flow: "LIVE GENERATED FLOW",
        live_status: "NETWORK: <span style='color:#00F5A0'>ACTIVE</span>", live_hub: "HUB: INTERNATIONAL",
        
        // Arsenal & Hub
        arsenal_title: "TACTICAL <span style='color:#00C2FF'>ARSENAL</span>",
        card_1_t: "🛰️ DEPLOYMENT", card_1_p: "Industrial MikroTik CSV import in 1 second.",
        hub_title: "INTERNATIONAL <span style='color:#00C2FF'>HUB</span>",
        flag_1: "CAMEROON", flag_1_s: "Central Hub",

        // ✅ NEW STRATEGIC CONTACTS
        contact_sub: "🛰️ STRATEGIC LIAISON",
        contact_title: "Boost your <span style='color:#00C2FF'>WiFi Infrastructure.</span>",
        contact_p: "Our experts deploy your hardware and configure your AERIO core.",

        // --- DASHBOARD & MANUAL ---
        dash_title: "Console", dash_status: "STATUS: ACCREDITED", dash_nav_home: "📊 Dashboard",
        dash_stat_gain: "REAL AVAILABLE GAIN", dash_stat_stock: "SESSIONS IN STOCK",
        guide_title: "ALPHA <span style='color:#00C2FF'>CONFIGURATION MANUAL</span>",
        btn_copy: "COPY ALPHA SCRIPT"
    },
    pt: {
        nav_home: "Início", nav_pro: "ESPAÇO PRO",
        contact_sub: "🛰️ LIGAÇÃO ESTRATÉGICA",
        contact_title: "Impulsione sua <span style='color:#00C2FF'>Infraestrutura WiFi.</span>",
        hero_title: "O Futuro da <br><span style='color:#00C2FF'>WiFi Zone.</span>",
        dash_stat_gain: "LUCRO REAL DISPONÍVEL"
    },
    es: {
        nav_home: "Inicio", nav_pro: "ESPACIO PRO",
        contact_sub: "🛰️ ENLACE ESTRATÉGICO",
        contact_title: "Impulse su <span style='color:#00C2FF'>Infraestructura WiFi.</span>",
        hero_title: "El Futuro de la <br><span style='color:#00C2FF'>WiFi Zone.</span>",
        dash_stat_gain: "GANANCIA REAL DISPONIBLE"
    }
};

// ⚙️ MOTEUR DE CHANGEMENT DE LANGUE (ULTRA-FLUIDE)
function setLang(lang) {
    localStorage.setItem('aerio_lang', lang);
    applyTranslations();
}

function applyTranslations() {
    const lang = localStorage.getItem('aerio_lang') || 'fr';
    const elements = document.querySelectorAll('[data-lang]');
    
    elements.forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Mise à jour visuelle des boutons (FR / EN / PT / ES)
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const btnLangMatch = btn.getAttribute('onclick').match(/'([^']+)'/);
        if (btnLangMatch) {
            btn.classList.toggle('active', btnLangMatch[1] === lang);
        }
    });
}
