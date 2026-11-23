/**
 * Exécution DIRECTE des ticks CRON, hors Vercel (GitHub Actions).
 *
 * Pourquoi : appeler `/api/cron/*` en HTTP fait payer chaque tick au quota
 * Fluid Active CPU du plan Hobby (cold start + exécution), même quand il n'y a
 * rien à faire. Ici, le runner GitHub charge les handlers des routes et les
 * exécute lui-même, contre Neon et les fournisseurs IA : Vercel n'est plus
 * sollicité.
 *
 * Contrat inchangé : même registre (`lib/cron/ticks.ts`), même bail atomique
 * (`cron_ticks`) que la route quotidienne Vercel et les ticks paresseux. Un
 * tick n'est donc jamais exécuté deux fois en parallèle.
 *
 * Journaux PUBLICS (dépôt public) : toute sortie console est filtrée (e-mails,
 * UUID, JWT, URL de base, clés) avant d'atteindre le journal du workflow.
 *
 * Lancement (la condition `react-server` neutralise `import "server-only"`) :
 *   node --conditions=react-server --import tsx scripts/cron/run-direct.ts [--dry-run] [--tick=agent]
 *
 *   --dry-run  charge les six handlers sans les exécuter, sans base ni réseau ;
 *   --tick=X   limite l'exécution à un tick (sinon : tous les ticks dus).
 */
import process from "node:process";
import { format } from "node:util";
import { masquer } from "../../lib/cron/log-mask";

function filtrerConsole(): void {
  for (const niveau of ["debug", "error", "info", "log", "warn"] as const) {
    const original = console[niveau].bind(console);
    console[niveau] = (...args: unknown[]) => {
      original(masquer(format(...args)));
    };
  }
}

/** Filet ultime : le workflow coupe à 6 min, on conclut avant. */
const BUDGET_GLOBAL_MS = 330_000;

async function main(): Promise<number> {
  const dryRun = process.argv.includes("--dry-run");
  const tickDemande = process.argv
    .find((arg) => arg.startsWith("--tick="))
    ?.slice("--tick=".length);

  // Imports APRÈS le filtre : les modules peuvent journaliser au chargement.
  const { CRON_TICKS } = await import("../../lib/cron/ticks");
  const selection = tickDemande
    ? CRON_TICKS.filter((tick) => tick.name === tickDemande)
    : [...CRON_TICKS];
  if (selection.length === 0) {
    console.error(`::error::Tick inconnu : ${tickDemande}`);
    return 1;
  }

  if (dryRun) {
    let echecs = 0;
    for (const tick of selection) {
      try {
        const handler = await tick.load();
        if (typeof handler !== "function") {
          throw new TypeError("handler absent");
        }
        console.log(`[cron-direct] ✓ ${tick.name} chargé (${tick.method})`);
      } catch (error) {
        echecs += 1;
        console.error(
          `::error::[cron-direct] ${tick.name} non chargeable : ${
            error instanceof Error ? error.message : "inconnu"
          }`
        );
      }
    }
    return echecs > 0 ? 1 : 0;
  }

  const manquants = [
    ...(process.env.DATABASE_URL || process.env.POSTGRES_URL
      ? []
      : ["DATABASE_URL"]),
    ...(process.env.CRON_SECRET ? [] : ["CRON_SECRET"]),
  ];
  if (manquants.length > 0) {
    console.error(`::error::Variables manquantes : ${manquants.join(", ")}`);
    return 1;
  }

  const { claimCronTicks, runClaimedCronTicks } = await import(
    "../../lib/cron/lazy"
  );
  const reserves = await claimCronTicks(selection);
  if (reserves.length === 0) {
    console.log("[cron-direct] aucun tick dû");
    return 0;
  }

  const resultats = await runClaimedCronTicks(reserves);
  for (const r of resultats) {
    console.log(
      `[cron-direct] ${r.ok ? "✓" : "✗"} ${r.name} -> ${r.status} (${r.durationMs} ms)${
        r.error ? ` ${r.error}` : ""
      }`
    );
  }
  return resultats.some((r) => !r.ok) ? 1 : 0;
}

filtrerConsole();
setTimeout(() => {
  console.error("::error::[cron-direct] budget global dépassé");
  process.exit(1);
}, BUDGET_GLOBAL_MS).unref();

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(
      `::error::[cron-direct] échec : ${error instanceof Error ? error.message : "inconnu"}`
    );
    process.exit(1);
  });
