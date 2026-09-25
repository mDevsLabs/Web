-- Migration 0026 : répare les écarts de schéma critiques.
-- Idempotente : sûre sur une base déjà partiellement réparée.
-- Ne pas exécuter automatiquement depuis une preview/canary.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_preferences" (
  "customInstructions" text DEFAULT '' NOT NULL,
  "customInstructionsEnabled" boolean DEFAULT false NOT NULL,
  "defaultAgentId" uuid,
  "defaultAudioModel" text DEFAULT 'deepgram/flux-tts:free' NOT NULL,
  "defaultAudioSpeed" double precision DEFAULT 1.0 NOT NULL,
  "defaultAudioVoice" varchar(100) DEFAULT 'flux-alexis-en' NOT NULL,
  "defaultChatModel" text,
  "defaultChatVisibility" varchar(20) DEFAULT 'private' NOT NULL,
  "defaultImageModel" text DEFAULT 'black-forest-labs/flux-schnell' NOT NULL,
  "defaultImageSize" varchar(50) DEFAULT '1024x1024' NOT NULL,
  "defaultTemperature" double precision DEFAULT 0.7 NOT NULL,
  "defaultTopP" double precision DEFAULT 0.9 NOT NULL,
  "ghostMemoryEnabled" boolean DEFAULT false NOT NULL,
  "showAgentChatIcons" boolean DEFAULT true NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "userId" text PRIMARY KEY NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    INSERT INTO "user_preferences" (
      "customInstructions",
      "customInstructionsEnabled",
      "defaultAgentId",
      "defaultAudioModel",
      "defaultAudioSpeed",
      "defaultAudioVoice",
      "defaultChatModel",
      "defaultChatVisibility",
      "defaultImageModel",
      "defaultImageSize",
      "defaultTemperature",
      "defaultTopP",
      "ghostMemoryEnabled",
      "showAgentChatIcons",
      "userId"
    )
    SELECT
      COALESCE(u.custom_instructions, ''),
      COALESCE(u.custom_instructions_enabled, false),
      u.default_agent_id,
      COALESCE(u.default_audio_model, 'deepgram/flux-tts:free'),
      COALESCE(u.default_audio_speed, 1.0),
      COALESCE(u.default_audio_voice, 'flux-alexis-en'),
      u.default_chat_model,
      COALESCE(u.default_chat_visibility, 'private'),
      COALESCE(u.default_image_model, 'black-forest-labs/flux-schnell'),
      COALESCE(u.default_image_size, '1024x1024'),
      COALESCE(u.default_temperature, 0.7),
      COALESCE(u.default_top_p, 0.9),
      COALESCE(u.ghost_memory_enabled, false),
      COALESCE(u.show_agent_chat_icons, true),
      u.id::text
    FROM users u
    ON CONFLICT ("userId") DO NOTHING;
  END IF;
END $$;

--> statement-breakpoint
ALTER TABLE "user_notification_prefs"
  ADD COLUMN IF NOT EXISTS "planningTaskCompleted" boolean DEFAULT true NOT NULL;
ALTER TABLE "user_notification_prefs"
  ADD COLUMN IF NOT EXISTS "quotaWarning" boolean DEFAULT true NOT NULL;

--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Notification_type_check'
      AND table_name = 'Notification'
  ) THEN
    ALTER TABLE "Notification" DROP CONSTRAINT "Notification_type_check";
  END IF;

  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_type_check"
    CHECK ("type" IN (
      'ai_response', 'project_created', 'mcp_created', 'mcp_access_request',
      'news', 'planning_task_completed', 'project_member_joined', 'quota_warning',
      'agent_run_finished', 'agent_run_failed', 'agent_approval_required',
      'agent_user_input_required'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UsageEvent" (
  "id" text PRIMARY KEY NOT NULL,
  "inputTokens" integer DEFAULT 0 NOT NULL,
  "isGhostMode" boolean DEFAULT false NOT NULL,
  "model" text,
  "outputTokens" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "totalTokens" integer DEFAULT 0 NOT NULL,
  "userId" text NOT NULL
);
CREATE INDEX IF NOT EXISTS "UsageEvent_userId_createdAt_idx"
  ON "UsageEvent" ("userId", "createdAt");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Message_v2_chatId_createdAt_id_idx"
  ON "Message_v2" ("chatId", "createdAt", "id");
CREATE INDEX IF NOT EXISTS "Stream_chatId_createdAt_idx"
  ON "Stream" ("chatId", "createdAt");
CREATE INDEX IF NOT EXISTS "ScheduledMessage_userId_status_scheduledAt_idx"
  ON "ScheduledMessage" ("userId", "status", "scheduledAt");
