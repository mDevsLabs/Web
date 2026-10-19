import { getDb } from "./config.ts";
import { updateModels } from "./updateModels.ts";

export const MODEL_SYNC_SCHEDULE = "0 */12 * * *";

// Sur les hôtes Deno compatibles, exécution à 00:00 et 12:00 UTC.
// Sur Val Town, configurer un val CRON appelant le handler updateModels.ts.
if (typeof Deno !== "undefined" && typeof Deno.cron === "function") {
  Deno.cron(
    "openrouter-models-12h",
    MODEL_SYNC_SCHEDULE,
    {
      backoffSchedule: [10_000, 60_000, 300_000],
    },
    async () => {
      await updateModels(getDb());
    }
  );
}
