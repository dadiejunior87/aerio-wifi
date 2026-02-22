// ✅ DICTIONNAIRE DE TRADUCTION ALPHA
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
        live_hub: "HUB : INTERNATIONAL"
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
        live_hub: "HUB: INTERNATIONAL"
    }
};

// ⚙️ MOTEUR DE CHANGEMENT DE LANGUE
function setLang(lang) {
    localStorage.setItem('aerio_lang', lang);
    applyTranslations();
}

function applyTranslations() {
    const lang = localStorage.getItem('aerio_lang') || 'fr';
    const elements = document.querySelectorAll('[data-lang]');
    
    elements.forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Mise à jour visuelle des boutons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(lang));
    });
}
