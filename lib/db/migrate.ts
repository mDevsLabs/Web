import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { sanitizeConnectionString } from "@/lib/db/connection-string";

config({
  path: ".env.local",
});

// Les réparations de schéma qui précèdent les migrations Drizzle sont
// idempotentes, et certaines échouent LÉGITIMEMENT parce que la table ou la
// colonne n'existe pas encore (la migration qui suit la crée). L'ancien
// `catch {}` absorbait TOUT, indistinctement : une migration réellement
// incomplète (permission manquante, contrainte violée, type impossible) était
// présentée comme réussie.
//
// Désormais : les codes SQLSTATE « objet absent / déjà présent » sont
// journalisés comme sans objet, tout le reste est signalé et fait échouer la
// migration (sauf `MIGRATIONS_STRICT=false`, explicite).
const EXPECTED_SQLSTATES = new Set([
  "42701", // duplicate_column
  "42703", // undefined_column
  "42710", // duplicate_object (contrainte déjà présente)
  "42883", // undefined_function (extension non installée)
  "42P01", // undefined_table
  "42P07", // duplicate_table
  "42P16", // invalid_table_definition
]);

const unexpectedStepErrors: string[] = [];

function noteIgnoredStep(error: unknown): void {
  const code = (error as { code?: string } | null)?.code ?? "";
  const message = error instanceof Error ? error.message : String(error);
  const short = message.replace(/\s+/g, " ").slice(0, 180);
  if (EXPECTED_SQLSTATES.has(code)) {
    console.log(`[migrate] étape sans objet (${code}) : ${short}`);
    return;
  }
  unexpectedStepErrors.push(`${code || "sans code"} — ${short}`);
  console.warn(
    `[migrate] ÉCHEC d'une étape de réparation (${code || "sans code"}) : ${short}`
  );
}

const runMigrate = async () => {
  // En CI, la cible peut être désignée par un fichier env généré à la volée
  // (vercel pull) : DATABASE_URL_FILE/POSTGRES_URL_FILE pointe vers ce fichier
  // et le secret ne transite jamais dans un fichier du projet. La variable
  // directe reste prioritaire pour l'usage local.
  // La variable peut avoir été collée avec des guillemets englobants dans un
  // dashboard : sanitizeConnectionString() les retire avant usage.
  let dbUrl = sanitizeConnectionString(
    process.env.DATABASE_URL || process.env.POSTGRES_URL || ""
  );
  const urlFile =
    process.env.DATABASE_URL_FILE || process.env.POSTGRES_URL_FILE;
  if (!dbUrl && urlFile) {
    try {
      const content = readFileSync(urlFile, "utf8");
      const match = content.match(/(?:DATABASE_URL|POSTGRES_URL)\s*=\s*(.+)?/);
      if (match?.[1]) {
        dbUrl = sanitizeConnectionString(match[1]);
      }
    } catch {
      console.error(`Fichier env introuvable ou illisible : ${urlFile}`);
      process.exit(1);
    }
  }
  if (!dbUrl) {
    console.log("DATABASE_URL / POSTGRES_URL not defined, skipping migrations");
    process.exit(0);
  }

  const connection = postgres(dbUrl, { max: 1 });
  const db = drizzle(connection);

  console.log("Running migrations...");

  try {
    await connection`ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_fkey" CASCADE`;
    await connection`ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk" CASCADE`;
    await connection`ALTER TABLE "Chat" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_fkey" CASCADE`;
    await connection`ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_User_id_fk" CASCADE`;
    await connection`ALTER TABLE "Document" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_fkey" CASCADE`;
    await connection`ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_User_id_fk" CASCADE`;
    await connection`ALTER TABLE "Suggestion" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Message_v2" DROP CONSTRAINT IF EXISTS "Message_v2_chatId_fkey" CASCADE`;
    await connection`ALTER TABLE "Message_v2" ALTER COLUMN "id" TYPE text USING "id"::text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Vote_v2" DROP CONSTRAINT IF EXISTS "Vote_v2_messageId_fkey" CASCADE`;
    await connection`ALTER TABLE "Vote_v2" ALTER COLUMN "messageId" TYPE text USING "messageId"::text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Stream" ALTER COLUMN "id" TYPE text USING "id"::text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  // Colonnes UserMemory introduites par le schéma Drizzle sans migration
  // (migration 0031). Répétées ici pour que les environnements dont le
  // journal de migrations est incomplet disposent malgré tout du schéma
  // attendu par lib/db/queries.ts — sinon GET /api/memory échoue en 42703.
  try {
    await connection`ALTER TABLE "UserMemory" ADD COLUMN IF NOT EXISTS "isEnabled" boolean DEFAULT true NOT NULL`;
    await connection`ALTER TABLE "UserMemory" ADD COLUMN IF NOT EXISTS "isImportant" boolean DEFAULT false NOT NULL`;
    await connection`ALTER TABLE "UserMemory" ADD COLUMN IF NOT EXISTS "tags" json DEFAULT '[]'::json NOT NULL`;
    await connection`ALTER TABLE "UserMemory" DROP COLUMN IF EXISTS "category"`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Colonnes NOT NULL dont le défaut a disparu (drift de schéma) : sans
  // réparation, saveChat/saveMessages échouent en production et le modèle IA
  // n'est jamais appelé. Même liste que lib/db/queries.ts (ensureColumnDefaults).
  const requiredColumnDefaults: Array<{ column: string; table: string }> = [
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
  for (const { column, table } of requiredColumnDefaults) {
    try {
      await connection.unsafe(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT now()`
      );
    } catch (error) {
      // Table absente : la migration drizzle qui suit la créera.
      noteIgnoredStep(error);
    }
  }

  // Modèles installés (migration 0019). Répété ici pour que les environnements
  // dont le journal de migrations est incomplet disposent malgré tout du lien
  // stable vers le modèle d'origine (slug) et de l'unicité par utilisateur.
  try {
    await connection`ALTER TABLE "Skill" DROP CONSTRAINT IF EXISTS "Skill_templateId_fkey"`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Skill" ALTER COLUMN "templateId" TYPE text USING "templateId"::text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "Skill_userId_templateId_key" ON "Skill" ("userId", "templateId") WHERE "templateId" IS NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "templateId" text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "McpServer_userId_templateId_key" ON "McpServer" ("userId", "templateId") WHERE "templateId" IS NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Espace Agent — mode de conversation (migration 0016). Répété ici pour que
  // les environnements dont le journal de migrations est incomplet disposent
  // malgré tout de la colonne, sans casser l'exécution.
  try {
    await connection`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "mode" VARCHAR(10) DEFAULT 'chat' NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Chat_userId_mode_idx" ON "Chat" ("userId", "mode")`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Clarification interactive Agent (migration 0018). Répété ici pour les
  // environnements dont le journal de migrations est incomplet : la demande
  // d'information doit toujours pouvoir être persistée.
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "AgentUserInputRequest" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "runId" UUID NOT NULL REFERENCES "AgentRun" ("id") ON DELETE CASCADE,
        "chatId" UUID NOT NULL,
        "stepId" UUID,
        "toolExecutionId" UUID,
        "toolCallId" TEXT NOT NULL,
        "toolId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "context" TEXT,
        "questions" JSONB NOT NULL,
        "questionsHash" VARCHAR(64) NOT NULL,
        "status" VARCHAR(12) DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending','answered','expired','cancelled')),
        "revision" INTEGER DEFAULT 0 NOT NULL,
        "answers" JSONB,
        "answeredBy" TEXT,
        "answeredAt" TIMESTAMP,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "AgentUserInputRequest_toolExecutionId_key" ON "AgentUserInputRequest" ("toolExecutionId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "ApprovalRequest" ADD COLUMN IF NOT EXISTS "toolCallId" TEXT`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "AgentStep" DROP CONSTRAINT IF EXISTS "AgentStep_type_check"`;
    await connection`ALTER TABLE "AgentStep" ADD CONSTRAINT "AgentStep_type_check" CHECK ("type" IN ('planning', 'tool_call', 'tool_result', 'artifact', 'message', 'verification', 'error', 'user_input_request', 'user_input_answer', 'approval_request'))`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "projectId" UUID REFERENCES "Project" ("id") ON DELETE SET NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Document_projectId_idx" ON "Document" ("projectId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Notifications & nouveautés — tables idempotentes
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "userId" text NOT NULL,
        "type" varchar NOT NULL CHECK ("type" IN ('ai_response','project_created','mcp_created','mcp_access_request','news')),
        "title" text NOT NULL,
        "body" text,
        "link" text,
        "isRead" boolean DEFAULT false NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification" USING btree ("userId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification" USING btree ("createdAt" DESC)`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification" USING btree ("userId","isRead")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Notification_userId_type_idx" ON "Notification" USING btree ("userId","type")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  // Migration 0063 : notifications unifiées (mAI + Vibe + Wakies).
  // `origin` identifie l'application productrice, `sourceId` l'événement dans
  // sa source, `sourceMeta` la charge utile propre à cette source. L'index
  // unique PARTIEL rend la réplication idempotente : il porte `sourceId IS
  // NOT NULL`, parce que les notifications natives de mAI n'en ont pas.
  try {
    await connection`ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "origin" varchar(20) DEFAULT 'mai' NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "sourceId" text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "sourceMeta" jsonb`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "Notification_origin_sourceId_key" ON "Notification" USING btree ("origin","sourceId") WHERE "sourceId" IS NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Notification_userId_origin_createdAt_idx" ON "Notification" USING btree ("userId","origin","createdAt")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "user_notification_prefs" (
        "userId" text PRIMARY KEY NOT NULL,
        "enabled" boolean DEFAULT false NOT NULL,
        "aiResponse" boolean DEFAULT true NOT NULL,
        "projectCreated" boolean DEFAULT true NOT NULL,
        "mcpCreated" boolean DEFAULT true NOT NULL,
        "mcpAccessRequest" boolean DEFAULT true NOT NULL,
        "news" boolean DEFAULT true NOT NULL,
        "regenerateMode" varchar DEFAULT 'truncate' NOT NULL CHECK ("regenerateMode" IN ('truncate','fork')),
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "regenerateMode" varchar DEFAULT 'truncate' NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Projets partagés (migration 0020) : membres, invitations et fichiers.
  // Répété ici (convention du dépôt) pour les environnements dont le journal
  // de migrations est incomplet.
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "ProjectMember" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "projectId" UUID NOT NULL REFERENCES "Project" ("id") ON DELETE CASCADE,
        "role" VARCHAR DEFAULT 'member' NOT NULL,
        "userId" TEXT NOT NULL,
        "invitedBy" TEXT,
        "joinedAt" TIMESTAMP DEFAULT now() NOT NULL
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMember_projectId_userId_key" ON "ProjectMember" ("projectId", "userId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "ProjectMember_projectId_idx" ON "ProjectMember" ("projectId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "ProjectMember_userId_idx" ON "ProjectMember" ("userId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "ProjectInvite" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "projectId" UUID NOT NULL REFERENCES "Project" ("id") ON DELETE CASCADE,
        "code" TEXT NOT NULL,
        "createdBy" TEXT NOT NULL,
        "maxUses" INTEGER,
        "useCount" INTEGER DEFAULT 0 NOT NULL,
        "expiresAt" TIMESTAMP,
        "revokedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "ProjectInvite_code_key" ON "ProjectInvite" ("code")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "ProjectInvite_projectId_idx" ON "ProjectInvite" ("projectId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "ProjectInvite_one_active_per_project_key" ON "ProjectInvite" ("projectId") WHERE "revokedAt" IS NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "ProjectFile" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "projectId" UUID NOT NULL REFERENCES "Project" ("id") ON DELETE CASCADE,
        "fileName" TEXT NOT NULL,
        "contentType" TEXT DEFAULT 'application/octet-stream' NOT NULL,
        "fileSize" INTEGER,
        "uploadedBy" TEXT NOT NULL,
        "fileRef" TEXT,
        "storageUrl" TEXT NOT NULL,
        "extractionStatus" VARCHAR DEFAULT 'pending' NOT NULL,
        "extractedText" TEXT,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "ProjectFile_projectId_createdAt_idx" ON "ProjectFile" ("projectId", "createdAt")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_type_check"`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "Notification" ADD CONSTRAINT "Notification_type_check" CHECK ("type" IN ('ai_response','project_created','mcp_created','mcp_access_request','news','planning_task_completed','quota_warning','agent_run_finished','agent_run_failed','agent_approval_required','agent_user_input_required','project_member_joined','vibe_like','vibe_repost','vibe_reply','vibe_mention','vibe_quote','vibe_follow','vibe_dm','vibe_ai_digest','vibe_system','wakies_reply'))`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Visibilité de la liste de tâches (migration 0028). Répété ici, comme les
  // autres, pour les environnements dont le journal de migrations est incomplet :
  // sans cette colonne, l'interface ne peut plus distinguer un run où
  // l'utilisateur a activé « Tâches » d'un run où le plan est interne.
  try {
    await connection`ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "tasksEnabled" boolean DEFAULT false NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Préférence de mode d'écran + niveaux de réflexion réels (migration 0030).
  // Répété ici pour la même raison que ci-dessus, avec une attention
  // particulière : la contrainte CHECK de 0016 n'admet que low/medium/high et
  // rejeterait l'écriture d'un niveau « max » parfaitement valide. L'élargir
  // est donc un prérequis, pas une confortabilité.
  try {
    await connection`ALTER TABLE "AgentSettings" ADD COLUMN IF NOT EXISTS "defaultMode" VARCHAR(10) DEFAULT 'chat' NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "AgentSettings" DROP CONSTRAINT IF EXISTS "AgentSettings_reasoningLevel_check"`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "AgentRun" DROP CONSTRAINT IF EXISTS "AgentRun_reasoningLevel_check"`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "UsageEvent" ADD COLUMN IF NOT EXISTS "reasoningTokens" INTEGER DEFAULT 0 NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Lien vers la conversation pour la page Statistiques (migration 0033).
  // Répété ici pour la même raison que ci-dessus. La colonne reste VOLATILE
  // pour le métier : si l'ALTER échoue, `recordTokenUsage` continue d'écrire
  // ce qu'il écrivait avant et la page Statistiques lit `COALESCE` côté
  // requête. Le débit de quota, lui, ne doit JAMAIS dépendre de cette colonne :
  // c'est le chemin critique, et une colonne NOT NULL le ferait échouer.
  try {
    await connection`ALTER TABLE "UsageEvent" ADD COLUMN IF NOT EXISTS "chatId" uuid`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  // Backfill Chat : le chatId est le 2e segment de la clé d'idempotence
  // `chat:<chatId>:<messageId>:<model>`. Le motif n'accepte qu'un uuid
  // canonique, donc le cast ne peut pas lever 22P02 (code non toléré) sur une
  // clé mal formée. `IS NULL` rend la reprise sans objet une fois rempli.
  try {
    await connection`
      UPDATE "UsageEvent"
         SET "chatId" = split_part("id", ':', 2)::uuid
       WHERE "chatId" IS NULL
         AND "id" ~ '^chat:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}:'
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  // Backfill Agent : `agent:<runId>:<revision>` → `AgentRun.chatId` (NOT NULL).
  // Gardé par `to_regclass` car `AgentRun` peut manquer sur un environnement
  // de schéma partiel ; le `::text` évite tout cast de type.
  try {
    await connection`
      DO $$
      BEGIN
        IF to_regclass('public."UsageEvent"') IS NOT NULL
           AND to_regclass('public."AgentRun"') IS NOT NULL
        THEN
          UPDATE "UsageEvent" u
             SET "chatId" = r."chatId"
            FROM "AgentRun" r
           WHERE u."chatId" IS NULL
             AND u."id" LIKE 'agent:%'
             AND r."id"::text = split_part(u."id", ':', 2);
        END IF;
      END $$
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  // Sans cet index, chaque filtre « projet » ou « conversation » déclenche un
  // seq scan sur `UsageEvent` ; il est donc requis, pas confortable.
  try {
    await connection`CREATE INDEX IF NOT EXISTS "UsageEvent_chatId_idx" ON "UsageEvent" ("chatId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Attribution figée d'un comptage de tokens (migration 0035). Répété ici pour
  // la même raison que ci-dessus : `recordTokenUsage` descend d'un palier sur un
  // 42703, donc la page doit pouvoir compter sur les colonnes sans que leur
  // absence casse quoi que ce soit. Le backfill ne touche que les
  // conversations ENCORE PRÉSENTES : une conversation supprimée n'a plus de
  // mode à recopier, et ces lignes restent simplement non attribuables — elles
  // sont comptées dans les totaux et signalées par `warnings`.
  try {
    await connection`ALTER TABLE "UsageEvent" ADD COLUMN IF NOT EXISTS "chatMode" varchar(16)`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "UsageEvent" ADD COLUMN IF NOT EXISTS "chatProjectId" uuid`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      DO $$
      BEGIN
        IF to_regclass('public."UsageEvent"') IS NOT NULL
           AND to_regclass('public."Chat"') IS NOT NULL
        THEN
          UPDATE "UsageEvent" u
             SET "chatMode" = c."mode",
                 "chatProjectId" = c."projectId"
            FROM "Chat" c
           WHERE u."chatId" = c."id"
             AND (u."chatMode" IS NULL OR u."chatProjectId" IS NULL);
        END IF;
      END $$
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "UsageEvent_userId_chatMode_createdAt_idx" ON "UsageEvent" ("userId", "chatMode", "createdAt")`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Journal des appels d'outils du chemin Chat (migration 0036). `runId` doit
  // devenir nullable, sinon la table refuse structurellement toute exécution
  // qui n'appartient pas à un run Agent — et la page Statistiques ne peut plus
  // compter les plugins utilisés en mode Chat. C'est une RELAXATION : aucune
  // donnée n'est touchée, et la clé étrangère est conservée.
  try {
    await connection`ALTER TABLE "ToolExecution" ALTER COLUMN "runId" DROP NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "ToolExecution" ADD COLUMN IF NOT EXISTS "chatId" uuid`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "ToolExecution" ADD COLUMN IF NOT EXISTS "userId" text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "ToolExecution_userId_createdAt_idx" ON "ToolExecution" ("userId", "createdAt")`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Note sur `0014_notifications_and_memory.sql` : ce fichier n'a AUCUNE entrée
  // dans `meta/_journal.json`, donc `migrate()` ne l'applique pas — et c'est
  // volontaire. Sa contrainte `Notification_type_check` énumère sept types ; le
  // bloc plus haut dans ce fichier pose la même contrainte avec douze types, en
  // réparation exécutée AVANT les migrations Drizzle. Journaliser 0014 la ferait
  // passer après, donc la rétrécirait, et les notifications d'Agent
  // (`agent_run_finished`, `agent_approval_required`…) seraient refusées en base.
  // Le contrôle `tests/unit/migrations-journal.test.ts` liste ce fichier comme
  // orphelin assumé : ne pas le « réparer » sans lire ce paragraphe.
  //
  // Migration 0040 : colonne dédiée key_name pour mprojects_api_keys
  try {
    await connection`ALTER TABLE IF EXISTS "mprojects_api_keys" ADD COLUMN IF NOT EXISTS "key_name" text`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      DO $$
      BEGIN
        IF to_regclass('public."mprojects_api_keys"') IS NOT NULL THEN
          UPDATE "mprojects_api_keys"
          SET "key_name" = "plan"
          WHERE "key_name" IS NULL AND "plan" IS NOT NULL AND "plan" <> '';
        END IF;
      END $$;
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Migration 0044 : vie sociale Wakies (profils, amis, groupes, épingles,
  // réactions). Répété ici pour les environnements au journal incomplet :
  // sans ces colonnes, la recherche globale, les groupes et la bande
  // « Épinglés » répondent 500.
  try {
    await connection`ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "isPublic" boolean DEFAULT false NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "handle" varchar(30)`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "WakiesWakieProfile" (
        "wakieId" UUID PRIMARY KEY NOT NULL REFERENCES "WakiesWakie" ("id") ON DELETE CASCADE,
        "bio" TEXT DEFAULT '' NOT NULL,
        "avatarPath" TEXT,
        "bannerPath" TEXT,
        "links" JSONB DEFAULT '[]'::jsonb NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT now() NOT NULL
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "WakiesWakieImage" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "wakieId" UUID NOT NULL REFERENCES "WakiesWakie" ("id") ON DELETE CASCADE,
        "blobPathname" TEXT NOT NULL,
        "alt" TEXT DEFAULT '' NOT NULL,
        "position" INTEGER DEFAULT 0 NOT NULL,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "WakiesWakieImage_wakieId_position_idx" ON "WakiesWakieImage" ("wakieId", "position")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "WakiesFriend" (
        "subscriberUserId" TEXT NOT NULL,
        "wakieId" UUID NOT NULL REFERENCES "WakiesWakie" ("id") ON DELETE CASCADE,
        "ownerUserId" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
        PRIMARY KEY ("subscriberUserId", "wakieId")
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "WakiesWakie_handle_key" ON "WakiesWakie" ("handle") WHERE "handle" IS NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "WakiesWakie_isPublic_idx" ON "WakiesWakie" ("isPublic") WHERE "isPublic" = true`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "WakiesFriend_subscriber_idx" ON "WakiesFriend" ("subscriberUserId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "WakiesFriend_wakie_idx" ON "WakiesFriend" ("wakieId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "isGroup" boolean DEFAULT false NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "WakiesConversationMember" (
        "conversationId" UUID NOT NULL REFERENCES "WakiesConversation" ("id") ON DELETE CASCADE,
        "wakieId" UUID NOT NULL REFERENCES "WakiesWakie" ("id") ON DELETE CASCADE,
        "isOrganizer" BOOLEAN DEFAULT false NOT NULL,
        "joinedAt" TIMESTAMP DEFAULT now() NOT NULL,
        PRIMARY KEY ("conversationId", "wakieId")
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "WakiesConversationMember_wakieId_idx" ON "WakiesConversationMember" ("wakieId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "WakiesMessage" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "WakiesMessage" ADD COLUMN IF NOT EXISTS "pinnedAt" timestamp`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "WakiesMessage_conversationId_pinned_idx" ON "WakiesMessage" ("conversationId", "pinned")`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "WakiesMessageReaction" (
        "messageId" TEXT NOT NULL REFERENCES "WakiesMessage" ("id") ON DELETE CASCADE,
        "emoji" VARCHAR(16) NOT NULL,
        "byWakieId" uuid REFERENCES "WakiesWakie" ("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
        PRIMARY KEY ("messageId", "emoji", "byWakieId")
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "WakiesMessageReaction_messageId_idx" ON "WakiesMessageReaction" ("messageId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Migration 0047 : persona PUBLIÉE d'un Wakie et provenance d'un clone.
  // Répété ici pour les environnements au journal incomplet : sans
  // `publicPersona`, la requête de lecture la plus large de l'annuaire
  // sélectionne une colonne absente et répond 500 — la recherche globale, les
  // fiches publiques et le clonage tombent d'un coup.
  try {
    await connection`ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "publicPersona" text DEFAULT '' NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "clonedFromWakieId" uuid REFERENCES "WakiesWakie" ("id") ON DELETE SET NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Migration 0048 : curseur de lecture des conversations (non-lus). Répété
  // ici pour les environnements au journal incomplet : `listConversations`
  // sélectionne toute la ligne, donc une colonne absente fait répondre 500 au
  // premier chargement de /wakies — l'application entière, pas seulement le
  // compteur de non-lus.
  try {
    await connection`ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "lastReadSeq" integer DEFAULT 0 NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "WakiesConversation_userId_lastRead_idx" ON "WakiesConversation" ("userId", "lastReadSeq")`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Migration 0052 : fencing des tâches planifiées Wakies. Répété ici pour les
  // environnements au journal incomplet : sans `attempt` ni `claimedBy`, le claim
  // échoue en 42703 et plus aucune tâche récurrente ne démarre — l'échec est
  // silencieux côté utilisateur, le tick ne répond qu'un compteur à zéro.
  try {
    await connection`ALTER TABLE IF EXISTS "WakiesTask" ADD COLUMN IF NOT EXISTS "attempt" integer DEFAULT 0 NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE IF EXISTS "WakiesTask" ADD COLUMN IF NOT EXISTS "claimedBy" varchar(128)`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "WakiesTask_status_leaseUntil_idx" ON "WakiesTask" ("status", "leaseUntil")`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Migration 0057 : Effort de réflexion global et surcharge Agent nullable.
  try {
    await connection`ALTER TABLE IF EXISTS "user_preferences" ADD COLUMN IF NOT EXISTS "reasoningLevel" varchar(10) DEFAULT 'medium' NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      DO $$ BEGIN
        ALTER TABLE IF EXISTS "AgentSettings" ALTER COLUMN "reasoningLevel" DROP NOT NULL;
        ALTER TABLE IF EXISTS "AgentSettings" ALTER COLUMN "reasoningLevel" DROP DEFAULT;
      EXCEPTION
        WHEN undefined_column THEN NULL;
      END $$;
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE IF EXISTS "openrouter_models" ADD COLUMN IF NOT EXISTS "type" varchar(20) DEFAULT 'chat' NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE IF EXISTS "openrouter_models" ADD COLUMN IF NOT EXISTS "fournisseur" varchar(50) DEFAULT 'openrouter' NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  // Migration 0062 : préférences de recherche mAI Search. Elles sont lues à
  // chaque chargement de la page des paramètres ET par la route de
  // recherche : sans elles, la lecture des préférences échoue en 42703 et
  // toute la page tombe.
  try {
    await connection`ALTER TABLE IF EXISTS "user_preferences" ADD COLUMN IF NOT EXISTS "searchLanguage" varchar(10) DEFAULT 'fr' NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE IF EXISTS "user_preferences" ADD COLUMN IF NOT EXISTS "searchResultCount" integer DEFAULT 10 NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE IF EXISTS "user_preferences" ADD COLUMN IF NOT EXISTS "searchSafetyLevel" varchar(20) DEFAULT 'medium' NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE IF EXISTS "user_preferences" ADD COLUMN IF NOT EXISTS "searchSources" jsonb DEFAULT '["web","news","images","videos","wikipedia"]'::jsonb NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  // Migration 0065 : le réglage qui décide si une alerte Wakies est produite.
  try {
    await connection`ALTER TABLE IF EXISTS "WakiesSettings" ADD COLUMN IF NOT EXISTS "replyAlertsEnabled" boolean DEFAULT true NOT NULL`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`ALTER TABLE IF EXISTS "openrouter_models" DROP CONSTRAINT IF EXISTS "openrouter_models_provider_check"`;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "MaiSearchQuery" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "userId" text NOT NULL,
        "query" text NOT NULL,
        "resultsCount" integer DEFAULT 0 NOT NULL,
        "summary" text,
        "vote" varchar(10),
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }

  // Migration 0064 : réglages du jeu Blackline, par compte. Répété ici pour
  // les environnements au journal incomplet : sans cette table, la lecture
  // des réglages échoue en 42P01 et /blackline retombe sur les réglages
  // locaux — silencieusement, et sans que l'utilisateur sache pourquoi.
  try {
    await connection`
      CREATE TABLE IF NOT EXISTS "BlacklineSettings" (
        "userId" text PRIMARY KEY NOT NULL,
        "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL
      )
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'BlacklineSettings_settings_object_check'
        ) THEN
          ALTER TABLE "BlacklineSettings"
            ADD CONSTRAINT "BlacklineSettings_settings_object_check"
            CHECK (jsonb_typeof("settings") = 'object');
        END IF;
      END $$;
    `;
  } catch (error) {
    noteIgnoredStep(error);
  }
  try {
    await connection`CREATE INDEX IF NOT EXISTS "BlacklineSettings_userId_idx" ON "BlacklineSettings" ("userId")`;
  } catch (error) {
    noteIgnoredStep(error);
  }

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  if (unexpectedStepErrors.length > 0) {
    console.error(
      `\n✖ ${unexpectedStepErrors.length} étape(s) de réparation en échec inattendu · les migrations Drizzle se sont terminées, mais l'état du schéma n'est PAS celui attendu :`
    );
    for (const entry of unexpectedStepErrors) {
      console.error(`  - ${entry}`);
    }
    if (process.env.MIGRATIONS_STRICT === "false") {
      console.error(
        "MIGRATIONS_STRICT=false : échec toléré explicitement par l'exploitant."
      );
    } else {
      throw new Error(
        "Migration incomplète : des étapes de réparation ont échoué (voir la liste ci-dessus)."
      );
    }
  }

  console.log("Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("Migration failed");
  console.error(err);
  process.exit(1);
});
