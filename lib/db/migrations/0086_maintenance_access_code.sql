-- Migration 0086: code d'accès et de contournement pour les fenêtres de maintenance.
--
-- Permet à chaque fenêtre de maintenance de disposer d'un code unique permettant
-- aux administrateurs et intervenants autorisés d'accéder au site malgré le verrouillage.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "MaintenanceWindow" ADD COLUMN IF NOT EXISTS "accessCode" varchar(100) DEFAULT '' NOT NULL;
