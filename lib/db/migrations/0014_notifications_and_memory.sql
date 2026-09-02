-- Migration 0014: Nouvelles notifications (planning_task_completed, quota_warning)
-- Idempotent: DO blocks avec ALTER TABLE

--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Notification_type_check'
  ) THEN
    ALTER TABLE "Notification" DROP CONSTRAINT "Notification_type_check";
  END IF;

  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_type_check" 
    CHECK ("type" IN ('ai_response', 'project_created', 'mcp_created', 'mcp_access_request', 'news', 'planning_task_completed', 'quota_warning'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_notification_prefs' AND column_name='planningTaskCompleted') THEN
    ALTER TABLE "user_notification_prefs" ADD COLUMN "planningTaskCompleted" boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_notification_prefs' AND column_name='quotaWarning') THEN
    ALTER TABLE "user_notification_prefs" ADD COLUMN "quotaWarning" boolean DEFAULT true NOT NULL;
  END IF;
END $$;
