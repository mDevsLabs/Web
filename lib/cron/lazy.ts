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
 * Complément de (jamais substitut à) la route quotidienne Vercel et du
 * workflow GitHub `cron-master` : tous passent par le même bail, donc un tick
 * ne tourne jamais deux fois en parallèle. Désactivable avec
 * `CRON_LAZY_TICKS=off`.
 */

const THROTTLE_MS = 60_000;
/** Marge ajoutée au budget du tick pour la durée du bail. */
const LEASE_MARGIN_MS = 15_000;

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
  options: { force?: boolean } = {}
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
  const dueCondition = options.force
    ? sql`TRUE`
    : sql`t."next_run_at" <= now()`;
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
    SET "next_run_at" = now() + (${definition.intervalMs}::int * interval '1 millisecond'),
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
    const claimed = await claimCronTicks(CRON_TICKS);
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
