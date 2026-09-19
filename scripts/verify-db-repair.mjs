/**
 * Vérification post-réparation : rejoue les requêtes exactes qui échouaient
 * dans dev-server.log, plus le contrat plateforme weekly_usage (integer).
 * Les écritures sont annulées (ROLLBACK).
 *   node scripts/verify-db-repair.mjs
 */
import postgres from "postgres";
import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const urlMatch = env.match(/(?:DATABASE_URL|POSTGRES_URL)\s*=\s*"?([^"\n]+)"?/);
const sql = postgres(urlMatch[1].trim(), { prepare: false });

// 1. getSkillsByUserId : échouait en 22P02 (invalid input syntax for uuid)
await sql`SELECT "id" FROM "Skill" WHERE "Skill"."userId" = ${"1"} ORDER BY "Skill"."pinned" DESC LIMIT 5`;
console.log("✅ 1. SELECT Skill WHERE userId='1' (getSkillsByUserId)");

// 2. getUserScopeMemoriesForChat : échouait en 42703 (column "category"/"isEnabled"/"isImportant" does not exist)
await sql`SELECT "agentId", "category", "content", "createdAt", "id", "isEnabled", "isImportant", "projectId", "tags", "updatedAt", "userId"
  FROM "UserMemory"
  WHERE ("UserMemory"."userId" = ${"1"} AND "UserMemory"."agentId" IS NULL AND "UserMemory"."projectId" IS NULL AND "UserMemory"."isEnabled" = ${true})
  ORDER BY "UserMemory"."isImportant" DESC, "UserMemory"."createdAt" DESC LIMIT ${200}`;
console.log("✅ 2. SELECT UserMemory avec filtres de portée (getGlobalMemories)");

// 3. countMemories : sélection des colonnes nouvellement ajoutées
await sql`SELECT count(*)::int AS n FROM "UserMemory" WHERE "userId" = ${"1"} AND "agentId" IS NULL AND "isEnabled" = ${true}`;
console.log("✅ 3. countMemories sur UserMemory");

// 4. recordTokenUsage : weekly_usage.user_id est INTEGER (contrat plateforme).
//    Écriture d'un id numérique en transaction annulée.
await sql.begin(async (tx) => {
  await tx`INSERT INTO weekly_usage (user_id, week_start, tokens_used)
    VALUES (${1}, ${"2026-09-14"}::date, ${42})
    ON CONFLICT (user_id, week_start)
    DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${42}`;
  throw new Error("__rollback__");
}).catch((e) => {
  if (e.message !== "__rollback__") throw e;
});
console.log("✅ 4. INSERT weekly_usage (user_id integer) — transaction annulée");

// 5. Contrat backend mAI déployé (handleGetUsage) : filtre text = integer —
//    échouait en 42883 tant que la colonne était restée en text.
const usage = await sql`
  SELECT COALESCE(SUM(tokens_used), 0)::bigint AS used
  FROM weekly_usage WHERE user_id = ${1}
`;
console.log(`✅ 5. SELECT weekly_usage WHERE user_id = integer (handleGetUsage) : ${usage[0].used} tokens`);

// 6. getPersistedTier : lecture users par id::text (users.id est integer)
const tier = await sql`SELECT id::text AS id, tier FROM users WHERE id::text = ${"1"}::text LIMIT 1`;
console.log(`✅ 6. getPersistedTier (users.id integer, lookup texte) : ${tier.length} ligne(s)`);

await sql.end();
console.log("\n✅ Toutes les requêtes critiques passent.");
