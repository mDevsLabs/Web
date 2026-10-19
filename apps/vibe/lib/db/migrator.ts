/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — MIGRATOR SCRIPT (lib/db/migrator.ts)
 * Applique les migrations SQL numérotées dans un ordre déterministe.
 * ============================================================================
 */

import { getDb } from "../../config.ts";

const MIGRATIONS_DIRECTORY = new URL("./migrations/", import.meta.url);
const NUMBERED_MIGRATION = /^(\d+)_.*\.sql$/;
const PUBLIC_BOT_SEED_FILE = "005_verified_and_bot_account.sql";
const PUBLIC_BOT_SEED_MARKER =
  "-- Ensure Bot account exists with password_hash";

type MigrationFile = {
  name: string;
  order: number;
};

type TrackedMigration = {
  checksum: string | null;
};

async function listMigrationFiles(): Promise<MigrationFile[]> {
  const migrations: MigrationFile[] = [];
  const prefixes = new Set<number>();

  for await (const entry of Deno.readDir(MIGRATIONS_DIRECTORY)) {
    if (!entry.isFile) continue;

    const match = NUMBERED_MIGRATION.exec(entry.name);
    if (!match) continue;

    const order = Number(match[1]);
    if (!Number.isSafeInteger(order)) {
      throw new Error(`Numéro de migration invalide : ${entry.name}`);
    }
    if (prefixes.has(order)) {
      throw new Error(`Numéro de migration dupliqué : ${match[1]}`);
    }

    prefixes.add(order);
    migrations.push({ name: entry.name, order });
  }

  migrations.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  if (migrations.length === 0) {
    throw new Error(
      `Aucune migration numérotée trouvée dans ${MIGRATIONS_DIRECTORY.pathname}`,
    );
  }

  return migrations;
}

async function sha256(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

function prepareMigrationSource(name: string, source: string): string {
  let executableSource = source;

  // La migration historique 005 contient un hash bcrypt public. Le runner
  // conserve ses DDL, neutralise les anciens mots de passe @bot et n'exécute
  // jamais ce seed de données.
  if (name === PUBLIC_BOT_SEED_FILE) {
    const markerIndex = source.indexOf(PUBLIC_BOT_SEED_MARKER);
    if (markerIndex < 0) {
      throw new Error(
        `${name} ne contient plus le marqueur attendu du seed @bot`,
      );
    }

    executableSource = `${source.slice(0, markerIndex)}
-- Security hardening: no public @bot password seed is executed.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE users
SET password_hash = crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf', 12))
WHERE username = 'bot';
`;
  }

  // Défense supplémentaire : aucun hash bcrypt littéral ne doit être envoyé.
  if (/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/.test(executableSource)) {
    throw new Error(
      `Migration refusée : hash bcrypt littéral détecté dans ${name}`,
    );
  }

  return executableSource;
}

function dollarQuoteAt(source: string, index: number): string | null {
  const match = source.slice(index).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/);
  return match?.[0] ?? null;
}

/**
 * Découpe un fichier SQL en statements sans couper les littéraux, les commentaires
 * imbriqués ni les blocs dollar-quotés utilisés par les blocs DO de PostgreSQL.
 */
function splitSqlStatements(source: string): string[] {
  const statements: string[] = [];
  let statementStart = 0;
  let hasExecutableCode = false;
  let state:
    | "normal"
    | "single"
    | "double"
    | "lineComment"
    | "blockComment"
    | "dollar" = "normal";
  let dollarDelimiter = "";
  let blockCommentDepth = 0;
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];

    if (state === "lineComment") {
      if (character === "\n") state = "normal";
      index += 1;
      continue;
    }

    if (state === "blockComment") {
      if (character === "/" && next === "*") {
        blockCommentDepth += 1;
        index += 2;
      } else if (character === "*" && next === "/") {
        blockCommentDepth -= 1;
        index += 2;
        if (blockCommentDepth === 0) state = "normal";
      } else {
        index += 1;
      }
      continue;
    }

    if (state === "single") {
      if (character === "\\") {
        index += 2;
      } else if (character === "'" && next === "'") {
        index += 2;
      } else {
        if (character === "'") state = "normal";
        index += 1;
      }
      continue;
    }

    if (state === "double") {
      if (character === "\\") {
        index += 2;
      } else if (character === '"' && next === '"') {
        index += 2;
      } else {
        if (character === '"') state = "normal";
        index += 1;
      }
      continue;
    }

    if (state === "dollar") {
      if (source.startsWith(dollarDelimiter, index)) {
        index += dollarDelimiter.length;
        state = "normal";
        dollarDelimiter = "";
      } else {
        index += 1;
      }
      continue;
    }

    if (character === "-" && next === "-") {
      state = "lineComment";
      index += 2;
    } else if (character === "/" && next === "*") {
      state = "blockComment";
      blockCommentDepth = 1;
      index += 2;
    } else if (character === "'") {
      hasExecutableCode = true;
      state = "single";
      index += 1;
    } else if (character === '"') {
      hasExecutableCode = true;
      state = "double";
      index += 1;
    } else if (character === "$") {
      const delimiter = dollarQuoteAt(source, index);
      if (delimiter) {
        hasExecutableCode = true;
        dollarDelimiter = delimiter;
        state = "dollar";
        index += delimiter.length;
      } else {
        if (!/\s/.test(character)) hasExecutableCode = true;
        index += 1;
      }
    } else if (character === ";") {
      if (hasExecutableCode) {
        const statement = source.slice(statementStart, index).trim();
        if (statement) statements.push(statement);
      }
      hasExecutableCode = false;
      statementStart = index + 1;
      index += 1;
    } else {
      if (!/\s/.test(character)) hasExecutableCode = true;
      index += 1;
    }
  }

  if (
    state === "single" || state === "double" || state === "dollar" ||
    state === "blockComment"
  ) {
    throw new Error("Migration SQL incomplète : guillemet ou bloc non fermé");
  }

  const finalStatement = source.slice(statementStart).trim();
  if (hasExecutableCode && finalStatement) statements.push(finalStatement);
  return statements;
}

export async function runVibeMigrations() {
  console.log("⚡ [Vibe Migrator] Initialisation des migrations...");

  try {
    const sql = getDb();
    const migrationFiles = await listMigrationFiles();

    await sql`
      CREATE TABLE IF NOT EXISTS _vibe_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        checksum VARCHAR(64),
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE _vibe_migrations ADD COLUMN IF NOT EXISTS checksum VARCHAR(64)`;

    let applied = 0;
    let skipped = 0;

    for (const migration of migrationFiles) {
      const source = await Deno.readTextFile(
        new URL(migration.name, MIGRATIONS_DIRECTORY),
      );
      const executableSource = prepareMigrationSource(migration.name, source);
      const checksum = await sha256(executableSource);
      const statements = splitSqlStatements(executableSource);
      if (statements.length === 0) {
        throw new Error(`Migration SQL vide : ${migration.name}`);
      }

      const trackedRows = (await sql`
        SELECT checksum
        FROM _vibe_migrations
        WHERE name = ${migration.name}
        LIMIT 1
      `) as unknown as TrackedMigration[];
      const tracked = trackedRows[0];

      if (tracked) {
        if (tracked.checksum && tracked.checksum !== checksum) {
          throw new Error(
            `Migration déjà appliquée mais modifiée (${migration.name}). Créez une nouvelle migration numérotée.`,
          );
        }
        if (!tracked.checksum) {
          await sql`
            UPDATE _vibe_migrations
            SET checksum = ${checksum}
            WHERE name = ${migration.name}
          `;
        }
        skipped += 1;
        continue;
      }

      console.log(`📦 [Vibe Migrator] Exécution de ${migration.name}`);
      await sql.transaction((txn) => [
        // Sérialise deux runners concurrents sur les migrations DDL.
        txn`SELECT pg_advisory_xact_lock(20250925, 1)`,
        ...statements.map((statement) => txn.query(statement)),
        txn`
          INSERT INTO _vibe_migrations (name, checksum)
          VALUES (${migration.name}, ${checksum})
          ON CONFLICT (name) DO NOTHING
        `,
      ]);
      applied += 1;
    }

    console.log(
      `✅ [Vibe Migrator] ${applied} migration(s) appliquée(s), ${skipped} déjà à jour.`,
    );
    return { success: true, applied, skipped };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ [Vibe Migrator] Erreur lors des migrations :", error);
    return { success: false, error: message };
  }
}
