import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le runner de migrations ne doit pas hériter du `search_path` de la session.
 *
 * RÉGRESSION
 *
 * Un job CI a échoué en 3F000 (« no schema has been selected to create in »)
 * puis en 42P01 (« relation "user_preferences" does not exist ») — sur une base
 * où la table EXISTAIT et où l'application la lisait sans difficulté. La
 * session avait un `search_path` vide : le paramètre de connexion
 * `options=-c search_path=` (ou un rôle configuré ainsi) vide la session de
 * son schéma, et plus aucun objet non qualifié n'était adressable.
 *
 * Le runner épingle donc son propre schéma — celui qui porte les tables de
 * l'application — avant toute écriture, et le vérifie.
 */

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function source(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

function codeOnly(file: string): string {
  return source(file)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, " ");
}

describe("Le runner de migrations épingle son schéma de travail", () => {
  it("lit le search_path reçu et le consigne", () => {
    const code = codeOnly("lib/db/working-schema.ts");
    expect(code).toContain("SHOW search_path");
    expect(code).toContain("search_path reçu");
  });

  it("fixe le schéma de la session plutôt que de l'hériter", () => {
    const code = codeOnly("lib/db/working-schema.ts");
    expect(code).toContain("set_config('search_path'");
    // Le schéma visé est celui qui porte les tables de l'application, pas
    // celui du premier schéma listé par la session.
    expect(code).toContain("TABLES_REPERES");
  });

  it("vérifie que le schéma épinglé est bien le schéma courant", () => {
    const code = codeOnly("lib/db/working-schema.ts");
    expect(code).toContain("current_schema()");
    expect(code).toContain("Schéma de travail inutilisable");
  });

  it("épingle avant les réparations ET avant les migrations Drizzle", () => {
    const code = codeOnly("lib/db/migrate.ts");
    const appels = code.match(/pinWorkingSchema\(connection/g) ?? [];
    expect(appels.length).toBeGreaterThanOrEqual(2);
    // Les deux épinglages précèdent la phase Drizzle.
    const premiere = code.indexOf("pinWorkingSchema(connection");
    const drizzle = code.indexOf("migrate(db,");
    expect(premiere).toBeGreaterThan(-1);
    expect(drizzle).toBeGreaterThan(premiere);
  });
});

describe("La table des préférences ne peut plus manquer", () => {
  it("la phase de réparation la crée si elle est absente", () => {
    const code = codeOnly("lib/db/migrate.ts");
    // Sans elle, la migration 0062 (non qualifiée) échoue en 42P01 et
    // arrête le job sur une base dont le journal est incomplet.
    expect(code).toContain('CREATE TABLE IF NOT EXISTS "user_preferences"');
  });
});

describe("Le bilan des réparations n'est plus avalé par l'échec des migrations", () => {
  it("affiche le bilan des étapes de réparation avant de relancer l'erreur", () => {
    const code = codeOnly("lib/db/migrate.ts");
    expect(code).toContain("echecMigrations");
    const bilan = code.indexOf("unexpectedStepErrors.length > 0");
    const relance = code.indexOf("if (echecMigrations)");
    expect(bilan).toBeGreaterThan(-1);
    expect(relance).toBeGreaterThan(bilan);
  });
});

describe("Aucune migration n'interroge `pg_constraint` avec `table_name`", () => {
  it("le catalogue `pg_constraint` n'a pas de colonne `table_name`", () => {
    // La requête échoue alors en 42703 et fait échouer TOUTE la transaction
    // de migration : les migrations qui suivent ne sont pas appliquées, et
    // le journal n'avance pas. Le nom de la table vient de `pg_class`.
    //
    // On inspecte la SEULE clause qui suit `FROM pg_constraint` : une
    // instruction peut mentionner `table_name` pour une AUTRE table
    // (information_schema) sans être fautive.
    const dossier = path.join(ROOT, "lib", "db", "migrations");
    const fautifs: string[] = [];
    for (const fichier of readdirSync(dossier)) {
      if (!fichier.endsWith(".sql")) {
        continue;
      }
      const contenu = source(path.join("lib", "db", "migrations", fichier));
      let index = contenu.indexOf("FROM pg_constraint");
      while (index !== -1) {
        const fin = contenu.indexOf(")", index);
        const clause = contenu.slice(index, fin === -1 ? undefined : fin);
        if (clause.includes("table_name")) {
          fautifs.push(fichier);
          break;
        }
        index = contenu.indexOf("FROM pg_constraint", index + 1);
      }
    }
    expect(fautifs).toEqual([]);
  });
});
