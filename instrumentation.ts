import { OpenTelemetry } from "@ai-sdk/otel";
import { registerOTel } from "@vercel/otel";
import { registerTelemetry } from "ai";

/**
 * Télémétrie OPT-IN.
 *
 * `registerOTel` + `registerTelemetry` étaient inconditionnels : chaque span,
 * chaque événement AI SDK sérialisait ses attributs (prompt et réponse
 * compris) sur toutes les invocations. C'est du CPU pur, facturé en Fluid
 * Active CPU, pour un quota Hobby de 4 h/mois.
 *
 * La télémétrie ne sert qu'au diagnostic : elle s'active donc explicitement
 * avec `OTEL_ENABLED=1`, le temps d'une enquête, puis se coupe. Les traces ne
 * sont pas perdues côté plateforme : Vercel exposent toujours les logs et les
 * métriques de fonctions.
 */
export function register() {
  if (process.env.OTEL_ENABLED !== "1") {
    return;
  }
  registerOTel({ serviceName: "chatbot" });
  registerTelemetry(new OpenTelemetry());
}
