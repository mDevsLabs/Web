/**
 * Vérification post-réparation : rejoue les requêtes exactes qui échouaient
 * dans dev-server.log. Les écritures sont annulées (ROLLBACK).
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

// 4. recordTokenUsage : échouait en 42804/22P04 (integer vs text) — testé en transaction annulée
await sql.begin(async (tx) => {
  await tx`INSERT INTO weekly_usage (user_id, week_start, tokens_used)
    VALUES (${"1"}::text, ${"2026-09-14"}::date, ${42})
    ON CONFLICT (user_id, week_start)
    DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${42}`;
  await tx`ROLLBACK`;
  throw new Error("__rollback__");
}).catch((e) => {
  if (e.message !== "__rollback__") throw e;
});
console.log("✅ 4. INSERT weekly_usage (user_id texte) — transaction annulée");

await sql.end();
console.log("\n✅ Toutes les requêtes critiques passent.");
