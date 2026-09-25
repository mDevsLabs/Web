#!/usr/bin/env node
/**
 * Garde de schéma : vérifie que la base cible contient les tables et colonnes
 * critiques attendues par le code déployé. À exécuter AVANT chaque déploiement
 * (preview et production) : un schéma obsolète fait échouer le job avec un
 * message explicite au lieu de déployer un code qui répondra 500 sur toutes
 * les routes base (bug « l'IA ne répond pas, aucun appel API »).
 *
 * Usage : node scripts/check-db-schema.mjs [fichier-env...]
 *   - Lit DATABASE_URL ou POSTGRES_URL depuis l'environnement, sinon depuis
 *     les fichiers env passés en argument (défaut : .env.local, .env).
 *   - Sortie silencieuse en cas de succès ; diagnostic détaillé en échec.
 *   - Code de sortie 1 si une table/colonne critique manque.
 */

import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

// Tables absolument requises par les routes /api/chat et /api/agent. Toute
// absence produit un 500 avant l'appel au modèle IA.
const REQUIRED_TABLES = [
  "AgentRun",
  "AgentSchedule",
  "AgentScheduleVersion",
  "AgentStep",
  "AgentUserInputRequest",
  "Project",
  "ProjectMember",
  "Skill",
  "ToolExecution",
  "user_notification_prefs",
  "user_preferences",
  "UsageEvent",
  "Message_v2",
  "Stream",
  "ScheduledMessage",
];

// Colonnes introduites par des migrations récentes : détecte une base partiellement migrée.
const REQUIRED_COLUMNS = [
  { column: "agentApprovalRequired", table: "user_notification_prefs" },
  { column: "executionOwner", table: "AgentRun" },
  { column: "executionLeaseUntil", table: "AgentRun" },
  { column: "stopReason", table: "AgentRun" },
  { column: "parentRunId", table: "AgentRun" },
  { column: "scheduleVersionId", table: "AgentScheduleOccurrence" },
  { column: "planningTaskCompleted", table: "user_notification_prefs" },
  { column: "quotaWarning", table: "user_notification_prefs" },
];

const REQUIRED_INDEXES = [
  "UsageEvent_userId_createdAt_idx",
  "Message_v2_chatId_createdAt_id_idx",
  "Stream_chatId_createdAt_idx",
  "ScheduledMessage_userId_status_scheduledAt_idx",
];

const envFiles =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : [".env.local", ".env"];

let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
databaseUrl = databaseUrl
  .trim()
  .replace(/^("')+/, "")
  .replace(/(["'])+$/, "")
  .trim();
if (!databaseUrl) {
  for (const file of envFiles) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf8");
    const match = content.match(
      /(?:DATABASE_URL|POSTGRES_URL)\s*=\s*"?([^"\n]+)"?/
    );
    if (match) {
      databaseUrl = match[1].trim();
      break;
    }
  }
}

if (!databaseUrl) {
  console.error(
    "::error::DATABASE_URL/POSTGRES_URL introuvable (environnement ni fichiers env)."
  );
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

let target = "(cible inconnue)";
try {
  target = new URL(databaseUrl).host;
} catch {
  // URL non standard : on affiche simplement qu'elle a été fournie.
}

const missingTables = [];
const missingColumns = [];
const missingIndexes = [];

try {
  // Liste complète des tables du schéma public (~140 lignes) : on filtre en JS
  // pour éviter les subtilités d'interpolation de listes de postgres.js.
  const allTables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  const foundTableSet = new Set(allTables.map((row) => row.table_name));
  for (const table of REQUIRED_TABLES) {
    if (!foundTableSet.has(table)) missingTables.push(table);
  }

  const indexes = await sql`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
  `;
  const foundIndexSet = new Set(indexes.map((row) => row.indexname));
  for (const index of REQUIRED_INDEXES) {
    if (!foundIndexSet.has(index)) missingIndexes.push(index);
  }

  for (const { column, table } of REQUIRED_COLUMNS) {
    const found = await sql`
      SELECT c.column_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = ${table}
        AND c.column_name = ${column}
      LIMIT 1
    `;
    if (found.length === 0) missingColumns.push(`${table}.${column}`);
  }

  if (
    missingTables.length > 0 ||
    missingColumns.length > 0 ||
    missingIndexes.length > 0
  ) {
    console.error(
      `::error::Schéma de base obsolète sur ${target} : migrations non appliquées.`
    );
    if (missingTables.length > 0) {
      console.error(
        `::error::Tables manquantes : ${missingTables.join(", ")}. Exécutez \`pnpm exec tsx lib/db/migrate.ts\` avec le DATABASE_URL de CET environnement avant de déployer.`
      );
    }
    if (missingColumns.length > 0) {
      console.error(
        `::error::Colonnes manquantes : ${missingColumns.join(", ")}.`
      );
    }
    if (missingIndexes.length > 0) {
      console.error(`::error::Index manquants : ${missingIndexes.join(", ")}.`);
    }
    process.exit(1);
  }

  console.log(
    `✓ Schéma de base OK sur ${target} (${REQUIRED_TABLES.length} tables, ${REQUIRED_COLUMNS.length} colonnes critiques vérifiées).`
  );
} catch (error) {
  console.error(
    `::error::Vérification du schéma impossible sur ${target} : ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
} finally {
  await sql.end();
}
