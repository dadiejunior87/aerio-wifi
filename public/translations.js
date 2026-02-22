// ✅ LE DICTIONNAIRE DE TRADUCTION ALPHA (ZÉRO PERTE - 100% INTÉGRAL)
const translations = {
    fr: {
        // Navigation & Général
        nav_home: "Accueil",
        nav_partners: "Partenariats",
        nav_docs: "Documentation",
        nav_pro: "ESPACE PRO",
        
        // Hero Section
        hero_tag: "🛰️ RÉSEAU ALPHA DÉPLOYÉ",
        hero_title: "Le Futur du <br><span style='color:#00C2FF'>WiFi Zone.</span>",
        hero_p: "Monétisez votre connexion MikroTik avec la puissance du Mobile Money à l'échelle internationale.",
        btn_partner: "Devenir Partenaire",
        
        // Live Card
        live_title: "VOTRE BUSINESS EN LIVE",
        live_flow: "FLUX GÉNÉRÉ EN LIVE",
        live_status: "RÉSEAU : <span style='color:#00F5A0'>ACTIF</span>",
        live_hub: "HUB : INTERNATIONAL",

        // Section Arsenal (Les 8 cartes tactiques)
        arsenal_title: "L'ARSENAL <span style='color:#00C2FF'>TACTIQUE</span>",
        card_1_t: "🛰️ DÉPLOIEMENT",
        card_1_p: "Importation CSV MikroTik industrielle en 1 seconde.",
        card_2_t: "💸 VENTE AUTO",
        card_2_p: "Paiements Mobile Money sécurisés et sans data.",
        card_3_t: "📈 RADAR PERF",
        card_3_p: "Suivi des recettes brutes en temps réel 24h/7j.",
        card_4_t: "🔓 ZERO DATA",
        card_4_p: "Le Walled Garden permet de payer sans forfait internet.",

        // Section Hub International (Les Drapeaux)
        hub_title: "HUB <span style='color:#00C2FF'>INTERNATIONAL</span>",
        flag_1: "CAMEROUN", flag_1_s: "Hub Central",
        flag_2: "CÔTE D'IVOIRE", flag_2_s: "Nœud Actif",
        flag_3: "FRANCE", flag_3_s: "Passerelle Europe",
        flag_4: "BRÉSIL", flag_4_s: "Liaison Latam",
        flag_5: "SÉNÉGAL", flag_5_s: "Liaison Établie"
    },
    en: {
        // Navigation & General
        nav_home: "Home",
        nav_partners: "Partnerships",
        nav_docs: "Documentation",
        nav_pro: "PRO SPACE",
        
        // Hero Section
        hero_tag: "🛰️ ALPHA NETWORK DEPLOYED",
        hero_title: "The Future of <br><span style='color:#00C2FF'>WiFi Zone.</span>",
        hero_p: "Monetize your MikroTik connection with the power of Mobile Money on an international scale.",
        btn_partner: "Become a Partner",
        
        // Live Card
        live_title: "YOUR BUSINESS LIVE",
        live_flow: "LIVE GENERATED FLOW",
        live_status: "NETWORK: <span style='color:#00F5A0'>ACTIVE</span>",
        live_hub: "HUB: INTERNATIONAL",

        // Arsenal Section (The 8 tactical cards)
        arsenal_title: "TACTICAL <span style='color:#00C2FF'>ARSENAL</span>",
        card_1_t: "🛰️ DEPLOYMENT",
        card_1_p: "Industrial MikroTik CSV import in 1 second.",
        card_2_t: "💸 AUTO SALES",
        card_2_p: "Secure Mobile Money payments without data.",
        card_3_t: "📈 PERF RADAR",
        card_3_p: "Track gross revenue in real-time 24/7.",
        card_4_t: "🔓 ZERO DATA",
        card_4_p: "Walled Garden allows payment without active data.",

        // International Hub Section (Flags)
        hub_title: "INTERNATIONAL <span style='color:#00C2FF'>HUB</span>",
        flag_1: "CAMEROON", flag_1_s: "Central Hub",
        flag_2: "IVORY COAST", flag_2_s: "Active Node",
        flag_3: "FRANCE", flag_3_s: "Europe Gateway",
        flag_4: "BRAZIL", flag_4_s: "Latam Liaison",
        flag_5: "SENEGAL", flag_5_s: "Established Liaison"
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
