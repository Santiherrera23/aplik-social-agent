// =============================================
// Implementaciones de herramientas del agente
// =============================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PUBLER_KEY = process.env.PUBLER_API_KEY;
const PUBLER_WORKSPACE = process.env.PUBLER_WORKSPACE_ID;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// ---- Headers reutilizables ----

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function publerHeaders() {
  return {
    "Authorization": `Bearer-API ${PUBLER_KEY}`,
    "Publer-Workspace-Id": process.env.PUBLER_WORKSPACE_ID || "",
    "Content-Type": "application/json",
  };
}

// =============================================
// TOOL: generate_image
// Genera una imagen con OpenAI GPT Image
// =============================================
export async function generate_image({ prompt, size = "1024x1024" }) {
  console.log(`🎨 Generando imagen: "${prompt.substring(0, 80)}..."`);

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI Image API error: ${res.status} — ${err}`);
  }

  const data = await res.json();

  // gpt-image-1 returns base64 by default
  const imageData = data.data[0];
  const imageUrl = imageData.url || `data:image/png;base64,${imageData.b64_json}`;

  console.log(`✅ Imagen generada exitosamente`);
  return { image_url: imageUrl, revised_prompt: imageData.revised_prompt || prompt };
}

// =============================================
// TOOL: get_recent_posts
// Consulta posts recientes en Supabase para evitar repetición
// =============================================
export async function get_recent_posts({ negocio, plataforma, limit = 10 }) {
  console.log(`📋 Consultando últimos ${limit} posts de ${negocio} en ${plataforma}`);

  let url = `${SUPABASE_URL}/rest/v1/contenido_generado?negocio=eq.${negocio}&order=created_at.desc&limit=${limit}`;
  if (plataforma) url += `&plataforma=eq.${plataforma}`;

  const res = await fetch(url, { headers: supabaseHeaders() });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${res.status} — ${err}`);
  }

  const posts = await res.json();
  console.log(`✅ Encontrados ${posts.length} posts recientes`);
  return { posts, count: posts.length };
}

// =============================================
// TOOL: save_content
// Guarda contenido generado en Supabase
// =============================================
export async function save_content({
  negocio, plataforma, copy, hashtags, cta,
  imagen_url, imagen_prompt, qa_score, qa_feedback, plan_id,
}) {
  console.log(`💾 Guardando contenido en Supabase para ${negocio}/${plataforma}`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/contenido_generado`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({
      negocio,
      plataforma,
      copy,
      hashtags: hashtags || [],
      cta,
      imagen_url,
      imagen_prompt,
      qa_score,
      qa_feedback,
      plan_id,
      estado: "draft",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase insert error: ${res.status} — ${err}`);
  }

  const [record] = await res.json();
  console.log(`✅ Contenido guardado con ID: ${record.id}`);
  return { id: record.id, estado: record.estado };
}

// =============================================
// TOOL: update_content_status
// Actualiza el estado de un contenido en Supabase
// =============================================
export async function update_content_status({ content_id, estado, publer_post_id, publer_media_id }) {
  console.log(`🔄 Actualizando contenido ${content_id} → estado: ${estado}`);

  const body = { estado };
  if (publer_post_id) body.publer_post_id = publer_post_id;
  if (publer_media_id) body.publer_media_id = publer_media_id;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/contenido_generado?id=eq.${content_id}`, {
    method: "PATCH",
    headers: supabaseHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase update error: ${res.status} — ${err}`);
  }

  console.log(`✅ Estado actualizado`);
  return { success: true, content_id, estado };
}

// =============================================
// TOOL: get_publer_accounts
// Lista las cuentas sociales conectadas en Publer
// =============================================
export async function get_publer_accounts() {
  console.log(`📱 Consultando cuentas de Publer`);

  const res = await fetch("https://app.publer.com/api/v1/accounts", {
    headers: publerHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Publer API error: ${res.status} — ${err}`);
  }

  const accounts = await res.json();
  const summary = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    platform: a.provider,
    username: a.username,
  }));

  console.log(`✅ Encontradas ${summary.length} cuentas`);
  return { accounts: summary };
}

// =============================================
// TOOL: upload_media_to_publer
// Sube una imagen a Publer desde URL
// =============================================
export async function upload_media_to_publer({ image_url }) {
  console.log(`📤 Subiendo imagen a Publer`);

  const res = await fetch("https://app.publer.com/api/v1/media/upload_from_url", {
    method: "POST",
    headers: publerHeaders(),
    body: JSON.stringify({ url: image_url }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Publer media upload error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  console.log(`✅ Media subida — ID: ${data.id || data.media_id || "unknown"}`);
  return { media_id: data.id || data.media_id, media_url: data.url };
}

// =============================================
// TOOL: create_publer_draft
// Crea un post como draft en Publer
// =============================================
export async function create_publer_draft({ account_ids, content, media_ids, scheduled_at }) {
  console.log(`📝 Creando draft en Publer para ${account_ids.length} cuenta(s)`);

  const body = {
    account_ids,
    content,
    is_draft: true,
  };

  if (media_ids && media_ids.length > 0) body.media_ids = media_ids;
  if (scheduled_at) {
    body.is_draft = false;
    body.scheduled_at = scheduled_at;
  }

  const res = await fetch("https://app.publer.com/api/v1/posts", {
    method: "POST",
    headers: publerHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Publer post creation error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  console.log(`✅ Draft creado en Publer`);
  return { post_id: data.id, status: data.status || "draft" };
}

// =============================================
// TOOL: evaluate_content_quality
// Claude evalúa la calidad del contenido (self-QA)
// No llama a API — solo retorna la estructura para que Claude la evalúe
// =============================================
export async function evaluate_content_quality({ copy, plataforma, negocio }) {
  // Esta herramienta es un "espejo" — devuelve el contenido para que Claude
  // lo evalúe en el siguiente turno con scoring
  return {
    content_to_evaluate: copy,
    plataforma,
    negocio,
    evaluation_criteria: [
      "brand_alignment (1-10): ¿El tono y mensaje están alineados con la marca?",
      "hook_strength (1-10): ¿La primera línea atrapa la atención?",
      "cta_clarity (1-10): ¿El CTA es claro y accionable?",
      "engagement_potential (1-10): ¿Generaría likes, comments, shares?",
      "platform_fit (1-10): ¿El formato es ideal para esta plataforma?",
    ],
    instructions: "Evalúa cada criterio del 1 al 10. Si el promedio es >= 7, aprueba. Si es < 7, sugiere mejoras específicas.",
  };
}

// =============================================
// Registro de herramientas para la API de Claude
// =============================================
export const TOOL_DEFINITIONS = [
  {
    name: "generate_image",
    description:
      "Genera una imagen usando OpenAI GPT Image. Usa esto para crear las imágenes de los posts. El prompt debe ser en INGLÉS, describiendo un diseño minimalista y profesional para redes sociales.",
    input_schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Prompt en INGLÉS para la imagen. Debe incluir el estilo visual, colores de marca, y composición deseada.",
        },
        size: {
          type: "string",
          enum: ["1024x1024", "1024x1792", "1792x1024"],
          description: "Tamaño: 1024x1024 (cuadrado/Instagram), 1024x1792 (vertical/Stories/TikTok), 1792x1024 (horizontal/LinkedIn).",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "get_recent_posts",
    description:
      "Consulta los posts más recientes de un negocio en una plataforma específica. Úsalo SIEMPRE antes de generar contenido nuevo, para evitar repetir temas.",
    input_schema: {
      type: "object",
      properties: {
        negocio: { type: "string", description: "ID del negocio (ej: 'aplik')" },
        plataforma: { type: "string", description: "Plataforma (instagram, tiktok, linkedin, x)" },
        limit: { type: "number", description: "Número de posts a consultar (default: 10)" },
      },
      required: ["negocio"],
    },
  },
  {
    name: "save_content",
    description:
      "Guarda el contenido generado en la base de datos (Supabase). Úsalo después de generar copy e imagen.",
    input_schema: {
      type: "object",
      properties: {
        negocio: { type: "string" },
        plataforma: { type: "string" },
        copy: { type: "string", description: "El texto completo del post incluyendo hashtags" },
        hashtags: { type: "array", items: { type: "string" } },
        cta: { type: "string" },
        imagen_url: { type: "string" },
        imagen_prompt: { type: "string" },
        qa_score: { type: "number", description: "Score de calidad promedio (1-10)" },
        qa_feedback: { type: "string", description: "Feedback de calidad del contenido" },
        plan_id: { type: "string", description: "UUID del plan semanal (si aplica)" },
      },
      required: ["negocio", "plataforma", "copy"],
    },
  },
  {
    name: "update_content_status",
    description: "Actualiza el estado de un contenido ya guardado (draft → aprobado → publicado).",
    input_schema: {
      type: "object",
      properties: {
        content_id: { type: "string", description: "UUID del contenido en Supabase" },
        estado: { type: "string", enum: ["draft", "aprobado", "publicado", "rechazado"] },
        publer_post_id: { type: "string" },
        publer_media_id: { type: "string" },
      },
      required: ["content_id", "estado"],
    },
  },
  {
    name: "get_publer_accounts",
    description:
      "Lista todas las cuentas sociales conectadas en Publer con sus IDs. Útil para saber a qué cuentas publicar.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "upload_media_to_publer",
    description: "Sube una imagen a Publer desde una URL. Retorna el media_id necesario para crear el post.",
    input_schema: {
      type: "object",
      properties: {
        image_url: { type: "string", description: "URL pública de la imagen a subir" },
      },
      required: ["image_url"],
    },
  },
  {
    name: "create_publer_draft",
    description:
      "Crea un post como draft (borrador) en Publer. El draft aparece en el dashboard de Publer para revisión antes de publicar.",
    input_schema: {
      type: "object",
      properties: {
        account_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs de las cuentas de Publer donde publicar",
        },
        content: { type: "string", description: "El texto completo del post" },
        media_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs de media ya subida a Publer",
        },
        scheduled_at: {
          type: "string",
          description: "Fecha/hora ISO 8601 para programar (si se omite, se crea como draft)",
        },
      },
      required: ["account_ids", "content"],
    },
  },
  {
    name: "evaluate_content_quality",
    description:
      "Evalúa la calidad de un contenido generado antes de publicarlo. Retorna los criterios de evaluación para que determines el score.",
    input_schema: {
      type: "object",
      properties: {
        copy: { type: "string", description: "El texto del post a evaluar" },
        plataforma: { type: "string" },
        negocio: { type: "string" },
      },
      required: ["copy", "plataforma", "negocio"],
    },
  },
];

// =============================================
// Ejecutor de herramientas
// =============================================
const TOOL_MAP = {
  generate_image,
  get_recent_posts,
  save_content,
  update_content_status,
  get_publer_accounts,
  upload_media_to_publer,
  create_publer_draft,
  evaluate_content_quality,
};

export async function executeTool(name, input) {
  const fn = TOOL_MAP[name];
  if (!fn) throw new Error(`Tool desconocida: ${name}`);

  try {
    const result = await fn(input);
    return JSON.stringify(result);
  } catch (error) {
    console.error(`❌ Error ejecutando tool "${name}":`, error.message);
    return JSON.stringify({ error: error.message });
  }
}
