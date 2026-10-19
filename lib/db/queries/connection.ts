import "server-only";
import "dotenv/config";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import type { ToolCategory } from "@/lib/agent/types";
import { resolveBillableTotal } from "@/lib/agent/usage";
import { dedupeAgentTemplatesByName } from "@/lib/agent-templates/dedupe";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { normalizeAppKey } from "@/lib/apps/catalog";
import { MEMORY_CONTENT_MAX_LENGTH } from "@/lib/constants";
import { normalizeCreationMode } from "@/lib/creation/mode";
import { resolveDatabaseUrl } from "@/lib/db/connection-string";
import { ChatbotError } from "@/lib/errors";
import {
  AUTO_DICTATION_LANGUAGE,
  DEFAULT_TRANSLATION_TARGET,
  normalizeDictationLanguage,
  normalizeTranslationTarget,
} from "@/lib/i18n/languages";
import {
  redactMcpError,
  redactMcpText,
  redactMcpValue,
} from "@/lib/mcp/redaction";
import type { ScheduleToolMode } from "@/lib/planning/tool-mode";
import { normalizeScheduleToolMode } from "@/lib/planning/tool-mode";
import {
  agent,
  agentTemplate,
  type Chat,
  chat,
  customCommand,
  type DBMessage,
  type DocumentProposal,
  document,
  documentProposal,
  mcpLog,
  mcpServer,
  mcpServerSecret,
  message,
  pluginInstallation,
  project,
  projectFile,
  projectInvite,
  projectMember,
  type ScheduledMessage,
  type Skill,
  type Suggestion,
  scheduledMessage,
  skill,
  skillUsage,
  skillVersion,
  stream,
  suggestion,
  toolExecution,
  userMcpPrefs,
  userMemory,
  vote,
} from "../schema";

// Garde d'accès aux projets partagés (owner ou membre). Import paresseux pour
// éviter tout cycle : access.ts importe déjà queries.ts (getDb, getRawClient).
async function getProjectAccessGuard() {
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

  // ── Réparation du drift de types (base partagée / environnements mixtes) ──
  // Trois colonnes ont dérivé du schéma Drizzle ; chaque requête utilisateur
  // échouait alors AVANT l'appel au modèle (500 Chat, « base de données »
  // Agent, quota jamais débité). Tout est idempotent, sans perte de données,
  // et les erreurs individuelles sont absorbées par run() ci-dessus.

  // Skill.userId : le code écrit l'identifiant mAI canonique (texte, ex. "1"
  // ou email) alors que la colonne dérivée en uuid rejetait toute écriture et
  // toute lecture filtrée par utilisateur (22P02 invalid input syntax).
  // Les index btree sur la colonne sont reconstruits automatiquement par
  // l'ALTER TYPE ; la FK héritée Skill_userId_fkey (vers "User"(id) uuid)
  // est retirée : incompatible avec le type texte et jamais exploitable.
  await run(
    client`ALTER TABLE "Skill" DROP CONSTRAINT IF EXISTS "Skill_userId_fkey"`
  );
  await run(client`DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Skill' AND column_name = 'userId' AND data_type = 'uuid'
    ) THEN
      ALTER TABLE "Skill" ALTER COLUMN "userId" TYPE text USING "userId"::text;
    END IF;
  END $$;`);

  // weekly_usage : table PLATEFORME partagée avec le backend mAI déployé
  // (handleGetUsage passe un user_id integer). Son contrat est integer + FK
  // vers users(id) — on ne la convertit PAS : si un drift inverse a été
  // appliqué (text), on le restaure ici. Les lignes dont user_id n'est pas
  // numérique (normalement aucune : la colonne était integer à l'origine)
  // sont mises de côté dans weekly_usage_drift_backup plutôt que perdues.
  // PERTE DE DONNÉES corrigée : `CREATE TABLE IF NOT EXISTS ... AS SELECT` est
  // un NO-OP quand la sauvegarde existe déjà (deuxième exécution), alors que le
  // `DELETE` qui suivait s'exécutait quand même : les nouvelles lignes non
  // numériques (comptes identifiés par email ou UUID) étaient supprimées SANS
  // sauvegarde, et les quotas correspondants perdus. La sauvegarde est
  // désormais construite ligne par ligne, sa complétude est VÉRIFIÉE, et toute
  // anomalie fait lever l'exception AVANT le moindre DELETE (transaction DDL
  // implicite du bloc DO : rien n'est appliqué).
  await run(client`DO $$
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
          'Sauvegarde weekly_usage incomplète (% lignes à déplacer, % sauvegardées) : aucune suppression effectuée.',
          a_deplacer, sauvegardees;
      END IF;

      DELETE FROM weekly_usage WHERE user_id !~ '^[0-9]+$';
      ALTER TABLE "weekly_usage" ALTER COLUMN "user_id" TYPE integer USING "user_id"::integer;
    END IF;
  END $$;`);
  await run(client`DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'weekly_usage'::regclass AND conname = 'weekly_usage_user_id_fkey'
    ) THEN
      ALTER TABLE "weekly_usage" ADD CONSTRAINT "weekly_usage_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE NOT VALID;
    END IF;
  END $$;`);

  // UserMemory : les colonnes introduites par le schéma Drizzle (activation,
  // importance, tags) manquaient en base — GET /api/memory et countMemories
  // échouaient en 42703 « column does not exist ». La colonne "category" a été
  // retirée (migration 0030) : elle n'était jamais utilisée en dehors d'un
  // filtre d'interface, et un varchar libre sans contrainte côté serveur
  // devenait une source de données incohérentes.
  await run(
    client`ALTER TABLE "UserMemory" ADD COLUMN IF NOT EXISTS "isEnabled" boolean DEFAULT true NOT NULL`
  );
  await run(
    client`ALTER TABLE "UserMemory" ADD COLUMN IF NOT EXISTS "isImportant" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "UserMemory" ADD COLUMN IF NOT EXISTS "tags" json DEFAULT '[]'::json NOT NULL`
  );

  // Création des tables une par une
  await run(client`CREATE TABLE IF NOT EXISTS "User" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(64) NOT NULL,
    "password" varchar(64),
    "name" text,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "isAnonymous" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Chat" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "title" text NOT NULL DEFAULT 'Nouvelle discussion',
    "userId" text NOT NULL,
    "visibility" varchar NOT NULL DEFAULT 'private'
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Message_v2" (
    "id" text PRIMARY KEY NOT NULL,
    "chatId" uuid NOT NULL,
    "role" varchar NOT NULL,
    "parts" json NOT NULL,
    "attachments" json NOT NULL DEFAULT '[]'::json,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Vote_v2" (
    "chatId" uuid NOT NULL,
    "messageId" text NOT NULL,
    "isUpvoted" boolean NOT NULL,
    PRIMARY KEY ("chatId", "messageId")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Document" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "title" text NOT NULL,
    "content" text,
    "text" varchar NOT NULL DEFAULT 'text',
    "userId" text NOT NULL,
    PRIMARY KEY ("id", "createdAt")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Suggestion" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "documentId" uuid NOT NULL,
    "documentCreatedAt" timestamp NOT NULL,
    "originalText" text NOT NULL,
    "suggestedText" text NOT NULL,
    "description" text,
    "isResolved" boolean NOT NULL DEFAULT false,
    "userId" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Stream" (
    "id" text PRIMARY KEY NOT NULL,
    "chatId" uuid NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "Project" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "icon" text DEFAULT 'folder',
    "color" varchar(7) DEFAULT '#6366f1',
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "token_blacklist" (
    "token" text PRIMARY KEY NOT NULL,
    "revoked_at" timestamp DEFAULT now() NOT NULL,
    "expires_at" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "user_totp" (
    "user_id" text PRIMARY KEY NOT NULL,
    "secret" text NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "backup_codes" text[] DEFAULT '{}' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "verified_at" timestamp
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "weekly_speech_usage" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "week_start" date NOT NULL,
    "tokens_used" bigint DEFAULT 0 NOT NULL,
    "requests_count" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT weekly_speech_usage_user_week_unique UNIQUE ("user_id", "week_start")
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "mprojects_speech_generations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "api_key" text,
    "title" text,
    "pinned" boolean DEFAULT false NOT NULL,
    "model" text DEFAULT 'deepgram/flux-tts:free' NOT NULL,
    "voice" text DEFAULT 'flux-alexis-en',
    "input_text" text NOT NULL,
    "audio_url" text,
    "tokens_count" integer DEFAULT 0 NOT NULL,
    "character_count" integer DEFAULT 0 NOT NULL,
    "status" text DEFAULT 'completed' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`);

  await run(
    client`ALTER TABLE "mprojects_speech_generations" ADD COLUMN IF NOT EXISTS "audio_url" text`
  );
  await run(
    client`ALTER TABLE "mprojects_speech_generations" ADD COLUMN IF NOT EXISTS "title" text`
  );
  await run(
    client`ALTER TABLE "mprojects_speech_generations" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`
  );

  await run(client`CREATE TABLE IF NOT EXISTS "mprojects_image_generations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "api_key" text,
    "title" text,
    "pinned" boolean DEFAULT false NOT NULL,
    "model" text NOT NULL DEFAULT 'black-forest-labs/flux-schnell',
    "prompt" text NOT NULL,
    "negative_prompt" text,
    "width" integer DEFAULT 1024 NOT NULL,
    "height" integer DEFAULT 1024 NOT NULL,
    "image_url" text NOT NULL,
    "status" text DEFAULT 'completed' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`);

  await run(
    client`ALTER TABLE "mprojects_image_generations" ADD COLUMN IF NOT EXISTS "title" text`
  );
  await run(
    client`ALTER TABLE "mprojects_image_generations" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`
  );

  // Table users pour les préférences et profil utilisateur
  await run(client`CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(255),
    "username" varchar(255),
    "password_hash" text,
    "phone" varchar(50),
    "avatar_url" text,
    "tier" varchar(50) DEFAULT 'Free',
    "custom_instructions" text DEFAULT '',
    "custom_instructions_enabled" boolean DEFAULT false NOT NULL,
    "default_temperature" double precision DEFAULT 0.7,
    "default_top_p" double precision DEFAULT 0.9,
    "default_agent_id" uuid,
    "default_chat_model" text,
    "default_chat_visibility" varchar(10) DEFAULT 'private',
    "default_image_model" text DEFAULT 'black-forest-labs/flux-schnell',
    "default_image_size" varchar(20) DEFAULT '1024x1024',
    "default_audio_model" text DEFAULT 'deepgram/flux-tts:free',
    "default_audio_voice" varchar(50) DEFAULT 'flux-alexis-en',
    "default_audio_speed" double precision DEFAULT 1.0,
    "ghost_memory_enabled" boolean DEFAULT false NOT NULL,
    "show_agent_chat_icons" boolean DEFAULT true NOT NULL,
    "newsletter" boolean DEFAULT false NOT NULL,
    "notify_limits" boolean DEFAULT true NOT NULL,
    "is_blocked" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`);

  // Colonnes préférences pour table users
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar(255)`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" varchar(255)`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(50)`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tier" varchar(50) DEFAULT 'Free'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "custom_instructions" text DEFAULT ''`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "custom_instructions_enabled" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_temperature" double precision DEFAULT 0.7`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_top_p" double precision DEFAULT 0.9`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_image_model" text DEFAULT 'black-forest-labs/flux-schnell'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_image_size" varchar(20) DEFAULT '1024x1024'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_audio_model" text DEFAULT 'deepgram/flux-tts:free'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_audio_voice" varchar(50) DEFAULT 'flux-alexis-en'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_audio_speed" double precision DEFAULT 1.0`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_chat_model" text`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_chat_visibility" varchar(20) DEFAULT 'private'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_agent_id" uuid`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ghost_memory_enabled" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "show_agent_chat_icons" boolean DEFAULT true NOT NULL`
  );

  // Table dédiée ultra-robuste pour les préférences IA utilisateur (clé primaire text userId)
  await run(client`CREATE TABLE IF NOT EXISTS "user_preferences" (
    "userId" text PRIMARY KEY NOT NULL,
    "customInstructions" text DEFAULT '' NOT NULL,
    "customInstructionsEnabled" boolean DEFAULT false NOT NULL,
    "defaultTemperature" double precision DEFAULT 0.7 NOT NULL,
    "defaultTopP" double precision DEFAULT 0.9 NOT NULL,
    "defaultAgentId" uuid,
    "defaultChatModel" text,
    "defaultChatVisibility" varchar(20) DEFAULT 'private' NOT NULL,
    "defaultImageModel" text DEFAULT 'black-forest-labs/flux-schnell' NOT NULL,
    "defaultImageSize" varchar(50) DEFAULT '1024x1024' NOT NULL,
    "defaultAudioModel" text DEFAULT 'deepgram/flux-tts:free' NOT NULL,
    "defaultAudioVoice" varchar(100) DEFAULT 'flux-alexis-en' NOT NULL,
    "defaultAudioSpeed" double precision DEFAULT 1.0 NOT NULL,
    "ghostMemoryEnabled" boolean DEFAULT false NOT NULL,
    "showAgentChatIcons" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "customInstructions" text DEFAULT '' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "customInstructionsEnabled" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultTemperature" double precision DEFAULT 0.7 NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultTopP" double precision DEFAULT 0.9 NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultAgentId" uuid`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultChatModel" text`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultChatVisibility" varchar(20) DEFAULT 'private' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultImageModel" text DEFAULT 'black-forest-labs/flux-schnell' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultImageSize" varchar(50) DEFAULT '1024x1024' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultAudioModel" text DEFAULT 'deepgram/flux-tts:free' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultAudioVoice" varchar(100) DEFAULT 'flux-alexis-en' NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultAudioSpeed" double precision DEFAULT 1.0 NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "ghostMemoryEnabled" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "showAgentChatIcons" boolean DEFAULT true NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL`
  );

  // Tables Skills et MCP
  await run(client`CREATE TABLE IF NOT EXISTS "Skill" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "instructions" text NOT NULL DEFAULT '',
    "icon" text DEFAULT 'sparkles',
    "color" varchar(7) DEFAULT '#6366f1',
    "tools" json DEFAULT '[]'::json NOT NULL,
    "parameters" json DEFAULT '[]'::json NOT NULL,
    "pinned" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "shareId" text,
    "tags" text[] DEFAULT '{}'::text[] NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "skillId" uuid`);
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`
  );

  await run(client`CREATE TABLE IF NOT EXISTS "McpServer" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "icon" text DEFAULT 'server',
    "transport" varchar NOT NULL DEFAULT 'sse',
    "url" text,
    "command" text,
    "args" json DEFAULT '[]'::json NOT NULL,
    "env" json DEFAULT '{}'::json NOT NULL,
    "authType" varchar NOT NULL DEFAULT 'none',
    "authConfig" json DEFAULT '{}'::json NOT NULL,
    "headers" json DEFAULT '{}'::json NOT NULL,
    "isEnabled" boolean DEFAULT true NOT NULL,
    "requireApproval" varchar NOT NULL DEFAULT 'write_only',
    "toolsCache" json DEFAULT '[]'::json NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  await run(client`CREATE TABLE IF NOT EXISTS "McpLog" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "serverId" uuid,
    "serverName" text NOT NULL,
    "toolName" text NOT NULL,
    "chatId" uuid,
    "actionType" varchar NOT NULL DEFAULT 'read',
    "approvalStatus" varchar NOT NULL DEFAULT 'auto_approved',
    "inputPayload" json,
    "outputPayload" json,
    "error" text,
    "durationMs" integer DEFAULT 0,
    "createdAt" timestamp DEFAULT now() NOT NULL
  )`);

  // Migrations de colonnes (supprimer contraintes FK, caster vers text)
  await run(
    client`ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk" CASCADE`
  );
  await run(
    client`ALTER TABLE "Chat" ALTER COLUMN "userId" TYPE text USING "userId"::text`
  );

  await run(
    client`ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_User_id_fk" CASCADE`
  );
  await run(
    client`ALTER TABLE "Document" ALTER COLUMN "userId" TYPE text USING "userId"::text`
  );

  await run(
    client`ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_User_id_fk" CASCADE`
  );
  await run(
    client`ALTER TABLE "Suggestion" ALTER COLUMN "userId" TYPE text USING "userId"::text`
  );

  await run(
    client`ALTER TABLE "Message_v2" DROP CONSTRAINT IF EXISTS "Message_v2_chatId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Message_v2" ALTER COLUMN "id" TYPE text USING "id"::text`
  );

  await run(
    client`ALTER TABLE "Vote_v2" DROP CONSTRAINT IF EXISTS "Vote_v2_messageId_fkey" CASCADE`
  );
  await run(
    client`ALTER TABLE "Vote_v2" ALTER COLUMN "messageId" TYPE text USING "messageId"::text`
  );

  await run(
    client`ALTER TABLE "Stream" ALTER COLUMN "id" TYPE text USING "id"::text`
  );

  // Colonnes étendues pour Chat
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "projectId" uuid REFERENCES "Project"("id") ON DELETE SET NULL`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "isArchived" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "archivedAt" timestamp`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}' NOT NULL`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "customInstructions" text`
  );
  await run(
    client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "temperatureOverride" double precision`
  );
  await run(client`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "agentId" uuid`);
  await run(client`ALTER TABLE "Chat" DROP COLUMN IF EXISTS "modeId"`);

  // Colonnes étendues pour Project
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "customInstructions" text`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "defaultModel" text`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "description" text DEFAULT ''`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "icon" text DEFAULT 'folder'`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "color" varchar(7) DEFAULT '#6366f1'`
  );
  await run(
    client`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "isArchived" boolean DEFAULT false NOT NULL`
  );

  // Index de performance
  await run(
    client`CREATE INDEX IF NOT EXISTS "Chat_projectId_idx" ON "Chat" USING btree ("projectId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Chat_userId_isArchived_idx" ON "Chat" USING btree ("userId", "isArchived")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Chat_userId_createdAt_desc_idx" ON "Chat" USING btree ("userId", "createdAt" DESC)`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Chat_userId_pinned_idx" ON "Chat" USING btree ("userId", "pinned")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Chat_userId_projectId_idx" ON "Chat" USING btree ("userId", "projectId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project" USING btree ("userId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Project_userId_createdAt_idx" ON "Project" USING btree ("userId", "createdAt" DESC)`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "weekly_speech_usage_user_id_idx" ON "weekly_speech_usage" USING btree ("user_id")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "weekly_speech_usage_week_start_idx" ON "weekly_speech_usage" USING btree ("week_start")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "mprojects_speech_generations_user_id_idx" ON "mprojects_speech_generations" USING btree ("user_id")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "mprojects_speech_generations_created_at_idx" ON "mprojects_speech_generations" USING btree ("created_at" DESC)`
  );

  // Notifications & prefs
  await run(client`CREATE TABLE IF NOT EXISTS "Notification" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "type" varchar NOT NULL,
    "title" text NOT NULL,
    "body" text,
    "link" text,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification" USING btree ("userId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification" USING btree ("createdAt" DESC)`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification" USING btree ("userId","isRead")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Notification_userId_type_idx" ON "Notification" USING btree ("userId","type")`
  );
  await run(client`CREATE TABLE IF NOT EXISTS "user_notification_prefs" (
    "userId" text PRIMARY KEY NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "aiResponse" boolean DEFAULT true NOT NULL,
    "projectCreated" boolean DEFAULT true NOT NULL,
    "mcpCreated" boolean DEFAULT true NOT NULL,
    "mcpAccessRequest" boolean DEFAULT true NOT NULL,
    "news" boolean DEFAULT true NOT NULL,
    "planningTaskCompleted" boolean DEFAULT true NOT NULL,
    "quotaWarning" boolean DEFAULT true NOT NULL,
    "regenerateMode" varchar DEFAULT 'truncate' NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "planningTaskCompleted" boolean DEFAULT true NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "quotaWarning" boolean DEFAULT true NOT NULL`
  );
  await run(
    client`ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "regenerateMode" varchar DEFAULT 'truncate' NOT NULL`
  );

  // MCP fine-grained control + encrypted vars + Skill binding + global prefs (0006)
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "lastSyncAt" timestamp`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "lastCallAt" timestamp`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "avgLatencyMs" integer DEFAULT 0 NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "callCount" integer DEFAULT 0 NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "uptimeStatus" varchar(20) DEFAULT 'unknown' NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "timeoutMs" integer DEFAULT 15000 NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "rateLimitPerMin" integer DEFAULT 60 NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "toolOverrides" json DEFAULT '{}'::json NOT NULL`
  );
  await run(client`CREATE TABLE IF NOT EXISTS "mcp_server_secret" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "serverId" uuid NOT NULL REFERENCES "McpServer"("id") ON DELETE CASCADE,
    "userId" text NOT NULL,
    "kind" varchar(20) NOT NULL CHECK ("kind" IN ('env','auth','header')),
    "key" text NOT NULL,
    "encryptedValue" text NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "mcp_server_secret_unique" UNIQUE("serverId","kind","key")
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "mcp_server_secret_serverId_idx" ON "mcp_server_secret" USING btree ("serverId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "mcp_server_secret_userId_idx" ON "mcp_server_secret" USING btree ("userId")`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "mcpServerIds" uuid[] DEFAULT '{}' NOT NULL`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "mcpToolFilter" json DEFAULT '{}'::json NOT NULL`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "version" varchar(20) DEFAULT 'v1' NOT NULL`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "usageCount" integer DEFAULT 0 NOT NULL`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "lastUsedAt" timestamp`
  );
  await run(
    client`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "templateId" text`
  );
  // Les modèles de Skills sont identifiés par un slug (et non plus par un uuid
  // de la table SkillTemplate) : la colonne historique est convertie une fois
  // pour toutes, puis rendue unique par utilisateur (installation idempotente).
  await run(
    client`ALTER TABLE "Skill" DROP CONSTRAINT IF EXISTS "Skill_templateId_fkey"`
  );
  await run(
    client`ALTER TABLE "Skill" ALTER COLUMN "templateId" TYPE text USING "templateId"::text`
  );
  await run(
    client`CREATE UNIQUE INDEX IF NOT EXISTS "Skill_userId_templateId_key" ON "Skill" ("userId", "templateId") WHERE "templateId" IS NOT NULL`
  );
  await run(
    client`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "templateId" text`
  );
  await run(
    client`CREATE UNIQUE INDEX IF NOT EXISTS "McpServer_userId_templateId_key" ON "McpServer" ("userId", "templateId") WHERE "templateId" IS NOT NULL`
  );
  await run(client`CREATE TABLE IF NOT EXISTS "user_mcp_prefs" (
    "userId" text PRIMARY KEY NOT NULL,
    "globalKillSwitch" boolean DEFAULT false NOT NULL,
    "defaultRequireApproval" varchar(20) DEFAULT 'write_only' NOT NULL CHECK ("defaultRequireApproval" IN ('always_allow','write_only','ask_permission')),
    "defaultTimeoutMs" integer DEFAULT 15000 NOT NULL,
    "defaultRateLimitPerMin" integer DEFAULT 60 NOT NULL,
    "allowStdio" boolean DEFAULT false NOT NULL,
    "retentionDays" integer DEFAULT 30 NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(client`CREATE TABLE IF NOT EXISTS "SkillTemplate" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "instructions" text NOT NULL DEFAULT '',
    "icon" text DEFAULT 'sparkles',
    "color" varchar(7) DEFAULT '#6366f1',
    "tags" text[] DEFAULT '{}'::text[] NOT NULL,
    "tools" json DEFAULT '[]'::json NOT NULL,
    "parameters" json DEFAULT '[]'::json NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(client`CREATE TABLE IF NOT EXISTS "McpTemplate" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "transport" varchar(20) DEFAULT 'sse' NOT NULL,
    "url" text,
    "command" text,
    "args" text,
    "authType" varchar(20) DEFAULT 'none' NOT NULL,
    "icon" text DEFAULT 'server',
    "isPublic" boolean DEFAULT true NOT NULL,
    "tags" text[] DEFAULT '{}'::text[] NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);

  // Agents & AgentTemplate (0007)
  await run(client`CREATE TABLE IF NOT EXISTS "Agent" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" varchar(100) NOT NULL,
    "description" varchar(500) DEFAULT '',
    "instructions" text NOT NULL DEFAULT '',
    "icon" varchar(50) DEFAULT 'sparkles' NOT NULL,
    "color" varchar(7) DEFAULT '#6366f1' NOT NULL,
    "defaultModelId" text NOT NULL DEFAULT '${DEFAULT_CHAT_MODEL}',
    "skillIds" json DEFAULT '[]'::json NOT NULL,
    "mcpServerIds" json DEFAULT '[]'::json NOT NULL,
    "cloudFileUrls" json DEFAULT '[]'::json NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "shareId" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "Agent_userId_idx" ON "Agent" USING btree ("userId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Agent_shareId_idx" ON "Agent" USING btree ("shareId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "Agent_userId_createdAt_idx" ON "Agent" USING btree ("userId", "createdAt" DESC)`
  );

  // Colonnes enrichies de Agent (0008)
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "temperature" double precision DEFAULT 0.7`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "topP" double precision DEFAULT 0.9`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "maxTokens" integer`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "starterPrompts" json DEFAULT '[]'::json NOT NULL`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "welcomeMessage" text`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`
  );

  await run(client`CREATE TABLE IF NOT EXISTS "AgentTemplate" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(100) NOT NULL,
    "description" varchar(500) DEFAULT '',
    "instructions" text NOT NULL DEFAULT '',
    "icon" varchar(50) DEFAULT 'bot' NOT NULL,
    "color" varchar(7) DEFAULT '#6366f1' NOT NULL,
    "defaultModelId" text DEFAULT '${DEFAULT_CHAT_MODEL}' NOT NULL,
    "skillIds" json DEFAULT '[]'::json,
    "mcpServerIds" json DEFAULT '[]'::json,
    "tags" varchar(50)[] DEFAULT '{}' NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "AgentTemplate_isPublic_idx" ON "AgentTemplate" USING btree ("isPublic")`
  );
  // Unicité du nom : garde-fou qui empêche le rejeu du seed de 0007_agents.sql
  // de dupliquer les modèles (cf. migration 0029). ON CONFLICT DO NOTHING sans
  // cible couvre cette contrainte, le seed redevient idempotent.
  await run(
    client`CREATE UNIQUE INDEX IF NOT EXISTS "AgentTemplate_name_key" ON "AgentTemplate" USING btree ("name")`
  );

  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_agent_id" uuid`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_chat_model" text`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_chat_visibility" varchar(10) DEFAULT 'private'`
  );
  await run(
    client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "show_agent_chat_icons" boolean DEFAULT true NOT NULL`
  );
  await run(
    client`ALTER TABLE "users" DROP COLUMN IF EXISTS "default_ai_mode"`
  );

  // UserMemory — mémoire personnalisée globale / agent / projet (0010)
  await run(client`CREATE TABLE IF NOT EXISTS "UserMemory" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "agentId" uuid REFERENCES "Agent"("id") ON DELETE CASCADE,
    "projectId" uuid REFERENCES "Project"("id") ON DELETE CASCADE,
    "content" text NOT NULL CHECK (char_length("content") > 0 AND char_length("content") <= 2000),
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "UserMemory_scope_check" CHECK (NOT ("agentId" IS NOT NULL AND "projectId" IS NOT NULL))
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "UserMemory_userId_idx" ON "UserMemory" USING btree ("userId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "UserMemory_agentId_idx" ON "UserMemory" USING btree ("agentId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "UserMemory_projectId_idx" ON "UserMemory" USING btree ("projectId")`
  );
  await run(
    client`ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "memoryMode" varchar(10) DEFAULT 'global' NOT NULL`
  );
  await run(
    client`DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ghost_memory_enabled') THEN
      ALTER TABLE "users" ADD COLUMN "ghost_memory_enabled" boolean DEFAULT false NOT NULL;
    END IF;
  END IF;
END $$;`
  );

  // Table ScheduledMessage (Planification)
  await run(client`CREATE TABLE IF NOT EXISTS "ScheduledMessage" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "title" text DEFAULT 'Envoi planifié' NOT NULL,
    "prompt" text NOT NULL,
    "scheduledAt" timestamp NOT NULL,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "createMode" varchar(20) DEFAULT 'new_chat' NOT NULL,
    "chatId" uuid REFERENCES "Chat"("id") ON DELETE SET NULL,
    "resultChatId" uuid,
    "agentId" uuid REFERENCES "Agent"("id") ON DELETE SET NULL,
    "recurrence" varchar(20) DEFAULT 'none' NOT NULL,
    "modelId" text DEFAULT '${DEFAULT_CHAT_MODEL}' NOT NULL,
    "enabledTools" json DEFAULT '[]'::json NOT NULL,
    "toolMode" varchar(16) DEFAULT 'auto' NOT NULL,
    "cloudFileUrls" json DEFAULT '[]'::json NOT NULL,
    "customInstructions" text,
    "temperature" double precision,
    "lastError" text,
    "executedAt" timestamp,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(client`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ScheduledMessage') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ScheduledMessage' AND column_name='cloudFileUrls') THEN
        ALTER TABLE "ScheduledMessage" ADD COLUMN "cloudFileUrls" json DEFAULT '[]'::json NOT NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ScheduledMessage' AND column_name='recurrence') THEN
        ALTER TABLE "ScheduledMessage" ADD COLUMN "recurrence" varchar(20) DEFAULT 'none' NOT NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ScheduledMessage' AND column_name='toolMode') THEN
        ALTER TABLE "ScheduledMessage" ADD COLUMN "toolMode" varchar(16) DEFAULT 'auto' NOT NULL;
      END IF;
    END IF;
  END $$;`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "ScheduledMessage_userId_idx" ON "ScheduledMessage" USING btree ("userId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "ScheduledMessage_scheduledAt_idx" ON "ScheduledMessage" USING btree ("scheduledAt")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "ScheduledMessage_status_idx" ON "ScheduledMessage" USING btree ("status")`
  );

  // CustomCommand (Commandes personnalisées)
  await run(client`CREATE TABLE IF NOT EXISTS "CustomCommand" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "name" text NOT NULL,
    "trigger" varchar(32) NOT NULL,
    "kind" varchar NOT NULL,
    "actionType" varchar NOT NULL,
    "payload" json DEFAULT '{}'::json NOT NULL,
    "icon" text DEFAULT 'zap',
    "color" varchar(7) DEFAULT '#6366f1',
    "description" text DEFAULT '',
    "enabled" boolean DEFAULT true NOT NULL,
    "pinned" boolean DEFAULT false NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "CustomCommand_userId_idx" ON "CustomCommand" USING btree ("userId")`
  );

  // SkillVersion et SkillUsage
  await run(client`CREATE TABLE IF NOT EXISTS "SkillVersion" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "skillId" uuid NOT NULL,
    "userId" text NOT NULL,
    "versionLabel" varchar(20) DEFAULT 'v1',
    "name" text NOT NULL,
    "description" text DEFAULT '',
    "instructions" text NOT NULL DEFAULT '',
    "icon" text DEFAULT 'sparkles',
    "color" varchar(7) DEFAULT '#6366f1',
    "tags" text[] DEFAULT '{}'::text[] NOT NULL,
    "tools" json DEFAULT '[]'::json NOT NULL,
    "parameters" json DEFAULT '[]'::json NOT NULL,
    "mcpServerIds" json DEFAULT '[]'::json NOT NULL,
    "mcpToolFilter" json DEFAULT '{}'::json NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "SkillVersion_skillId_idx" ON "SkillVersion" USING btree ("skillId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "SkillVersion_userId_idx" ON "SkillVersion" USING btree ("userId")`
  );

  await run(client`CREATE TABLE IF NOT EXISTS "SkillUsage" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "skillId" uuid NOT NULL,
    "userId" text NOT NULL,
    "invocationCount" integer DEFAULT 0 NOT NULL,
    "lastInvokedAt" timestamp,
    "createdAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE INDEX IF NOT EXISTS "SkillUsage_skillId_idx" ON "SkillUsage" USING btree ("skillId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "SkillUsage_userId_idx" ON "SkillUsage" USING btree ("userId")`
  );

  await run(client`CREATE TABLE IF NOT EXISTS "PluginInstallation" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "pluginId" varchar(64) NOT NULL,
    "version" varchar(20) DEFAULT '1.0.0' NOT NULL,
    "isEnabled" boolean DEFAULT true NOT NULL,
    "settings" json DEFAULT '{}'::json NOT NULL,
    "installedAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  )`);
  await run(
    client`CREATE UNIQUE INDEX IF NOT EXISTS "PluginInstallation_userId_pluginId_key" ON "PluginInstallation" USING btree ("userId","pluginId")`
  );
  await run(
    client`CREATE INDEX IF NOT EXISTS "PluginInstallation_userId_idx" ON "PluginInstallation" USING btree ("userId")`
  );
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
