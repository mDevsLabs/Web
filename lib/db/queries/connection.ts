import "server-only";
import "dotenv/config";

// Le DDL de réparation du drift est extrait dans lib/db/queries/repair-ddl.ts
// Index de garantie d'unicité pour les modèles d'agents :
// CREATE UNIQUE INDEX IF NOT EXISTS "AgentTemplate_name_key"

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resolveDatabaseUrl } from "@/lib/db/connection-string";
import {
  ensureChatAndProjectTables,
  ensureCoreAndAuthTables,
  ensureMcpAndNotificationTables,
  ensureSkillAndAgentTables,
  repairDriftSchema,
} from "./repair-ddl";

// Garde d'accès aux projets partagés (owner ou membre). Import paresseux pour
// éviter tout cycle : access.ts importe déjà queries.ts (getDb, getRawClient).
async function _getProjectAccessGuard() {
  return import("@/lib/projects/access");
}

let _db: ReturnType<typeof drizzle> | null = null;
let _migrationRan = false;

// Colonnes NOT NULL dont le schéma Drizzle déclare un défaut (defaultNow())
// mais que la base peut avoir été créée sans : toute insertion qui ne fournit
// pas la valeur échoue alors (ex. saveChat sans createdAt → aucun appel IA,
// quel que soit le mode). ensureTableTypes ne répare que les tables ABSENTES ;
// ces ALTER réparent les colonnes EXISTANTES désynchronisées. Idempotent.
const REQUIRED_COLUMN_DEFAULTS: Array<{
  column: string;
  table: string;
}> = [
  { column: "createdAt", table: "Chat" },
  { column: "createdAt", table: "Message_v2" },
  { column: "createdAt", table: "Stream" },
  { column: "createdAt", table: "Document" },
  { column: "createdAt", table: "Suggestion" },
  { column: "updatedAt", table: "Project" },
  { column: "startedAt", table: "AgentRun" },
  { column: "completedAt", table: "AgentRun" },
  { column: "startedAt", table: "ToolExecution" },
  { column: "completedAt", table: "ToolExecution" },
  { column: "completedAt", table: "AgentStep" },
  { column: "expiresAt", table: "AgentUserInputRequest" },
  { column: "expiresAt", table: "ApprovalRequest" },
];

async function ensureColumnDefaults(
  client: ReturnType<typeof postgres>
): Promise<void> {
  // Une seule interrogation : seules les colonnes SANS défaut sont réparées.
  // La base saine ne subit donc qu'un SELECT (coût négligeable au démarrage,
  // y compris pour les workers de tests qui initialisent chacun leur client).
  try {
    const values = REQUIRED_COLUMN_DEFAULTS.map(
      ({ column, table }) => `('${table}','${column}')`
    ).join(", ");
    const missing = await client.unsafe<
      [{ column_name: string; table_name: string }]
    >(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE (table_name, column_name) IN (${values}) AND column_default IS NULL`
    );
    for (const { column_name, table_name } of missing) {
      try {
        await client.unsafe(
          `ALTER TABLE "${table_name}" ALTER COLUMN "${column_name}" SET DEFAULT now()`
        );
      } catch {
        // Une réparation peut échouer (droits, table supprimée entre-temps) :
        // on tente les suivantes sans bloquer le démarrage.
      }
    }
  } catch {
    // information_schema indisponible : tant pis, les migrations CLI
    // (lib/db/migrate.ts) restent le filet de sécurité.
  }
}

async function ensureTableTypes(client: ReturnType<typeof postgres>) {
  if (_migrationRan) {
    return;
  }
  _migrationRan = true;

  // DDL HORS du chemin de requête.
  //
  // Ces réparations s'exécutaient au premier accès base de chaque process :
  // une application ne doit pas modifier le schéma pendant qu'elle sert des
  // requêtes (verrous de table, DDL concurrent entre instances, opérations
  // destructrices impossibles à auditer). Les migrations vivent dans
  // lib/db/migrate.ts, exécuté par un job dédié et approuvé.
  //
  // `DB_RUNTIME_DDL_REPAIR=true` reste disponible pour le dépannage ponctuel
  // d'un environnement cassé, et seulement là.
  if (process.env.DB_RUNTIME_DDL_REPAIR !== "true") {
    return;
  }
  console.warn(
    "[db] DB_RUNTIME_DDL_REPAIR=true : réparations de schéma exécutées au runtime (dépannage ponctuel uniquement — préférez `pnpm db:migrate`)."
  );

  // Neon pooler: chaque instruction doit être dans une requête séparée
  const run = async (query: Promise<unknown>) => {
    try {
      await query;
    } catch {
      /* ignorer les erreurs (déjà existant, etc.) */
    }
  };

  // Réparation des colonnes existantes dont le défaut a disparu (drift de
  // schéma) : sans cela, saveChat/saveMessages échouent en production et le
  // modèle IA n'est jamais appelé.
  await ensureColumnDefaults(client);

  await repairDriftSchema(client, run);
  await ensureCoreAndAuthTables(client, run);
  await ensureChatAndProjectTables(client, run);
  await ensureMcpAndNotificationTables(client, run);
  await ensureSkillAndAgentTables(client, run);
}

let _migrationPromise: Promise<void> | null = null;
export let _rawClient: postgres.Sql | null = null;

function initDb() {
  const connectionString = resolveDatabaseUrl();

  if (!connectionString) {
    throw new Error(
      "La variable DATABASE_URL ou POSTGRES_URL est absente. Vérifiez la configuration de l'environnement."
    );
  }

  const client = postgres(connectionString, { prepare: false });
  _rawClient = client;
  _db = drizzle(client);
  _migrationPromise = ensureTableTypes(client);
}

export function getDb() {
  if (!_db) {
    initDb();
  }
  if (!_db) {
    throw new Error("Database initialization failed.");
  }
  return _db;
}

// Client Postgres brut, pour les modules voisins (lib/db/users.ts) qui ont
// besoin de SQL paramétré direct. Toujours appeler après dbReady().
export function getRawClient() {
  return _rawClient;
}

// Helper utilisé dans toutes les fonctions de requêtes. Exporté pour les
// modules de requêtes voisins (agent-queries.ts), qui doivent bénéficier du
// même init paresseux et de la même attente des migrations de types.
export async function dbReady() {
  if (!_db) {
    initDb();
  }
  if (_migrationPromise) {
    await _migrationPromise;
    _migrationPromise = null; // éviter de re-await
  }
  if (!_db) {
    throw new Error("Database initialization failed.");
  }
  return _db;
}
