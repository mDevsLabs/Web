-- Migration 0056 : thème partagé par la suite (mAI, Site, Vibe, Wakies).
-- La préférence vivait uniquement dans le navigateur (localStorage de
-- next-themes) et dans user_settings côté Val Town : le Site et Wakies
-- restaient clairs et les appareils ne se suivaient pas. Une colonne dédiée
-- donne un canal unique, lu au montage par chaque application.
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "theme" varchar(10) DEFAULT 'system' NOT NULL;
