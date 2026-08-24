-- Migration: Projects + Chat extensions + token_blacklist + user_totp
-- Idempotent: uses IF NOT EXISTS / DO blocks

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Project" (
  "color" varchar(7) DEFAULT '#6366f1',
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "description" text DEFAULT '',
  "icon" text DEFAULT '📁',
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "isArchived" boolean DEFAULT false NOT NULL,
  "name" text NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "userId" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='projectId') THEN
    ALTER TABLE "Chat" ADD COLUMN "projectId" uuid REFERENCES "Project"("id") ON DELETE SET NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='isArchived') THEN
    ALTER TABLE "Chat" ADD COLUMN "isArchived" boolean DEFAULT false NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='archivedAt') THEN
    ALTER TABLE "Chat" ADD COLUMN "archivedAt" timestamp;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='pinned') THEN
    ALTER TABLE "Chat" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='tags') THEN
    ALTER TABLE "Chat" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='customInstructions') THEN
    ALTER TABLE "Chat" ADD COLUMN "customInstructions" text;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='temperatureOverride') THEN
    ALTER TABLE "Chat" ADD COLUMN "temperatureOverride" double precision;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='modeId') THEN
    ALTER TABLE "Chat" ADD COLUMN "modeId" varchar(20) DEFAULT 'standard';
  END IF;
END $$;
--> statement-breakpoint
-- Document: ensure kind supports html (varchar text column). No enum type, just check constraint if exists.
DO $$ BEGIN
  -- Drop old check if exists (name varies between drizzle versions)
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_text_check' AND conrelid = '"Document"'::regclass) THEN
    ALTER TABLE "Document" DROP CONSTRAINT "Document_text_check";
  END IF;
  -- Also try generic constraint that drizzle may have named differently
  BEGIN
    ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_text_check1";
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
--> statement-breakpoint
-- Recreate check with html included (idempotent: drop if exists then add)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_text_check' AND conrelid = '"Document"'::regclass) THEN
    ALTER TABLE "Document" ADD CONSTRAINT "Document_text_check" CHECK ("text" IN ('text','code','image','sheet','html'));
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_blacklist" (
  "expires_at" timestamp DEFAULT now() NOT NULL,
  "revoked_at" timestamp DEFAULT now() NOT NULL,
  "token" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_totp" (
  "backup_codes" text[] DEFAULT '{}' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "secret" text NOT NULL,
  "user_id" text PRIMARY KEY NOT NULL,
  "verified" boolean DEFAULT false NOT NULL,
  "verified_at" timestamp
);
--> statement-breakpoint
-- Users extensions (Val Town users table lives in same Neon DB)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='custom_instructions') THEN
      ALTER TABLE "users" ADD COLUMN "custom_instructions" text DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='custom_instructions_enabled') THEN
      ALTER TABLE "users" ADD COLUMN "custom_instructions_enabled" boolean DEFAULT false NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_temperature') THEN
      ALTER TABLE "users" ADD COLUMN "default_temperature" double precision DEFAULT 0.7;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_top_p') THEN
      ALTER TABLE "users" ADD COLUMN "default_top_p" double precision DEFAULT 0.9;
    END IF;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Chat_projectId_idx" ON "Chat" USING btree ("projectId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Chat_tags_gin_idx" ON "Chat" USING gin ("tags");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Chat_userId_isArchived_idx" ON "Chat" USING btree ("userId","isArchived");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Chat_userId_createdAt_desc_idx" ON "Chat" USING btree ("userId","createdAt" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Chat_userId_pinned_idx" ON "Chat" USING btree ("userId","pinned");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Chat_userId_projectId_idx" ON "Chat" USING btree ("userId","projectId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Project_userId_createdAt_idx" ON "Project" USING btree ("userId","createdAt" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_blacklist_expires_at_idx" ON "token_blacklist" USING btree ("expires_at");
--> statement-breakpoint
-- Backfill: clean old blacklisted tokens older than 14 days
DELETE FROM "token_blacklist" WHERE "expires_at" < now() OR "revoked_at" < now() - interval '14 days';
