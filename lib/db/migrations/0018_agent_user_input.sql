-- Migration 0018 : clarification interactive Agent.
-- Idempotente : CREATE/ALTER ... IF NOT EXISTS, style 0016/0017.
--
-- 1. AgentUserInputRequest : questionnaire posé par un outil d'attente
--    utilisateur, lié au ToolCall exact (toolCallId) et à sa réponse. Le
--    questionnaire affiché est figé par une empreinte canonique : toute
--    modification après présentation invalide la réponse. La réponse est
--    validée côté serveur, puis réinjectée dans le MÊME AgentRun.
-- 2. ApprovalRequest.toolCallId : une approbation par appel d'outil, relue à
--    la reprise sans dépendre de ce que transmet le client.
-- 3. AgentStep.type : deux types dédiés (question posée / réponse reçue) pour
--    que la timeline distingue l'attente, la réponse et la reprise.
-- 4. Document.projectId : rattachement d'un livrable à un projet.

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
  "status" VARCHAR(12) DEFAULT 'pending' NOT NULL
    CHECK ("status" IN ('pending','answered','expired','cancelled')),
  "revision" INTEGER DEFAULT 0 NOT NULL,
  "answers" JSONB,
  "answeredBy" TEXT,
  "answeredAt" TIMESTAMP,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Un appel d'outil ne peut produire qu'une seule demande : la reprise et un
-- éventuel retry relisent la même question au lieu d'en créer une nouvelle.
CREATE UNIQUE INDEX IF NOT EXISTS "AgentUserInputRequest_toolExecutionId_key"
  ON "AgentUserInputRequest" ("toolExecutionId");
CREATE INDEX IF NOT EXISTS "AgentUserInputRequest_runId_status_idx"
  ON "AgentUserInputRequest" ("runId", "status");
CREATE INDEX IF NOT EXISTS "AgentUserInputRequest_chatId_status_idx"
  ON "AgentUserInputRequest" ("chatId", "status");

--> statement-breakpoint

ALTER TABLE "ApprovalRequest" ADD COLUMN IF NOT EXISTS "toolCallId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ApprovalRequest_runId_toolCallId_key"
  ON "ApprovalRequest" ("runId", "toolCallId");

--> statement-breakpoint

-- Types de step dédiés à la clarification interactive (remplacement du CHECK,
-- purement additif : les valeurs existantes restent valides).
ALTER TABLE "AgentStep" DROP CONSTRAINT IF EXISTS "AgentStep_type_check";
ALTER TABLE "AgentStep" ADD CONSTRAINT "AgentStep_type_check"
  CHECK ("type" IN ('planning', 'tool_call', 'tool_result', 'artifact', 'message', 'verification', 'error', 'user_input_request', 'user_input_answer', 'approval_request'));

--> statement-breakpoint

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "projectId" UUID
  REFERENCES "Project" ("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "Document_projectId_idx" ON "Document" ("projectId");
