import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function source(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

function codeOnly(file: string): string {
  return source(file)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, " ");
}

describe("DDL hors du chemin de requête", () => {
  it("le runtime n'exécute plus de DDL sans opt-in explicite", () => {
    const queries = codeOnly("lib/db/queries.ts");
    expect(queries).toContain('process.env.DB_RUNTIME_DDL_REPAIR !== "true"');

    // Le garde doit être DANS ensureTableTypes, et la sortie anticipée doit
    // précéder tout appel réellement exécuté (réparation de colonnes ou DDL).
    const start = queries.indexOf("async function ensureTableTypes");
    // Fin de la fonction : première accolade fermante en début de ligne
    // (indépendant du style de fin de ligne CRLF/LF).
    const closeIndex = queries.indexOf("\n}", start);
    const end = queries.indexOf("\n", closeIndex + 1);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const body = queries.slice(start, end);

    const gate = body.indexOf("DB_RUNTIME_DDL_REPAIR");
    const firstExecution = body.search(/await ensureColumnDefaults\(|await run\(/);
    expect(gate).toBeGreaterThan(-1);
    expect(firstExecution).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(firstExecution);
  });
});

describe("Repair weekly_usage — aucune suppression sans sauvegarde vérifiée", () => {
  for (const file of [
    "lib/db/queries.ts",
    "scripts/repair-db-drift.mjs",
  ]) {
    it(`${file} vérifie la sauvegarde AVANT le DELETE`, () => {
      const code = codeOnly(file);
      const insertIndex = code.indexOf("INSERT INTO weekly_usage_drift_backup");
      const checkIndex = code.indexOf("sauvegardees < a_deplacer");
      const deleteIndex = code.indexOf("DELETE FROM weekly_usage WHERE user_id !~");
      const alterIndex = code.indexOf(
        'ALTER TABLE "weekly_usage" ALTER COLUMN "user_id" TYPE integer'
      );

      expect(deleteIndex, "DELETE introuvable").toBeGreaterThan(-1);
      expect(checkIndex, "vérification de complétude absente").toBeGreaterThan(-1);
      // Ordre imposé : sauvegarde → vérification → DELETE → ALTER TYPE.
      expect(insertIndex).toBeLessThan(checkIndex);
      expect(checkIndex).toBeLessThan(deleteIndex);
      expect(deleteIndex).toBeLessThan(alterIndex);

      // La sauvegarde ne doit plus dépendre d'un CREATE TABLE AS SELECT
      // (no-op si la table existe déjà, donc silencieusement non peuplée).
      expect(code).not.toContain(
        "CREATE TABLE IF NOT EXISTS weekly_usage_drift_backup AS"
      );
      expect(code).toContain(
        "CREATE TABLE IF NOT EXISTS weekly_usage_drift_backup ("
      );
    });
  }

  it("le job de migration ne masque plus les échecs inattendus", () => {
    const migrate = codeOnly("lib/db/migrate.ts");
    // Plus aucun `catch {}` silencieux dans le fichier de migration.
    expect(migrate).not.toMatch(/\} catch \{\}/);
    expect(migrate).toContain("noteIgnoredStep(error)");
    expect(migrate).toContain("unexpectedStepErrors");
    expect(migrate).toContain("Migration incomplète");
    // Un échec inattendu fait échouer la migration par défaut.
    expect(migrate).toMatch(/MIGRATIONS_STRICT === "false"/);
  });
});
