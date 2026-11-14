-- Migration 0084: préférences de confort du mode Agent, stockées par compte.
-- Idempotente: sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "AgentSettings" ADD COLUMN IF NOT EXISTS "preferences" json DEFAULT '{"timelineDensity":"detailed","activityDays":30,"notifyBrowser":false,"showPlan":false}'::json NOT NULL;
