-- Migration 0091 : persistance des pièces jointes images sur les messages du Coach Quizzly.
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "QuizzlyCoachMessage"
  ADD COLUMN IF NOT EXISTS "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb;
