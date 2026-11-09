-- Migration 0083: Élargissement de la contrainte Notification_type_check pour inclure les notifications Quizzly.
-- Idempotente et sûre à rejouer.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'Notification_type_check'
      AND t.relname = 'Notification'
  ) THEN
    ALTER TABLE "Notification" DROP CONSTRAINT "Notification_type_check";
  END IF;

  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_type_check"
    CHECK ("type" IN (
      'ai_response', 'project_created', 'mcp_created', 'mcp_access_request',
      'news', 'planning_task_completed', 'project_member_joined', 'quota_warning',
      'agent_run_finished', 'agent_run_failed', 'agent_approval_required',
      'agent_user_input_required',
      'vibe_like', 'vibe_repost', 'vibe_reply', 'vibe_mention', 'vibe_quote',
      'vibe_follow', 'vibe_dm', 'vibe_ai_digest', 'vibe_system',
      'wakies_reply',
      'quizzly_reminder', 'quizzly_league', 'quizzly_gift', 'quizzly_streak'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint
