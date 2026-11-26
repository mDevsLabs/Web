-- Migration 0087: table unifiée des codes de vérification OTP (migration SQLite Val Town vers Neon PostgreSQL)
--
-- Stocke les codes de vérification à durée de vie limitée (connexion, inscription,
-- changement d'e-mail, suppression de compte) avec gestion atomique des tentatives.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_codes" (
	"email" text NOT NULL,
	"action" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "verification_codes_pkey" PRIMARY KEY("email","action")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_codes_email_idx" ON "verification_codes" USING btree ("email");
