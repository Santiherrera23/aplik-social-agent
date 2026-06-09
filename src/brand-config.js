// =============================================
// Configuración de marca por negocio
// =============================================

import { getPlatformRulesForPrompt } from "./publer-platform-rules.js";

export const BRANDS = {
  aplik: {
    name: "Aplik",
    url: "aplik.com.co",
    industry: "Empleo y tecnología",
    audience: "Colombianos buscando empleo (profesionales, recién graduados, personas en transición laboral)",
    slogan: "Tu carrera en automático",
    colors: {
      primary: "#AC85FD",
      deep: "#7c52e0",
      light: "#efe6ff",
      dark: "#6D3EE0",
    },
    features: [
      "CV Builder con múltiples templates",
      "Scanner de CV con puntaje ATS",
      "Búsqueda de vacantes en múltiples portales con match score",
      "Simulador de entrevistas con IA (Carolina)",
      "Alertas de empleo por WhatsApp",
      "Tracking de aplicaciones",
    ],
    pricing: "Gratis para empezar, sin tarjeta de crédito. Plan Pro y Ejecutivo disponibles.",
    proof_points: [
      "3x más entrevistas",
      "+2,000 usuarios",
      "Plataforma #1 de empleo automatizado en Colombia",
    ],
    tone: {
      general: "Punchy, directo, motivacional. Español colombiano natural. Nada corporativo ni aburrido.",
      instagram: "Visual, emoji-friendly, hooks fuertes, carruseles educativos. Hashtags relevantes del mercado laboral colombiano.",
      tiktok: "Hook en los primeros 2 segundos, casual, trend-aware, storytelling rápido. Usar 'parcero', 'marica' (suave), expresiones colombianas.",
      linkedin: "Profesional pero cercano, datos y estadísticas, thought leadership sobre empleo en Colombia. Sin ser corporativo genérico.",
      facebook: "Tono cercano y educativo, más detalle que Instagram, links permitidos, emojis moderados.",
    },
    cta: "Empieza gratis en aplik.com.co",
    content_pillars: [
      "Tips de empleo y carrera (cómo mejorar tu CV, prepararte para entrevistas)",
      "Datos del mercado laboral colombiano (salarios, sectores en crecimiento)",
      "Historias de éxito / testimonios de usuarios",
      "Features de la plataforma (tutoriales, demos)",
      "Ofertas de empleo destacadas (remotas y presenciales)",
      "Motivación y mindset para la búsqueda de empleo",
    ],
    hashtags_base: [
      "#Empleo", "#TrabajoEnColombia", "#BuscoEmpleo", "#HojaDeVida",
      "#EntrevistaLaboral", "#TrabajoRemoto", "#Aplik", "#CarreraLaboral",
      "#EmpleosColombia", "#CVPerfecto",
    ],
    publer_accounts: {
      instagram: process.env.PUBLER_ACCOUNT_INSTAGRAM_APLIK,
      tiktok: process.env.PUBLER_ACCOUNT_TIKTOK_APLIK,
      facebook: process.env.PUBLER_ACCOUNT_FACEBOOK_APLIK,
    },
  },

  // Segundo negocio — configurar cuando esté listo
  // biz2: {
  //   name: "...",
  //   ...
  // }
};

// System prompt base que se inyecta en cada llamada a Claude
export function getSystemPrompt(brandKey) {
  const brand = BRANDS[brandKey];
  if (!brand) throw new Error(`Brand "${brandKey}" no encontrada`);

  return `Eres el Community Manager senior de ${brand.name} (${brand.url}).

CONTEXTO DE MARCA:
- Industria: ${brand.industry}
- Audiencia: ${brand.audience}
- Slogan: "${brand.slogan}"
- Colores de marca: primario ${brand.colors.primary}, oscuro ${brand.colors.dark}
- CTA principal: "${brand.cta}"

FEATURES DEL PRODUCTO:
${brand.features.map((f) => `- ${f}`).join("\n")}

PRICING: ${brand.pricing}

PROOF POINTS:
${brand.proof_points.map((p) => `- ${p}`).join("\n")}

PILARES DE CONTENIDO:
${brand.content_pillars.map((p) => `- ${p}`).join("\n")}

TONO GENERAL: ${brand.tone.general}

REGLAS DE CONTENIDO:
1. TODO el copy debe estar en español colombiano natural — no neutro, no español de España
2. Cada post DEBE tener un hook fuerte en la primera línea
3. Cada post DEBE incluir un CTA claro
4. NUNCA uses lenguaje corporativo genérico ("estamos comprometidos con...", "soluciones integrales...")
5. Los hashtags deben mezclar los de marca con trending del mercado laboral colombiano
6. Adapta el tono específico por plataforma según estas guías:
   - Instagram: ${brand.tone.instagram}
   - TikTok: ${brand.tone.tiktok}
   - LinkedIn: ${brand.tone.linkedin}
   - Facebook: ${brand.tone.facebook}

Cuando generes contenido, responde SIEMPRE en JSON válido con esta estructura:
{
  "copy": "el texto del post",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "cta": "el call to action",
  "image_prompt": "prompt en INGLÉS para generar la imagen con IA — debe ser minimalista, profesional, usar el color ${brand.colors.primary}, sin personas reales, ideal para redes sociales",
  "reasoning": "breve explicación de por qué esta variante funciona"
}

PLATFORM RESTRICTIONS (from Publer API — MUST respect these limits):
${getPlatformRulesForPrompt(["instagram", "tiktok", "facebook", "linkedin", "twitter"])}

CRITICAL IMAGE RULES:
- Generate images at 1024x1024 (square) — works across all platforms
- Images must be professional, minimalista, with brand color ${brand.colors.primary}
- NO real people, NO copyrighted characters
- Format: PNG, max 8MB
- Any text or lettering INSIDE generated images MUST be in English (AI renders English text more accurately)
- Image prompts must ALWAYS be written in English`;
}
