-- Migration 0016 : espace Agent (runs, steps, exécutions d'outils, réglages).
-- Idempotente : ALTER ... IF NOT EXISTS / CREATE ... IF NOT EXISTS.
-- La colonne Chat.mode distingue une conversation Chat d'une conversation Agent
-- sans dupliquer l'historique, la sidebar, les projets ni les streams.

ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "mode" VARCHAR(10) DEFAULT 'chat' NOT NULL;
CREATE INDEX IF NOT EXISTS "Chat_userId_mode_idx" ON "Chat" ("userId", "mode");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AgentRun" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" UUID NOT NULL REFERENCES "Chat" ("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "messageId" TEXT,
  "model" TEXT NOT NULL,
  "reasoningLevel" VARCHAR(10) DEFAULT 'medium' NOT NULL CHECK ("reasoningLevel" IN ('low', 'medium', 'high')),
  "autonomy" VARCHAR(12) DEFAULT 'standard' NOT NULL CHECK ("autonomy" IN ('careful', 'standard', 'high')),
  "status" VARCHAR(24) DEFAULT 'queued' NOT NULL CHECK ("status" IN ('queued', 'running', 'waiting_for_tool', 'waiting_for_approval', 'waiting_for_user', 'completed', 'failed', 'cancelled')),
  "plan" JSONB,
  "budget" JSONB DEFAULT '{}' NOT NULL,
  "toolPolicySnapshot" JSONB DEFAULT '{}' NOT NULL,
  "usage" JSONB DEFAULT '{}' NOT NULL,
  "stepCount" INTEGER DEFAULT 0 NOT NULL,
  "toolCallCount" INTEGER DEFAULT 0 NOT NULL,
  "error" TEXT,
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "AgentRun_chatId_idx" ON "AgentRun" ("chatId");
CREATE INDEX IF NOT EXISTS "AgentRun_userId_status_idx" ON "AgentRun" ("userId", "status");
CREATE INDEX IF NOT EXISTS "AgentRun_createdAt_idx" ON "AgentRun" ("createdAt");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AgentStep" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "runId" UUID NOT NULL REFERENCES "AgentRun" ("id") ON DELETE CASCADE,
  "index" INTEGER DEFAULT 0 NOT NULL,
  "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('planning', 'tool_call', 'tool_result', 'artifact', 'message', 'verification', 'error')),
  "status" VARCHAR(16) DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "toolExecutionId" UUID,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "completedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AgentStep_runId_index_idx" ON "AgentStep" ("runId", "index");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ToolExecution" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "runId" UUID NOT NULL REFERENCES "AgentRun" ("id") ON DELETE CASCADE,
  "stepId" UUID,
  "toolId" TEXT NOT NULL,
  "category" VARCHAR(20) DEFAULT 'internal' NOT NULL CHECK ("category" IN ('web', 'files', 'library', 'project', 'internal', 'artifact', 'plugins', 'mcp', 'skills')),
  "input" JSONB,
  "output" JSONB,
  "status" VARCHAR(16) DEFAULT 'running' NOT NULL CHECK ("status" IN ('running', 'completed', 'failed', 'denied', 'cancelled')),
  "approvalStatus" VARCHAR(16) DEFAULT 'not_required' NOT NULL CHECK ("approvalStatus" IN ('not_required', 'pending', 'approved', 'denied')),
  "error" TEXT,
  "durationMs" INTEGER,
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "ToolExecution_runId_idx" ON "ToolExecution" ("runId");
CREATE INDEX IF NOT EXISTS "ToolExecution_toolId_idx" ON "ToolExecution" ("toolId");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AgentSettings" (
  "userId" TEXT PRIMARY KEY NOT NULL,
  "defaultModel" TEXT,
  "reasoningLevel" VARCHAR(10) DEFAULT 'medium' NOT NULL CHECK ("reasoningLevel" IN ('low', 'medium', 'high')),
  "autonomy" VARCHAR(12) DEFAULT 'standard' NOT NULL CHECK ("autonomy" IN ('careful', 'standard', 'high')),
  "toolPolicies" JSONB DEFAULT '{}' NOT NULL,
  "enabledCategories" JSONB DEFAULT '[]' NOT NULL,
  "defaultProjectId" UUID,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
