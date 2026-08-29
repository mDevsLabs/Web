-- Migration: Agents enrichis — paramètres modèle (temperature/topP/maxTokens), messages de démarrage, message de bienvenue, épinglage
-- Idempotent: uses IF NOT EXISTS / DO blocks

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Agent' AND column_name='temperature') THEN
    ALTER TABLE "Agent" ADD COLUMN "temperature" double precision DEFAULT 0.7;
  END IF;
END $$;

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Agent' AND column_name='topP') THEN
    ALTER TABLE "Agent" ADD COLUMN "topP" double precision DEFAULT 0.9;
  END IF;
END $$;

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Agent' AND column_name='maxTokens') THEN
    ALTER TABLE "Agent" ADD COLUMN "maxTokens" integer;
  END IF;
END $$;

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Agent' AND column_name='starterPrompts') THEN
    ALTER TABLE "Agent" ADD COLUMN "starterPrompts" json DEFAULT '[]'::json NOT NULL;
  END IF;
END $$;

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Agent' AND column_name='welcomeMessage') THEN
    ALTER TABLE "Agent" ADD COLUMN "welcomeMessage" text;
  END IF;
END $$;

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Agent' AND column_name='pinned') THEN
    ALTER TABLE "Agent" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;
  END IF;
END $$;
