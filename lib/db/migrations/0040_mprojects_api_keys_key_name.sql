-- Migration 0040 : colonne dédiée key_name pour mprojects_api_keys.
-- Sépare le nom de la clé (key_name) et le forfait du compte (plan).
-- Idempotente et sûre à rejouer sur une base existante.

--> statement-breakpoint
ALTER TABLE IF EXISTS "mprojects_api_keys" ADD COLUMN IF NOT EXISTS "key_name" text;

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public."mprojects_api_keys"') IS NOT NULL THEN
    UPDATE "mprojects_api_keys"
    SET "key_name" = "plan"
    WHERE "key_name" IS NULL AND "plan" IS NOT NULL AND "plan" <> '';
  END IF;
END $$;
