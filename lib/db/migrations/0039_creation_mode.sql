-- Migration 0039 : le mode de Création est une préférence du compte.
-- Additive et idempotente pour préserver les comptes et leurs réglages.
--> statement-breakpoint
ALTER TABLE "user_preferences"
  ADD COLUMN IF NOT EXISTS "defaultCreationMode" varchar(20) DEFAULT 'image' NOT NULL;
