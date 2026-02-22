// ✅ LE DICTIONNAIRE DE TRADUCTION ALPHA (VERSION DASHBOARD INCLUS)
const translations = {
    fr: {
        // --- ACCUEIL ---
        nav_home: "Accueil",
        nav_partners: "Partenariats",
        nav_docs: "Documentation",
        nav_pro: "ESPACE PRO",
        hero_tag: "🛰️ RÉSEAU ALPHA DÉPLOYÉ",
        hero_title: "Le Futur du <br><span style='color:#00C2FF'>WiFi Zone.</span>",
        hero_p: "Monétisez votre connexion MikroTik avec la puissance du Mobile Money à l'échelle internationale.",
        btn_partner: "Devenir Partenaire",
        live_title: "VOTRE BUSINESS EN LIVE",
        live_flow: "FLUX GÉNÉRÉ EN LIVE",
        live_status: "RÉSEAU : <span style='color:#00F5A0'>ACTIF</span>",
        live_hub: "HUB : INTERNATIONAL",
        arsenal_title: "L'ARSENAL <span style='color:#00C2FF'>TACTIQUE</span>",
        card_1_t: "🛰️ DÉPLOIEMENT",
        card_1_p: "Importation CSV MikroTik industrielle en 1 seconde.",
        hub_title: "HUB <span style='color:#00C2FF'>INTERNATIONAL</span>",
        flag_1: "CAMEROUN", flag_1_s: "Hub Central",
        flag_2: "CÔTE D'IVOIRE", flag_2_s: "Nœud Actif",
        flag_3: "FRANCE", flag_3_s: "Passerelle Europe",
        flag_4: "BRÉSIL", flag_4_s: "Liaison Latam",
        flag_5: "SÉNÉGAL", flag_5_s: "Liaison Établie",

        // --- DASHBOARD (NOUVEAU) ---
        dash_title: "Console",
        dash_status: "STATUT : ACCRÉDITÉ",
        dash_nav_home: "📊 Tableau de bord",
        dash_nav_tickets: "🎫 Mes Tickets",
        dash_sub_add: "• Ajouter un ticket",
        dash_sub_list: "• Liste des tickets",
        dash_nav_compta: "💰 Ma Comptabilité",
        dash_sub_payout: "• Effectuer un retrait",
        dash_sub_revenue: "• Mes Recettes",
        dash_q_profile: "Mon Profil",
        dash_q_profile_s: "Identité Alpha",
        dash_q_support: "Support Chat",
        dash_q_docs: "Contacts & Docs",
        dash_q_docs_s: "Base Documentaire",
        dash_stat_gain: "GAIN RÉEL DISPONIBLE",
        dash_stat_stock: "SESSIONS EN STOCK"
    },
    en: {
        // --- HOME ---
        nav_home: "Home",
        nav_partners: "Partnerships",
        nav_docs: "Documentation",
        nav_pro: "PRO SPACE",
        hero_tag: "🛰️ ALPHA NETWORK DEPLOYED",
        hero_title: "The Future of <br><span style='color:#00C2FF'>WiFi Zone.</span>",
        hero_p: "Monetize your MikroTik connection with the power of Mobile Money on an international scale.",
        btn_partner: "Become a Partner",
        live_title: "YOUR BUSINESS LIVE",
        live_flow: "LIVE GENERATED FLOW",
        live_status: "NETWORK: <span style='color:#00F5A0'>ACTIVE</span>",
        live_hub: "HUB: INTERNATIONAL",
        arsenal_title: "TACTICAL <span style='color:#00C2FF'>ARSENAL</span>",
        card_1_t: "🛰️ DEPLOYMENT",
        card_1_p: "Industrial MikroTik CSV import in 1 second.",
        hub_title: "INTERNATIONAL <span style='color:#00C2FF'>HUB</span>",
        flag_1: "CAMEROON", flag_1_s: "Central Hub",
        flag_2: "IVORY COAST", flag_2_s: "Active Node",
        flag_3: "FRANCE", flag_3_s: "Europe Gateway",
        flag_4: "BRAZIL", flag_4_s: "Latam Liaison",
        flag_5: "SENEGAL", flag_5_s: "Established Liaison",

        // --- DASHBOARD (NEW) ---
        dash_title: "Console",
        dash_status: "STATUS: ACCREDITED",
        dash_nav_home: "📊 Dashboard",
        dash_nav_tickets: "🎫 My Tickets",
        dash_sub_add: "• Add a ticket",
        dash_sub_list: "• Ticket List",
        dash_nav_compta: "💰 My Accounting",
        dash_sub_payout: "• Make a withdrawal",
        dash_sub_revenue: "• My Revenue",
        dash_q_profile: "My Profile",
        dash_q_profile_s: "Alpha Identity",
        dash_q_support: "Support Chat",
        dash_q_docs: "Contacts & Docs",
        dash_q_docs_s: "Documentation Base",
        dash_stat_gain: "REAL AVAILABLE GAIN",
        dash_stat_stock: "SESSIONS IN STOCK"
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

    // Mise à jour visuelle des boutons FR/EN
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const btnLang = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        btn.classList.toggle('active', btnLang === lang);
    });
}
