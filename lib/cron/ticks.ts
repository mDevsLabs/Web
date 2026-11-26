import "server-only";

/**
 * Registre des ticks CRON de l'hôte, partagé par :
 *   - le runner « paresseux » (lib/cron/lazy.ts, bail atomique dans Neon) ;
 *   - la route quotidienne Vercel (app/api/cron/daily).
 *
 * Les ticks sont exécutés EN INTERNE en appelant le handler de la route
 * correspondante : la logique reste dans `app/api/cron/<tick>/route.ts`
 * (un seul endroit, contrat HTTP inchangé pour GitHub Actions / Val Town).
 * L'import est dynamique pour ne charger un tick (AI SDK, Vibe…) que s'il
 * est réellement dû.
 */

export type CronTickName =
  | "agent"
  | "notifications"
  | "planning"
  | "quizzly"
  | "vibe"
  | "wakies";

type CronHandler = (request: Request) => Promise<Response>;

export interface CronTickDefinition {
  /** Durée max d'un tick ; le bail dure `budgetMs` + marge. */
  budgetMs: number;
  /** Intervalle visé entre deux exécutions réussies. */
  intervalMs: number;
  load: () => Promise<CronHandler>;
  method: "GET" | "POST";
  name: CronTickName;
}

const MINUTE = 60_000;

export const CRON_TICKS: readonly CronTickDefinition[] = [
  {
    budgetMs: 285_000,
    intervalMs: 5 * MINUTE,
    load: async () => (await import("@/app/api/cron/agent/route")).POST,
    method: "POST",
    name: "agent",
  },
  {
    budgetMs: 290_000,
    intervalMs: 5 * MINUTE,
    load: async () => (await import("@/app/api/cron/planning/route")).POST,
    method: "POST",
    name: "planning",
  },
  {
    budgetMs: 290_000,
    intervalMs: 5 * MINUTE,
    load: async () => (await import("@/app/api/cron/wakies/route")).POST,
    method: "POST",
    name: "wakies",
  },
  {
    budgetMs: 60_000,
    intervalMs: 10 * MINUTE,
    load: async () => (await import("@/app/api/cron/vibe/route")).GET,
    method: "GET",
    name: "vibe",
  },
  {
    budgetMs: 120_000,
    intervalMs: 10 * MINUTE,
    load: async () => (await import("@/app/api/cron/notifications/route")).POST,
    method: "POST",
    name: "notifications",
  },
  {
    budgetMs: 60_000,
    intervalMs: 10 * MINUTE,
    load: async () => (await import("@/app/api/cron/quizzly/route")).POST,
    method: "POST",
    name: "quizzly",
  },
];

export interface CronTickOutcome {
  durationMs: number;
  error?: string;
  name: CronTickName;
  ok: boolean;
  status: number;
}

/**
 * Exécute un tick en interne. Le secret n'est lu que dans l'environnement et
 * n'est jamais journalisé ni renvoyé ; en l'absence de `CRON_SECRET`, la route
 * applique sa propre politique (refus en production, tolérance en dev).
 */
export async function runCronTick(
  definition: CronTickDefinition
): Promise<CronTickOutcome> {
  const startedAt = Date.now();
  try {
    const handler = await definition.load();
    const secret = process.env.CRON_SECRET;
    const headers = new Headers();
    if (secret) {
      headers.set("authorization", `Bearer ${secret}`);
    }
    const response = await handler(
      new Request(`http://internal.invalid/api/cron/${definition.name}`, {
        headers,
        method: definition.method,
      })
    );
    // Corps consommé : on ne garde que le statut (le détail est dans les logs
    // de la route elle-même).
    await response.text().catch(() => "");
    return {
      durationMs: Date.now() - startedAt,
      error: response.ok ? undefined : `HTTP ${response.status}`,
      name: definition.name,
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message.slice(0, 300) : "inconnu",
      name: definition.name,
      ok: false,
      status: 500,
    };
  }
}
