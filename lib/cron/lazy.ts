import "server-only";
import { sql } from "drizzle-orm";
import { dbReady } from "@/lib/db/queries";
import {
  CRON_TICKS,
  type CronTickDefinition,
  type CronTickOutcome,
  runCronTick,
} from "./ticks";

/**
 * Ticks CRON « paresseux » : l'application planifie elle-même ses tâches,
 * sans ordonnanceur externe, avec un bail atomique dans Neon (`cron_ticks`).
 *
 * Fonctionnement
 *   1. `maybeRunLazyCronTicks()` est appelée via `after()` depuis une route
 *      déjà sollicitée (cloche de notifications, ≈ toutes les 3 min par onglet).
 *   2. Un throttle en mémoire (1 min/instance) évite de toucher la base à
 *      chaque requête : coût CPU négligeable quand rien n'est dû.
 *   3. Une seule requête `UPDATE … RETURNING` pose le bail des ticks échus ET
 *      libres : deux instances ne peuvent pas porter le même tick.
 *   4. Le tick est exécuté en interne (lib/cron/ticks.ts), puis `next_run_at`
 *      est repoussé d'un intervalle et le bail libéré. Si l'instance meurt, le
 *      bail expire et le tick est repris.
 *
 * Filet de secours seulement : l'ordonnanceur principal est le workflow
 * GitHub `cron-master` (toutes les 5 min, exécution directe hors Vercel, via
 * `scripts/cron/run-direct.ts`). Ici, un tick n'est réclamé qu'avec
 * `LAZY_GRACE_MS` de retard, pour ne pas brûler l'Active CPU Vercel quand
 * GitHub tient la cadence. Même bail pour tous : un tick ne tourne jamais
 * deux fois en parallèle. Désactivable avec `CRON_LAZY_TICKS=off`.
 */

const THROTTLE_MS = 60_000;
/** Marge ajoutée au budget du tick pour la durée du bail. */
const LEASE_MARGIN_MS = 15_000;
/**
 * Tolérance d'échéance. L'échéance suivante part du DÉBUT du tick (et non de
 * sa fin) moins cette marge : sinon un tick de 60 s lancé à 12:00 n'est plus
 * dû au passage de 12:05, et la cadence réelle double. Les ticks sont
 * idempotents, donc une avance de 90 s ne coûte rien.
 */
const SCHEDULE_SLACK_MS = 90_000;
/**
 * Filet paresseux : l'ordonnanceur principal est GitHub Actions (exécution
 * directe, hors Vercel). Les ticks paresseux, qui consomment le CPU Vercel,
 * ne prennent le relais que si un tick est en retard de plus de 15 minutes.
 */
const LAZY_GRACE_MS = 15 * 60_000;

let lastAttemptAt = 0;
let running = false;
let seeded = false;

type Rows = Array<{ name: string }>;

async function seedTicks(): Promise<void> {
  if (seeded) {
    return;
  }
  const db = await dbReady();
  const values = sql.join(
    CRON_TICKS.map((tick) => sql`(${tick.name}::text)`),
    sql`, `
  );
  await db.execute(
    sql`INSERT INTO "cron_ticks" ("name") VALUES ${values} ON CONFLICT ("name") DO NOTHING`
  );
  seeded = true;
}

/**
 * Pose le bail des ticks demandés. `force` ignore l'échéance (route
 * quotidienne) mais JAMAIS un bail encore valide.
 */
export async function claimCronTicks(
  definitions: readonly CronTickDefinition[],
  options: { force?: boolean; graceMs?: number } = {}
): Promise<CronTickDefinition[]> {
  if (definitions.length === 0) {
    return [];
  }
  await seedTicks();
  const db = await dbReady();
  const wanted = sql.join(
    definitions.map(
      (tick) =>
        sql`(${tick.name}::text, ${tick.budgetMs + LEASE_MARGIN_MS}::int)`
    ),
    sql`, `
  );
  const graceMs = Math.max(0, Math.trunc(options.graceMs ?? 0));
  const dueCondition = options.force
    ? sql`TRUE`
    : sql`t."next_run_at" + (${graceMs}::int * interval '1 millisecond') <= now()`;
  const rows = (await db.execute(sql`
    UPDATE "cron_ticks" AS t
    SET "lease_until" = now() + (v.lease_ms * interval '1 millisecond'),
 "last_started_at" = now()
    FROM (VALUES ${wanted}) AS v(name, lease_ms)
    WHERE t."name" = v.name
      AND ${dueCondition}
      AND (t."lease_until" IS NULL OR t."lease_until" < now())
    RETURNING t."name" AS name
  `)) as unknown as Rows;
  const claimed = new Set(Array.from(rows, (row) => row.name));
  return definitions.filter((tick) => claimed.has(tick.name));
}

async function releaseCronTick(
  definition: CronTickDefinition,
  outcome: CronTickOutcome
): Promise<void> {
  const db = await dbReady();
  // En cas d'échec, nouvel essai à l'intervalle normal : le tick est
  // idempotent, et on ne martèle pas une route cassée.
  await db.execute(sql`
    UPDATE "cron_ticks"
    SET "next_run_at" = COALESCE("last_started_at", now())
          + (${definition.intervalMs - SCHEDULE_SLACK_MS}::int * interval '1 millisecond'),
        "lease_until" = NULL,
        "last_finished_at" = now(),
        "last_error" = ${outcome.ok ? null : (outcome.error ?? "échec")}
    WHERE "name" = ${definition.name}
  `);
}

/** Exécute des ticks dont le bail est posé, puis libère chaque bail. */
export async function runClaimedCronTicks(
  claimed: readonly CronTickDefinition[]
): Promise<CronTickOutcome[]> {
  return Promise.all(
    claimed.map(async (definition) => {
      const outcome = await runCronTick(definition);
      await releaseCronTick(definition, outcome).catch((error) => {
        console.error(
          `[cron/lazy] libération du bail impossible (${definition.name}) :`,
          error instanceof Error ? error.message : error
        );
      });
      if (!outcome.ok) {
        console.error(
          `[cron/lazy] tick ${definition.name} en échec : ${outcome.error ?? "inconnu"}`
        );
      }
      return outcome;
    })
  );
}

/** Ticks exécutables ici : jamais en test, ni si l'exploitant l'a coupé. */
function lazyTicksEnabled(): boolean {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return false;
  }
  if (process.env.CRON_LAZY_TICKS === "off") {
    return false;
  }
  // Sans secret, les routes refusent en production : inutile de poser des
  // baux pour des ticks qui échoueraient tous.
  return (
    Boolean(process.env.CRON_SECRET) || process.env.NODE_ENV !== "production"
  );
}

/**
 * Point d'entrée à appeler dans `after()`. Ne rejette jamais : un échec
 * d'ordonnancement ne doit pas dégrader la route hôte.
 */
export async function maybeRunLazyCronTicks(): Promise<void> {
  if (!lazyTicksEnabled()) {
    return;
  }
  const now = Date.now();
  if (running || now - lastAttemptAt < THROTTLE_MS) {
    return;
  }
  lastAttemptAt = now;
  running = true;
  try {
    const claimed = await claimCronTicks(CRON_TICKS, {
      graceMs: LAZY_GRACE_MS,
    });
    if (claimed.length > 0) {
      await runClaimedCronTicks(claimed);
    }
  } catch (error) {
    console.error(
      "[cron/lazy] ordonnancement impossible :",
      error instanceof Error ? error.message : error
    );
  } finally {
    running = false;
  }
}
