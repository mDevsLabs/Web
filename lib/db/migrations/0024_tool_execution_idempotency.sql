ALTER TABLE "ToolExecution"
  ADD COLUMN IF NOT EXISTS "operationKey" text;

CREATE UNIQUE INDEX IF NOT EXISTS "ToolExecution_runId_operationKey_attempt_key"
  ON "ToolExecution" ("runId", "operationKey", "attempt");
