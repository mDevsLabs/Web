ALTER TABLE "AgentScheduleOccurrence"
  DROP CONSTRAINT IF EXISTS "AgentScheduleOccurrence_status_check";

ALTER TABLE "AgentScheduleOccurrence"
  ADD CONSTRAINT "AgentScheduleOccurrence_status_check"
  CHECK (
    "status" IN (
      'pending',
      'claimed',
      'running',
      'waiting',
      'completed',
      'failed',
      'skipped'
    )
  );
