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

// 🌅 MAÑANA: 8:30 AM Colombia = 1:30 PM UTC
// Cron dispara a las 1:30 PM UTC, delay aleatorio 0-30 min (8:30-9:00 AM COL)
cron.schedule("30 13 * * *", async () => {
  const delay = Math.floor(Math.random() * 30);
  console.log(`\n🌅 [CRON] Franja MAÑANA — esperando ${delay} min para variedad`);
  await randomDelay(0, delay);

  try {
    await runMultiPlatformContent("aplik", "mañana");
    // Descomentar para segundo negocio:
    // await runMultiPlatformContent("biz2", "mañana");
  } catch (error) {
    console.error("❌ Error en franja mañana:", error.message);
  }
});

// ☀️ TARDE: 12:00 PM Colombia = 5:00 PM UTC
// Cron dispara a las 5:00 PM UTC, delay aleatorio 0-180 min (12:00-3:00 PM COL)
cron.schedule("0 17 * * *", async () => {
  const delay = Math.floor(Math.random() * 180);
  console.log(`\n☀️ [CRON] Franja TARDE — esperando ${delay} min para variedad`);
  await randomDelay(0, delay);

  try {
    await runMultiPlatformContent("aplik", "tarde");
    // Descomentar para segundo negocio:
    // await runMultiPlatformContent("biz2", "tarde");
  } catch (error) {
    console.error("❌ Error en franja tarde:", error.message);
  }
});

// 🌙 NOCHE: 6:00 PM Colombia = 11:00 PM UTC
// Cron dispara a las 11:00 PM UTC, delay aleatorio 0-120 min (6:00-8:00 PM COL)
cron.schedule("0 23 * * *", async () => {
  const delay = Math.floor(Math.random() * 120);
  console.log(`\n🌙 [CRON] Franja NOCHE — esperando ${delay} min para variedad`);
  await randomDelay(0, delay);

  try {
    await runMultiPlatformContent("aplik", "noche");
    // Descomentar para segundo negocio:
    // await runMultiPlatformContent("biz2", "noche");
  } catch (error) {
    console.error("❌ Error en franja noche:", error.message);
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
console.log("   🌅 Mañana:   8:30-9:00 AM  → IG + TikTok + X (misma imagen, 3 copies)");
console.log("   ☀️ Tarde:    12:00-3:00 PM → IG + TikTok + X (misma imagen, 3 copies)");
console.log("   🌙 Noche:    6:00-8:00 PM  → IG + TikTok + X (misma imagen, 3 copies)");
console.log("   🗓️ Planning: Domingos 8PM");
console.log("   📊 Reporte:  Sábados 10AM");
console.log("");
console.log("📊 Total: 9 posts/día (3 franjas × 3 plataformas)");
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
