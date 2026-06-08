// =============================================
// TEST — Ejecutar el pipeline manualmente
// =============================================
// Modos:
//   npm test                    → test completo (mañana)
//   node src/test-pipeline.js simple   → solo genera copy
//   node src/test-pipeline.js mañana   → franja mañana completa
//   node src/test-pipeline.js tarde    → franja tarde completa
//   node src/test-pipeline.js noche    → franja noche completa
//   node src/test-pipeline.js accounts → lista cuentas de Publer
// =============================================

import "dotenv/config";
import { runAgent, runMultiPlatformContent } from "./agent.js";

const testMode = process.argv[2] || "mañana";

async function main() {
  console.log(`🧪 TEST MODE — Ejecutando: ${testMode}\n`);

  switch (testMode) {
    case "simple":
      await runAgent(
        "Genera un post educativo para Instagram sobre cómo mejorar tu hoja de vida en Colombia. Solo genera el copy y evalúalo. NO publiques en Publer.",
        "aplik"
      );
      break;

    case "mañana":
      await runMultiPlatformContent("aplik", "mañana");
      break;

    case "tarde":
      await runMultiPlatformContent("aplik", "tarde");
      break;

    case "noche":
      await runMultiPlatformContent("aplik", "noche");
      break;

    case "accounts":
      await runAgent(
        "Lista todas las cuentas sociales conectadas en Publer y dime sus IDs y plataformas.",
        "aplik"
      );
      break;

    default:
      console.log("Modos: simple, mañana, tarde, noche, accounts");
  }
}

main().catch((err) => {
  console.error("❌ Test falló:", err);
  process.exit(1);
});
