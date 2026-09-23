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
    await connection`ALTER TABLE "Notification" ADD CONSTRAINT "Notification_type_check" CHECK ("type" IN ('ai_response','project_created','mcp_created','mcp_access_request','news','planning_task_completed','quota_warning','agent_run_finished','agent_run_failed','agent_approval_required','agent_user_input_required','project_member_joined'))`;
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
