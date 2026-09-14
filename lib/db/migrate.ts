import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
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
  } catch {}
  try {
    await connection`ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_fkey" CASCADE`;
    await connection`ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_User_id_fk" CASCADE`;
    await connection`ALTER TABLE "Document" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
  } catch {}
  try {
    await connection`ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_fkey" CASCADE`;
    await connection`ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_User_id_fk" CASCADE`;
    await connection`ALTER TABLE "Suggestion" ALTER COLUMN "userId" TYPE text USING "userId"::text`;
  } catch {}
  try {
    await connection`ALTER TABLE "Message_v2" DROP CONSTRAINT IF EXISTS "Message_v2_chatId_fkey" CASCADE`;
    await connection`ALTER TABLE "Message_v2" ALTER COLUMN "id" TYPE text USING "id"::text`;
  } catch {}
  try {
    await connection`ALTER TABLE "Vote_v2" DROP CONSTRAINT IF EXISTS "Vote_v2_messageId_fkey" CASCADE`;
    await connection`ALTER TABLE "Vote_v2" ALTER COLUMN "messageId" TYPE text USING "messageId"::text`;
  } catch {}
  try {
    await connection`ALTER TABLE "Stream" ALTER COLUMN "id" TYPE text USING "id"::text`;
  } catch {}
  try {
    await connection`ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`;
  } catch {}

  // Modèles installés (migration 0019). Répété ici pour que les environnements
  // dont le journal de migrations est incomplet disposent malgré tout du lien
  // stable vers le modèle d'origine (slug) et de l'unicité par utilisateur.
  try {
    await connection`ALTER TABLE "Skill" DROP CONSTRAINT IF EXISTS "Skill_templateId_fkey"`;
  } catch {}
  try {
    await connection`ALTER TABLE "Skill" ALTER COLUMN "templateId" TYPE text USING "templateId"::text`;
  } catch {}
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "Skill_userId_templateId_key" ON "Skill" ("userId", "templateId") WHERE "templateId" IS NOT NULL`;
  } catch {}
  try {
    await connection`ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "templateId" text`;
  } catch {}
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "McpServer_userId_templateId_key" ON "McpServer" ("userId", "templateId") WHERE "templateId" IS NOT NULL`;
  } catch {}

  // Espace Agent — mode de conversation (migration 0016). Répété ici pour que
  // les environnements dont le journal de migrations est incomplet disposent
  // malgré tout de la colonne, sans casser l'exécution.
  try {
    await connection`ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "mode" VARCHAR(10) DEFAULT 'chat' NOT NULL`;
  } catch {}
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Chat_userId_mode_idx" ON "Chat" ("userId", "mode")`;
  } catch {}

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
  } catch {}
  try {
    await connection`CREATE UNIQUE INDEX IF NOT EXISTS "AgentUserInputRequest_toolExecutionId_key" ON "AgentUserInputRequest" ("toolExecutionId")`;
  } catch {}
  try {
    await connection`ALTER TABLE "ApprovalRequest" ADD COLUMN IF NOT EXISTS "toolCallId" TEXT`;
  } catch {}
  try {
    await connection`ALTER TABLE "AgentStep" DROP CONSTRAINT IF EXISTS "AgentStep_type_check"`;
    await connection`ALTER TABLE "AgentStep" ADD CONSTRAINT "AgentStep_type_check" CHECK ("type" IN ('planning', 'tool_call', 'tool_result', 'artifact', 'message', 'verification', 'error', 'user_input_request', 'user_input_answer', 'approval_request'))`;
  } catch {}
  try {
    await connection`ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "projectId" UUID REFERENCES "Project" ("id") ON DELETE SET NULL`;
  } catch {}
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Document_projectId_idx" ON "Document" ("projectId")`;
  } catch {}

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
  } catch {}
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification" USING btree ("userId")`;
  } catch {}
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification" USING btree ("createdAt" DESC)`;
  } catch {}
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification" USING btree ("userId","isRead")`;
  } catch {}
  try {
    await connection`CREATE INDEX IF NOT EXISTS "Notification_userId_type_idx" ON "Notification" USING btree ("userId","type")`;
  } catch {}
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
  } catch {}
  try {
    await connection`ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "regenerateMode" varchar DEFAULT 'truncate' NOT NULL`;
  } catch {}

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  console.log("Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("Migration failed");
  console.error(err);
  process.exit(1);
});
