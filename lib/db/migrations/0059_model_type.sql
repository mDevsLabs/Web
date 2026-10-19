-- Migration 0059 : Typage des modèles (chat, audio, image), distinction laboratoire (provider) & service amont (fournisseur)
-- Idempotente et sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE IF EXISTS "openrouter_models"
ADD COLUMN IF NOT EXISTS "type" VARCHAR(20) DEFAULT 'chat' NOT NULL;

--> statement-breakpoint
ALTER TABLE IF EXISTS "openrouter_models"
ADD COLUMN IF NOT EXISTS "fournisseur" VARCHAR(50) DEFAULT 'openrouter' NOT NULL;

--> statement-breakpoint
ALTER TABLE IF EXISTS "openrouter_models"
DROP CONSTRAINT IF EXISTS "openrouter_models_provider_check";

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'openrouter_models_type_check'
  ) THEN
    ALTER TABLE "openrouter_models"
    ADD CONSTRAINT "openrouter_models_type_check"
    CHECK ("type" IN ('chat', 'audio', 'image'));
  END IF;
END $$;

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'openrouter_models_fournisseur_check'
  ) THEN
    ALTER TABLE "openrouter_models"
    ADD CONSTRAINT "openrouter_models_fournisseur_check"
    CHECK ("fournisseur" IN ('openrouter', 'cometapi'));
  END IF;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "openrouter_models_type_idx" ON "openrouter_models" ("type");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "openrouter_models_fournisseur_idx" ON "openrouter_models" ("fournisseur");

--> statement-breakpoint
-- Classification des modèles audio existants
UPDATE "openrouter_models"
SET "type" = 'audio'
WHERE "type" = 'chat'
  AND (
    (architecture->'output_modalities') ? 'audio'
    OR (architecture->'output_modalities') ? 'speech'
    OR (architecture->>'modality') ILIKE '%audio%'
    OR (architecture->>'modality') ILIKE '%speech%'
  );

--> statement-breakpoint
-- Classification des modèles image existants
UPDATE "openrouter_models"
SET "type" = 'image'
WHERE "type" = 'chat'
  AND (
    (architecture->'output_modalities') ? 'image'
    OR (architecture->>'modality') ILIKE '%image%'
    OR provider = 'cometapi'
    OR fournisseur = 'cometapi'
  );

--> statement-breakpoint
-- Renseigner le laboratoire concepteur dans provider s'il était resté 'openrouter' par défaut
UPDATE "openrouter_models"
SET "provider" = split_part(id, '/', 1)
WHERE ("provider" = 'openrouter' OR "provider" IS NULL OR "provider" = '')
  AND id LIKE '%/%';

--> statement-breakpoint
-- Mise à jour de la procédure stockée sync_openrouter_models
CREATE OR REPLACE FUNCTION public.sync_openrouter_models(payload jsonb, started_at timestamp with time zone)
 RETURNS TABLE(upserted integer, retired integer, skipped boolean)
 LANGUAGE plpgsql
AS $function$
DECLARE
  previous_sync timestamptz;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'array' OR jsonb_array_length(payload) = 0
     OR started_at IS NULL THEN
    RAISE EXCEPTION 'Catalogue de modèles vide ou invalide';
  END IF;
  PERFORM pg_advisory_xact_lock(721004, 1);
  SELECT synced_at INTO previous_sync FROM openrouter_model_sync WHERE singleton;
  IF previous_sync IS NOT NULL AND previous_sync >= started_at THEN
    RETURN QUERY SELECT 0, 0, TRUE;
    RETURN;
  END IF;

  INSERT INTO openrouter_models (
    id, name, description, created, context_length, max_output_tokens,
    architecture, pricing, supported_parameters, upstream, type, provider, fournisseur, last_seen_at
  )
  SELECT p.id, p.name, p.description, p.created, p.context_length, p.max_output_tokens,
    p.architecture, p.pricing, p.supported_parameters, p.upstream,
    COALESCE(p.type, 'chat'),
    COALESCE(NULLIF(p.provider, ''), split_part(p.id, '/', 1), 'inconnu'),
    COALESCE(NULLIF(p.fournisseur, ''), 'openrouter'),
    started_at
  FROM jsonb_to_recordset(payload) AS p (
    id text, name text, description text, created bigint, context_length integer,
    max_output_tokens integer, architecture jsonb, pricing jsonb,
    supported_parameters jsonb, upstream jsonb, type text, provider text, fournisseur text
  )
  ORDER BY p.id
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description, created = EXCLUDED.created,
    context_length = EXCLUDED.context_length, max_output_tokens = EXCLUDED.max_output_tokens,
    architecture = EXCLUDED.architecture, pricing = EXCLUDED.pricing,
    supported_parameters = EXCLUDED.supported_parameters, upstream = EXCLUDED.upstream,
    type = EXCLUDED.type,
    provider = EXCLUDED.provider,
    fournisseur = EXCLUDED.fournisseur,
    is_available = TRUE, last_seen_at = started_at, updated_at = now();

  GET DIAGNOSTICS upserted = ROW_COUNT;

  UPDATE openrouter_models SET is_available = FALSE, updated_at = now()
  WHERE is_available AND last_seen_at < started_at;
  GET DIAGNOSTICS retired = ROW_COUNT;

  UPDATE openrouter_model_sync SET synced_at = started_at WHERE singleton;
  skipped := FALSE;
  RETURN NEXT;
END;
$function$;
