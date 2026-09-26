/**
 * Réparation du drift de schéma (à exécuter une fois, idempotent) :
 *   node scripts/repair-db-drift.mjs
 *
 * Réapplique exactement les réparations embarquées dans
 * lib/db/queries.ts (ensureTableTypes) :
 *   - Skill.userId -> text (le code écrit l'identifiant mAI texte)
 *   - weekly_usage.user_id -> integer (contrat PLATEFORME : le backend mAI
 *     déployé, handleGetUsage, passe un integer) + FK vers users(id)
 *   - colonnes UserMemory manquantes
 * Aucune perte de données : conversions de type, ADD COLUMN IF NOT EXISTS,
 * lignes non convertibles mises de côté dans weekly_usage_drift_backup.
 */

import { readFileSync } from "node:fs";
import postgres from "postgres";

const env = readFileSync(".env", "utf8");
const urlMatch = env.match(/(?:DATABASE_URL|POSTGRES_URL)\s*=\s*"?([^"\n]+)"?/);
if (!urlMatch) {
  console.error("DATABASE_URL/POSTGRES_URL introuvable dans .env");
  process.exit(1);
}
const sql = postgres(urlMatch[1].trim(), { prepare: false });

console.log("1/5 Skill.userId -> text…");
// FK cachée Skill_userId_fkey (Skill.userId -> "User"(id) uuid) : le code
// n'y référence jamais (userId stocke l'identifiant mAI texte), et une FK
// text -> uuid est implémentable. On la retire avant la conversion.
await sql`ALTER TABLE "Skill" DROP CONSTRAINT IF EXISTS "Skill_userId_fkey"`;
await sql`DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Skill' AND column_name = 'userId' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE "Skill" ALTER COLUMN "userId" TYPE text USING "userId"::text;
  END IF;
END $$;`;

console.log("2/5 weekly_usage.user_id -> integer (contrat plateforme)…");
// Si une conversion inverse (text) a été appliquée par erreur, on la
// restaure : les lignes non numériques sont mises de côté, pas perdues.
//
// PERTE DE DONNÉES corrigée : `CREATE TABLE IF NOT EXISTS ... AS SELECT` est un
// NO-OP quand `weekly_usage_drift_backup` existe déjà (deuxième exécution),
// mais le `DELETE` s'exécutait quand même — les lignes non numériques ajoutées
// depuis étaient donc supprimées sans sauvegarde. On sauvegarde désormais ligne
// par ligne, on VÉRIFIE la complétude, et on lève une exception avant tout
// DELETE si la moindre ligne manque dans la sauvegarde.
await sql`ALTER TABLE "weekly_usage" DROP CONSTRAINT IF EXISTS "weekly_usage_user_id_fkey"`;
await sql`DO $$
DECLARE
  a_deplacer integer;
  sauvegardees integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_usage' AND column_name = 'user_id' AND data_type = 'text'
  ) THEN
    CREATE TABLE IF NOT EXISTS weekly_usage_drift_backup (
      LIKE weekly_usage INCLUDING DEFAULTS
    );

    SELECT count(*) INTO a_deplacer
      FROM weekly_usage WHERE user_id !~ '^[0-9]+$';

    INSERT INTO weekly_usage_drift_backup
      SELECT w.* FROM weekly_usage w
      WHERE w.user_id !~ '^[0-9]+$'
        AND NOT EXISTS (
          SELECT 1 FROM weekly_usage_drift_backup b
          WHERE b.user_id = w.user_id AND b.week_start = w.week_start
        );

    SELECT count(*) INTO sauvegardees
      FROM weekly_usage w
      WHERE w.user_id !~ '^[0-9]+$'
        AND EXISTS (
          SELECT 1 FROM weekly_usage_drift_backup b
          WHERE b.user_id = w.user_id AND b.week_start = w.week_start
        );

    IF sauvegardees < a_deplacer THEN
      RAISE EXCEPTION
        'Sauvegarde weekly_usage incomplète (% à déplacer, % sauvegardées) : aucune suppression effectuée.',
        a_deplacer, sauvegardees;
    END IF;

    DELETE FROM weekly_usage WHERE user_id !~ '^[0-9]+$';
    ALTER TABLE "weekly_usage" ALTER COLUMN "user_id" TYPE integer USING "user_id"::integer;
  END IF;
END $$;`;
await sql`DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'weekly_usage'::regclass AND conname = 'weekly_usage_user_id_fkey'
  ) THEN
    ALTER TABLE "weekly_usage" ADD CONSTRAINT "weekly_usage_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE NOT VALID;
  END IF;
END $$;`;

console.log("3/5 Colonnes UserMemory manquantes…");
// La colonne "category" a été supprimée (migration 0030) : elle n'était
// utilisée que par un filtre d'interface, jamais par un modèle ni un prompt.
await sql`ALTER TABLE "UserMemory" ADD COLUMN IF NOT EXISTS "isEnabled" boolean DEFAULT true NOT NULL`;
await sql`ALTER TABLE "UserMemory" ADD COLUMN IF NOT EXISTS "isImportant" boolean DEFAULT false NOT NULL`;
await sql`ALTER TABLE "UserMemory" ADD COLUMN IF NOT EXISTS "tags" json DEFAULT '[]'::json NOT NULL`;

console.log("4/5 Vérification…");
const check = await sql`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE (table_name, column_name) IN (
    ('Skill', 'userId'),
    ('weekly_usage', 'user_id'),
    ('UserMemory', 'isEnabled'),
    ('UserMemory', 'isImportant'),
    ('UserMemory', 'tags')
  )
  ORDER BY table_name, column_name
`;
console.log(
  check
    .map((c) => `${c.table_name}.${c.column_name} = ${c.data_type}`)
    .join("\n")
);

console.log("5/5 Requêtes de contrôle…");
const skillQuery = await sql`
  SELECT count(*)::int AS n FROM "Skill" WHERE "userId" = ${"1"}::text
`;
console.log(
  `✓ Skill filtrable par userId texte : ${skillQuery[0].n} ligne(s).`
);

const usageQuery = await sql`
  SELECT count(*)::int AS n FROM weekly_usage WHERE user_id = ${1} AND week_start >= '2026-01-01'
`;
console.log(
  `✓ weekly_usage filtrable par user_id integer : ${usageQuery[0].n} ligne(s).`
);

await sql.end();
console.log("\n✅ Réparation terminée.");
