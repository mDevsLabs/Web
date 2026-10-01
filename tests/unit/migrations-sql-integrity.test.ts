import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Garde-fou des migrations SQL : détecte la corruption « i » à la place d'un
 * « m » ou d'un « n ».
 *
 * Régression : deux migrations ont été écrites avec des fautes de frappe dans
 * leur SQL — `ADD COLUiN IF NOT EXISTS` et `ALTER TABLE "Useriemory"` (0031),
 * `FROi` (0032). Le runner Drizzle échoue alors en 42601 « syntax error » et le
 * job de déploiement s'arrête : la faute n'est visible qu'en CI, sur une base
 * réelle, après tout le reste. Ce test la fait échouer en local, en une seconde,
 * sans base de données.
 *
 * Le contrôle est lexical, pas grammatical : on cherche les mots qui se
 * distinguent d'un mot-clé SQL ou d'un identifiant de lib/db/schema.ts par un
 * unique « i » placé là où le mot-clé attend un « m » ou un « n ». Aucun
 * faux positif possible sur du SQL correct, et aucune dépendance à un serveur.
 */

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const MIGRATIONS_DIR = path.join(ROOT, "lib/db/migrations");

// Mots-clés et fonctions réellement employés par les migrations, plus les
// formes voisines à ne pas confondre avec un mot valide.
const SQL_KEYWORDS = [
  "ADD",
  "ALL",
  "ALTER",
  "AND",
  "ANY",
  "ARRAY_AGG",
  "AS",
  "ASC",
  "BEGIN",
  "BETWEEN",
  "BIGINT",
  "BOOLEAN",
  "BTREE",
  "BY",
  "CASE",
  "CAST",
  "CHAR_LENGTH",
  "COALESCE",
  "COLLATE",
  "COLUMN",
  "COMMIT",
  "CONFLICT",
  "CONSTRAINT",
  "CREATE",
  "DECIMAL",
  "DEFAULT",
  "DELETE",
  "DESC",
  "DISTINCT",
  "DO",
  "DOUBLE",
  "DROP",
  "ELSE",
  "END",
  "EXCEPTION",
  "EXISTS",
  "EXTRACT",
  "FALSE",
  "FOREIGN",
  "FROM",
  "GENERATE_SERIES",
  "GREATEST",
  "GROUP",
  "HAVING",
  "IF",
  "ILIKE",
  "IN",
  "INDEX",
  "INNER",
  "INSERT",
  "INTERVAL",
  "INTO",
  "IS",
  "JOIN",
  "JSON",
  "JSONB",
  "KEY",
  "LEAST",
  "LEFT",
  "LIKE",
  "LIMIT",
  "LOOP",
  "LOWER",
  "NULL",
  "NULLIF",
  "NUMERIC",
  "OFFSET",
  "ON",
  "OR",
  "ORDER",
  "OUTER",
  "OVER",
  "PRECISION",
  "PRIMARY",
  "REAL",
  "RECURSIVE",
  "REFERENCES",
  "REGEXP_REPLACE",
  "REGCLASS",
  "RETURNING",
  "RIGHT",
  "ROLLBACK",
  "SELECT",
  "SERIAL",
  "SET",
  "SOME",
  "SUBSTRING",
  "TABLE",
  "TEXT",
  "THEN",
  "TIMESTAMP",
  "TO_CHAR",
  "TO_REGCLASS",
  "TRUE",
  "UNION",
  "UNIQUE",
  "UNNEST",
  "UPDATE",
  "USING",
  "UUID",
  "VALUES",
  "VARCHAR",
  "WHEN",
  "WHERE",
  "WITH",
  "ZONE",
];

// Les migrations ne partagent pas de vocabulaire avec le code applicatif
// (noms d'index snake_case, colonnes de la table historique `users`), on ne
// contrôle donc que les deux surfaces où une faute est mortelle et détectable :
// les mots-clés SQL et les identifiants du schéma.
const schema = readFileSync(path.join(ROOT, "lib/db/schema.ts"), "utf8");
const schemaIdentifiers = new Set<string>();
for (const match of schema.matchAll(/"([A-Za-z_][A-Za-z0-9_]*)"/g)) {
  schemaIdentifiers.add(match[1].toLowerCase());
}
for (const keyword of SQL_KEYWORDS) {
  schemaIdentifiers.add(keyword.toLowerCase());
}

// Un mot est suspect s'il ne diffère d'un mot de référence que par un « i »
// placé là où la référence attend un « m » ou un « n ». `normalize` aligne les
// deux listes : les mots-clés sont stockés en majuscules, le schéma en casse
// d'origine.
function findCorruptions(
  word: string,
  reference: Set<string>,
  normalize: (value: string) => string
): string[] {
  if (!word.includes("i") && !word.includes("I")) return [];
  const found: string[] = [];
  for (let index = 0; index < word.length; index++) {
    const char = word[index];
    if (char !== "i" && char !== "I") continue;
    for (const replacement of ["m", "n"]) {
      const candidate = word.slice(0, index) + replacement + word.slice(index + 1);
      if (reference.has(normalize(candidate))) found.push(candidate);
    }
  }
  return found;
}

const keywords = new Set(SQL_KEYWORDS);
const migrationFiles = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort();

describe("Intégrité syntaxique des migrations", () => {
  it("a au moins une migration à contrôler", () => {
    expect(migrationFiles.length).toBeGreaterThan(0);
  });

  it.each(migrationFiles)(
    "%s n'a aucun mot-clé SQL corrompu",
    (name) => {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
      const offenses = new Set<string>();
      for (const match of sql.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) {
        const word = match[0];
        // On cible les mots qui se détachent du SQL en majuscules : « COLUiN »
        // se remarque, « customInstructions » non.
        if (!/[a-z]i|[iA-Z]/.test(word)) continue;
        for (const candidate of findCorruptions(word, keywords, (value) =>
          value.toUpperCase()
        )) {
          if (candidate.length === word.length) {
            offenses.add(`« ${word} » -> « ${candidate.toUpperCase()} »`);
          }
        }
      }
      expect([...offenses]).toEqual([]);
    }
  );

  it.each(migrationFiles)(
    "%s ne cite que des identifiants connus du schéma",
    (name) => {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
      // Commentaires et littéraux retirés : on ne contrôle que le SQL exécuté.
      const code = sql
        .replace(/--[^\n]*/g, "")
        .replace(/'([^']|'')*'/g, "''");
      const offenses = new Set<string>();
      for (const match of code.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) {
        const word = match[0];
        // Les identifiants techniques sont camelCase ou snake_case ; on ignore
        // le vocabulaire SQL en minuscules, trop proche des mots français.
        if (!/[A-Z]/.test(word) && !word.includes("_")) continue;
        if (
          findCorruptions(word, schemaIdentifiers, (value) =>
            value.toLowerCase()
          ).length > 0
        ) {
          offenses.add(word);
        }
      }
      expect([...offenses]).toEqual([]);
    }
  );
});
