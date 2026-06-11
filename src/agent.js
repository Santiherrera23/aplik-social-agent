// =============================================
// AGENTE COMMUNITY MANAGER — Claude API + Tool Use
// =============================================

import Anthropic from "@anthropic-ai/sdk";
import { TOOL_DEFINITIONS, executeTool } from "./tools.js";
import { getSystemPrompt } from "./brand-config.js";

const client = new Anthropic();
const MODEL = "claude-sonnet-4-20250514";
const MAX_TURNS = 25;

/**
 * Ejecuta el agente con una tarea específica.
 * Claude decide qué tools usar y en qué orden.
 */
export async function runAgent(task, brandKey = "aplik") {
  console.log("\n" + "=".repeat(60));
  console.log(`🤖 AGENTE SOCIAL — Iniciando tarea`);
  console.log(`📋 Tarea: ${task.substring(0, 100)}...`);
  console.log(`🏷️  Marca: ${brandKey}`);
  console.log("=".repeat(60));

  const systemPrompt = getSystemPrompt(brandKey);

  const cachedTools = TOOL_DEFINITIONS.map((t, i) =>
    i === TOOL_DEFINITIONS.length - 1
      ? { ...t, cache_control: { type: "ephemeral" } }
      : t
  );

  const messages = [
    {
      role: "user",
      content: task,
    },
  ];

  let turns = 0;
  let finalResponse = null;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  while (turns < MAX_TURNS) {
    turns++;
    console.log(`\n--- Turno ${turns} ---`);

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        tools: cachedTools,
        messages,
      });

      const assistantContent = response.content;
      messages.push({ role: "assistant", content: assistantContent });

      if (response.usage) {
        totalInputTokens += response.usage.input_tokens || 0;
        totalOutputTokens += response.usage.output_tokens || 0;
      }

      if (response.stop_reason === "end_turn") {
        const textBlocks = assistantContent.filter((b) => b.type === "text");
        finalResponse = textBlocks.map((b) => b.text).join("\n");
        console.log(`\n✅ Agente terminó después de ${turns} turnos`);
        break;
      }

      const toolUseBlocks = assistantContent.filter((b) => b.type === "tool_use");

      if (toolUseBlocks.length === 0) {
        const textBlocks = assistantContent.filter((b) => b.type === "text");
        finalResponse = textBlocks.map((b) => b.text).join("\n");
        break;
      }

      const toolResults = [];

      for (const toolBlock of toolUseBlocks) {
        console.log(`🔧 Ejecutando: ${toolBlock.name}`);
        const result = await executeTool(toolBlock.name, toolBlock.input);
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolBlock.id,
          content: result,
        });
      }

      messages.push({ role: "user", content: toolResults });
    } catch (error) {
      console.error(`❌ Error en turno ${turns}:`, error.message);
      finalResponse = `Error del agente: ${error.message}`;
      break;
    }
  }

  if (turns >= MAX_TURNS) {
    console.warn(`⚠️ Agente alcanzó el límite de ${MAX_TURNS} turnos`);
    finalResponse = finalResponse || "El agente alcanzó el límite de turnos sin completar la tarea.";
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN DEL AGENTE:");
  console.log(finalResponse);
  console.log("=".repeat(60) + "\n");

  const inputCost = (totalInputTokens / 1000000) * 3;
  const outputCost = (totalOutputTokens / 1000000) * 15;
  const totalCost = inputCost + outputCost;

  console.log("\n" + "=".repeat(60));
  console.log("💰 CONSUMO DE TOKENS (Anthropic):");
  console.log(`   Input:  ${totalInputTokens.toLocaleString()} tokens`);
  console.log(`   Output: ${totalOutputTokens.toLocaleString()} tokens`);
  console.log(`   Costo:  $${totalCost.toFixed(4)} USD (~$${(totalCost * 4000).toFixed(0)} COP)`);
  console.log("=".repeat(60));

  return {
    success: turns < MAX_TURNS,
    turns,
    response: finalResponse,
    brand: brandKey,
    input_tokens: totalInputTokens,
    output_tokens: totalOutputTokens,
    cost_usd: totalCost,
  };
}

/**
 * Genera contenido multi-plataforma para una franja horaria.
 * UNA sola imagen + 3 copies diferentes (Instagram, TikTok, X).
 */
export async function runMultiPlatformContent(brandKey = "aplik", franja = "mañana") {
  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const franjaDescriptions = {
    mañana: "Franja MAÑANA (8:30-9:00 AM). Contenido motivacional o educativo para arrancar el día.",
    tarde: "Franja TARDE (12:00-3:00 PM). Contenido práctico, tips, o datos del mercado laboral.",
    noche: "Franja NOCHE (6:00-8:00 PM). Contenido de reflexión, historias de éxito, o features de la plataforma.",
  };

  const task = `Hoy es ${today}. Genera contenido para la franja: ${franjaDescriptions[franja] || franja}

HORA DE PUBLICACIÓN:
- If franja is "mañana": set scheduled_at to today at a random time between 8:30 AM and 9:00 AM Colombia time (UTC-5)
- If franja is "tarde": set scheduled_at to today at a random time between 12:00 PM and 3:00 PM Colombia time (UTC-5)
- If franja is "noche": set scheduled_at to today at a random time between 6:00 PM and 8:00 PM Colombia time (UTC-5)

When calling create_publer_draft, pass the scheduled_at parameter with the appropriate ISO 8601 timestamp for the franja.

INSTRUCCIONES IMPORTANTES:
1. PRIMERO consulta los posts recientes (get_recent_posts) para no repetir temas de los últimos días
2. Elige UN tema relevante para esta franja horaria
3. Genera UNA SOLA imagen con generate_image — esta imagen se usará para las 3 plataformas (tamaño 1024x1024 cuadrado)
4. Genera 3 versiones de copy DIFERENTES, una para cada plataforma:

   📸 INSTAGRAM: Copy más largo, visual, con emojis, 5-8 hashtags relevantes al final
   🎵 TIKTOK: Copy corto y punchy, hook fuerte, 3-5 hashtags trending, tono casual colombiano
   📘 FACEBOOK: Copy educativo y detallado, links permitidos, emojis moderados, 1-3 hashtags

5. Cada copy DEBE incluir hashtags relevantes y un CTA
6. Los 3 copies deben hablar del MISMO tema pero con el tono y formato de cada plataforma
7. Evalúa la calidad de cada copy (evaluate_content_quality)
8. Guarda cada copy en Supabase (save_content) — uno por plataforma, TODOS con la misma imagen_url
9. Sube la imagen UNA SOLA VEZ a Publer (upload_media_to_publer)
10. Crea UN draft por cada plataforma en Publer (create_publer_draft) con su respectivo Account ID y copy
11. Actualiza los estados en Supabase

RECUERDA: Misma imagen para las 3 plataformas, distinto copy para cada una. Los 3 drafts deben quedar en Publer listos para revisión.

Al final dame un resumen de los 3 posts generados con una preview del copy de cada uno.`;

  return runAgent(task, brandKey);
}

/**
 * Planning semanal.
 */
export async function runWeeklyPlanning(brandKey = "aplik") {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);

  const task = `Genera el plan de contenido para esta semana (${weekStart.toISOString().split("T")[0]}).

Primero consulta los posts recientes para ver qué se ha publicado.
Luego genera un plan de 7 días (lunes a domingo) con 3 franjas por día:

- MAÑANA (8:30-9:00 AM): Contenido motivacional o educativo
- TARDE (12:00-3:00 PM): Contenido práctico, tips, datos
- NOCHE (6:00-8:00 PM): Reflexión, historias de éxito, features

Para cada franja del día incluye:
- UN tema (el mismo para las 3 plataformas)
- Tipo de contenido (educativo, motivacional, dato, feature, testimonio, tip)
- Tono recomendado
- Pilar de contenido al que pertenece

Distribuye los pilares de contenido de forma balanceada a lo largo de la semana.
Guarda el plan en Supabase usando save_content.
Responde con el plan completo organizado por día.`;

  return runAgent(task, brandKey);
}
