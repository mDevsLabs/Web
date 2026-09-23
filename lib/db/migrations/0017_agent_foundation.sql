-- Migration 0017 : fondations Agent — tâches planifiées (AgentSchedule +
-- occurrences), approbations persistantes (ApprovalRequest), instructions de
-- réorientation (AgentRunInstruction), colonnes d'exécution et de checkpoint.
-- Idempotente : CREATE/ALTER ... IF NOT EXISTS, style 0016.

-- ---------------------------------------------------------------------------
-- Colonnes ajoutées aux tables existantes
-- ---------------------------------------------------------------------------

ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "checkpoint" JSONB;
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "revision" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "suggestedActions" JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Tentatives d'outils : chaque retry est une ligne liée à sa tentative parente.
ALTER TABLE "ToolExecution" ADD COLUMN IF NOT EXISTS "attempt" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "ToolExecution" ADD COLUMN IF NOT EXISTS "errorCategory" VARCHAR(32);
ALTER TABLE "ToolExecution" ADD COLUMN IF NOT EXISTS "parentExecutionId" UUID;
ALTER TABLE "ToolExecution" ADD COLUMN IF NOT EXISTS "retryAfterMs" INTEGER;
ALTER TABLE "ToolExecution" ADD COLUMN IF NOT EXISTS "retryable" BOOLEAN DEFAULT false NOT NULL;

-- Statut timed_out (limite produit de durée atteinte, travail conservé).
ALTER TABLE "AgentRun" DROP CONSTRAINT IF EXISTS "AgentRun_status_check";
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_status_check"
  CHECK ("status" IN ('queued','running','waiting_for_tool','waiting_for_approval','waiting_for_user','completed','failed','cancelled','timed_out'));

-- Nouveaux types de notification Agent (pattern 0014 : remplacement du CHECK).
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_type_check";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_type_check"
  CHECK ("type" IN ('ai_response','project_created','mcp_created','mcp_access_request','news','planning_task_completed','quota_warning','agent_run_finished','agent_run_failed','agent_approval_required','agent_user_input_required'));

-- Préférences de notification Agent : par type d'événement et par canal.
-- In-app actif par défaut ; email/push désactivés tant que l'infrastructure
-- mAI n'est pas confirmée (aucune clé utilisateur, jamais les connexions Gmail).
ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "agentRunFinished" boolean DEFAULT true NOT NULL;
ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "agentRunFailed" boolean DEFAULT true NOT NULL;
ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "agentApprovalRequired" boolean DEFAULT true NOT NULL;
ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "agentUserInputRequired" boolean DEFAULT true NOT NULL;
ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "agentEmailEnabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "user_notification_prefs" ADD COLUMN IF NOT EXISTS "agentPushEnabled" boolean DEFAULT false NOT NULL;

--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- AgentSchedule : règle en heure LOCALE + fuseau IANA ; suppression logique.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "AgentSchedule" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "instructions" TEXT NOT NULL,
  "rule" JSONB NOT NULL,
  "timezone" VARCHAR(64) NOT NULL,
  "modelId" TEXT NOT NULL,
  "projectId" UUID,
  "agentId" UUID,
  "config" JSONB NOT NULL,
  "status" VARCHAR(10) DEFAULT 'active' NOT NULL CHECK ("status" IN ('active','paused','deleted')),
  "nextDueAt" TIMESTAMP NOT NULL,
  "lastRunAt" TIMESTAMP,
  "lastError" TEXT,
  "revision" INTEGER DEFAULT 0 NOT NULL,
  "deletedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "AgentSchedule_status_nextDueAt_idx" ON "AgentSchedule" ("status", "nextDueAt");
CREATE INDEX IF NOT EXISTS "AgentSchedule_userId_idx" ON "AgentSchedule" ("userId");

--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- AgentScheduleOccurrence : idempotence par contrainte unique, lease anti
-- double-exécution, historique complet (runs passés consultables).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "AgentScheduleOccurrence" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "scheduleId" UUID NOT NULL REFERENCES "AgentSchedule" ("id") ON DELETE CASCADE,
  "dueAt" TIMESTAMP NOT NULL,
  "status" VARCHAR(12) DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending','claimed','running','completed','failed','skipped')),
  "runId" UUID REFERENCES "AgentRun" ("id") ON DELETE SET NULL,
  "claimedAt" TIMESTAMP,
  "claimedBy" VARCHAR(128),
  "leaseUntil" TIMESTAMP,
  "attempt" INTEGER DEFAULT 0 NOT NULL,
  "finishedAt" TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "AgentScheduleOccurrence_scheduleId_dueAt_key" ON "AgentScheduleOccurrence" ("scheduleId", "dueAt");
CREATE INDEX IF NOT EXISTS "AgentScheduleOccurrence_status_leaseUntil_idx" ON "AgentScheduleOccurrence" ("status", "leaseUntil");
CREATE INDEX IF NOT EXISTS "AgentScheduleOccurrence_runId_idx" ON "AgentScheduleOccurrence" ("runId");

--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- ApprovalRequest : approbation persistante liée à un appel d'outil et à SES
-- paramètres exacts (hash canonique) — toute modification de paramètres
-- l'invalide ; l'acceptation/refus reprend le même run depuis son checkpoint.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "runId" UUID NOT NULL REFERENCES "AgentRun" ("id") ON DELETE CASCADE,
  "stepId" UUID,
  "toolExecutionId" UUID,
  "toolId" TEXT NOT NULL,
  "params" JSONB NOT NULL,
  "paramsHash" VARCHAR(64) NOT NULL,
  "status" VARCHAR(10) DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending','approved','denied','expired')),
  "denyReason" TEXT,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "decidedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ApprovalRequest_runId_status_idx" ON "ApprovalRequest" ("runId", "status");

--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- AgentRunInstruction : réorientations ordonnées (seq), appliquées au
-- prochain point sûr ; les étapes déjà exécutées restent dans l'historique.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "AgentRunInstruction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "runId" UUID NOT NULL REFERENCES "AgentRun" ("id") ON DELETE CASCADE,
  "seq" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "stopRequested" BOOLEAN DEFAULT false NOT NULL,
  "status" VARCHAR(10) DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending','applied','discarded')),
  "appliedAt" TIMESTAMP,
  "appliedStepIndex" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "AgentRunInstruction_runId_status_seq_idx" ON "AgentRunInstruction" ("runId", "status", "seq");
