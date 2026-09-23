-- Préserve les historiques. Les anciennes lignes actives surnuméraires sont
-- closes explicitement avant les contraintes ; aucune étape n'est effacée.
--> statement-breakpoint
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "parentRunId" uuid;
--> statement-breakpoint
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "stopReason" text;
--> statement-breakpoint
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "executionOwner" text;
--> statement-breakpoint
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "executionLeaseUntil" timestamp;
--> statement-breakpoint
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "useful" boolean;
--> statement-breakpoint
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "goalReached" boolean;
--> statement-breakpoint
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "feedbackAt" timestamp;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentRun_parentRunId_fkey') THEN
    ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_parentRunId_fkey"
      FOREIGN KEY ("parentRunId") REFERENCES "AgentRun"("id") ON DELETE SET NULL;
  END IF;
END $$;
--> statement-breakpoint
WITH ranked AS (
  SELECT "id", row_number() OVER (PARTITION BY "chatId" ORDER BY "createdAt" DESC, "id" DESC) AS rn
  FROM "AgentRun"
  WHERE "status" IN ('queued', 'running', 'waiting_for_tool', 'waiting_for_approval', 'waiting_for_user')
)
UPDATE "AgentRun" SET "status" = 'failed', "stopReason" = 'migration_duplicate_active',
  "error" = 'Ancien run actif surnuméraire clos pendant la migration.', "completedAt" = now()
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);
--> statement-breakpoint
WITH ranked AS (
  SELECT "id", row_number() OVER (PARTITION BY "chatId", "messageId" ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "AgentRun" WHERE "messageId" IS NOT NULL
)
UPDATE "AgentRun" SET "messageId" = NULL,
  "stopReason" = COALESCE("stopReason", 'migration_duplicate_message')
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "AgentRun_one_active_per_chat_key" ON "AgentRun" ("chatId")
WHERE "status" IN ('queued', 'running', 'waiting_for_tool', 'waiting_for_approval', 'waiting_for_user');
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "AgentRun_chat_message_key" ON "AgentRun" ("chatId", "messageId")
WHERE "messageId" IS NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AgentScheduleVersion" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scheduleId" uuid NOT NULL REFERENCES "AgentSchedule"("id") ON DELETE CASCADE,
  "revision" integer NOT NULL,
  "snapshot" jsonb NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "userId" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "AgentScheduleVersion_schedule_revision_key"
ON "AgentScheduleVersion" ("scheduleId", "revision");
--> statement-breakpoint
INSERT INTO "AgentScheduleVersion" ("scheduleId", "revision", "snapshot", "userId")
SELECT "id", "revision", jsonb_build_object(
  'id', "id", 'agentId', "agentId", 'config', "config", 'createdAt', "createdAt",
  'deletedAt', "deletedAt", 'instructions', "instructions", 'lastError', "lastError",
  'lastRunAt', "lastRunAt", 'modelId', "modelId", 'nextDueAt', "nextDueAt",
  'projectId', "projectId", 'revision', "revision", 'rule', "rule",
  'status', "status", 'timezone', "timezone", 'title', "title",
  'updatedAt', "updatedAt", 'userId', "userId"), "userId"
FROM "AgentSchedule"
ON CONFLICT ("scheduleId", "revision") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "AgentScheduleOccurrence" ADD COLUMN IF NOT EXISTS "scheduleVersionId" uuid REFERENCES "AgentScheduleVersion"("id") ON DELETE SET NULL;
