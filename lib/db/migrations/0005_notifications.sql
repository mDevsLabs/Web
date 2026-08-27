-- Migration: Notifications + User Notification Prefs + Regenerate Mode
-- Idempotent: uses IF NOT EXISTS / DO blocks

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "type" varchar NOT NULL CHECK ("type" IN ('ai_response','project_created','mcp_created','mcp_access_request','news')),
  "title" text NOT NULL,
  "body" text,
  "link" text,
  "isRead" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification" USING btree ("createdAt" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification" USING btree ("userId","isRead");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Notification_userId_type_idx" ON "Notification" USING btree ("userId","type");

--> statement-breakpoint
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
);

--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_notification_prefs' AND column_name='regenerateMode') THEN
    -- ensure check constraint exists even if column added earlier without it
    BEGIN
      ALTER TABLE "user_notification_prefs" ADD CONSTRAINT "user_notification_prefs_regenerateMode_check" CHECK ("regenerateMode" IN ('truncate','fork'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_notification_prefs' AND column_name='regenerateMode') THEN
    ALTER TABLE "user_notification_prefs" ADD COLUMN "regenerateMode" varchar DEFAULT 'truncate' NOT NULL;
  END IF;
END $$;

--> statement-breakpoint
-- For legacy deployments where Notification table existed without type check, ensure constraint
DO $$ BEGIN
  BEGIN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_type_check" CHECK ("type" IN ('ai_response','project_created','mcp_created','mcp_access_request','news'));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
