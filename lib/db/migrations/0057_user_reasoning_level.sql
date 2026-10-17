-- Migration 0057 : Effort de réflexion global et surcharge Agent nullable.
-- Ajoute reasoningLevel à user_preferences pour Chat, Agent, Wakies et Vibe,
-- et rend AgentSettings.reasoningLevel nullable pour que NULL signifie « hérite du global ».
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE IF EXISTS "user_preferences" ADD COLUMN IF NOT EXISTS "reasoningLevel" varchar(10) DEFAULT 'medium' NOT NULL;

--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE IF EXISTS "AgentSettings" ALTER COLUMN "reasoningLevel" DROP NOT NULL;
  ALTER TABLE IF EXISTS "AgentSettings" ALTER COLUMN "reasoningLevel" DROP DEFAULT;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;
