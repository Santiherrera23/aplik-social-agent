// =============================================
// APLIK SOCIAL AGENT — Entry Point
// =============================================

import "dotenv/config";
import cron from "node-cron";
import { runAgent, runWeeklyPlanning, runMultiPlatformContent } from "./agent.js";

console.log("🚀 Aplik Social Agent — Iniciando...");
console.log(`📅 Fecha: ${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })}`);
console.log("");

// ---- Validar variables de entorno ----
const required = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "PUBLER_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Variables de entorno faltantes: ${missing.join(", ")}`);
  console.error("Configura estas variables en Railway → Settings → Variables");
  process.exit(1);
}

console.log("✅ Variables de entorno verificadas");
console.log("");

// =============================================
// Helper: delay aleatorio dentro de una ventana
// Para que los posts no salgan siempre a la misma hora exacta
// =============================================
function randomDelay(minMinutes, maxMinutes) {
  const ms = (Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes) * 60 * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================
// CRON JOBS — 3 franjas diarias
// Colombia = UTC-5
// =============================================

// 🗓️ DAILY CONTENT: 7:00 AM Colombia = 12:00 PM UTC — generates ALL 3 batches for the day
cron.schedule("0 12 * * *", async () => {
  console.log("\n📋 [CRON] Generando contenido del día completo...");
  try {
    console.log("🌅 Batch 1/3: Franja mañana");
    await runMultiPlatformContent("aplik", "mañana");

    console.log("☀️ Batch 2/3: Franja tarde");
    await runMultiPlatformContent("aplik", "tarde");

    console.log("🌙 Batch 3/3: Franja noche");
    await runMultiPlatformContent("aplik", "noche");

    console.log("✅ Los 9 posts del día están listos en Publer");
  } catch (error) {
    console.error("❌ Error generando contenido del día:", error.message);
  }
});

// 🗓️ PLANNING SEMANAL: Domingo 8PM Colombia = Lunes 1AM UTC
cron.schedule("0 1 * * 1", async () => {
  console.log("\n🗓️ [CRON] Planning semanal iniciado");
  try {
    await runWeeklyPlanning("aplik");
  } catch (error) {
    console.error("❌ Error en planning semanal:", error.message);
  }
});

// 📊 REPORTE SEMANAL: Sábado 10AM Colombia = 3PM UTC
cron.schedule("0 15 * * 6", async () => {
  console.log("\n📊 [CRON] Reporte semanal iniciado");
  try {
    await runAgent(
      "Genera un reporte de la semana: consulta todos los posts de esta semana en Supabase, analiza qué temas se usaron, los QA scores, y genera recomendaciones para la próxima semana.",
      "aplik"
    );
  } catch (error) {
    console.error("❌ Error en reporte semanal:", error.message);
  }
});

console.log("⏰ Cron jobs configurados (horario Colombia):");
console.log("   📋 Contenido diario: 7:00 AM (9 posts en 3 franjas)");
console.log("   🗓️ Planning: Domingos 8PM");
console.log("   📊 Reporte: Sábados 10AM");
console.log("");
console.log("📊 Rutina: Abre Publer a las 8AM, aprueba los 9 drafts, listo.");
console.log("🟢 Agente activo y esperando...");
console.log("");

// Mantener el proceso vivo
process.on("SIGTERM", () => {
  console.log("👋 Agente detenido por SIGTERM");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 Agente detenido por SIGINT");
  process.exit(0);
});
