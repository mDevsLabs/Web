-- Migration: Default chat model & default conversation visibility stored in DB
-- Idempotent: uses IF NOT EXISTS / DO blocks

--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_chat_model') THEN
      ALTER TABLE "users" ADD COLUMN "default_chat_model" text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_chat_visibility') THEN
      ALTER TABLE "users" ADD COLUMN "default_chat_visibility" varchar(10) DEFAULT 'private';
    END IF;
  END IF;
END $$;
