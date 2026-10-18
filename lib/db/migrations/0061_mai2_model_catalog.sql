-- Migration 0061 : rendre mAI-2 et mAI-2-Mini visibles dans /v1/models.
--
-- Le backend Val Town construit son catalogue depuis `openrouter_models`, mais
-- ses alias mAI-2 étaient ajoutés à la main : une base recréée les perdait, et
-- l'application ne pouvait plus les proposer. L'écriture est gardée par
-- `to_regclass` (la table vit hors du schéma Drizzle) et par `ON CONFLICT` :
-- rejouer la migration ne crée aucun doublon et ne casse aucune base.
--
-- `model_number` n'est JAMAIS fourni : la colonne est une identité
-- (`GENERATED ALWAYS AS IDENTITY`), donc Postgres refuse toute valeur explicite
-- (428C9 « cannot insert a non-DEFAULT value »). Le numéro vient de la
-- séquence, exactement comme dans `sync_openrouter_models`, et un modèle déjà
-- présent garde le sien — la branche `ON CONFLICT` ne touche pas la colonne.

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.openrouter_models') IS NOT NULL THEN
    INSERT INTO public.openrouter_models (
      id,
      provider,
      name,
      description,
      created,
      context_length,
      max_output_tokens,
      architecture,
      pricing,
      supported_parameters,
      upstream,
      overrides,
      "isActive",
      is_available,
      last_seen_at,
      updated_at,
      type,
      fournisseur
    )
    SELECT
      'mai-2',
      'mdevslabs',
      'mAI-2',
      'Next-generation flagship cloud model of the mAI family, designed for advanced reasoning, coding, and long-context tasks.',
      EXTRACT(EPOCH FROM TIMESTAMPTZ '2026-10-25T00:00:00Z')::bigint,
      1000000,
      384000,
      '{"input_modalities":["text","image","file"],"output_modalities":["text"],"modality":"text+image+file->text","tokenizer":"Other","instruct_type":null}'::jsonb,
      '{}'::jsonb,
      '["max_tokens","temperature","top_p","tools","tool_choice","reasoning","include_reasoning","response_format","stop","seed"]'::jsonb,
      '{"id":"mai-2","object":"model","owned_by":"mDevsLabs","reasoning":{"default_effort":"high","default_enabled":true,"mandatory":false,"supported_efforts":["max","high","low"]}}'::jsonb,
      '{}'::jsonb,
      TRUE,
      TRUE,
      now(),
      now(),
      'chat',
      'openrouter'
    ON CONFLICT (id) DO UPDATE SET
      provider = EXCLUDED.provider,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      context_length = EXCLUDED.context_length,
      max_output_tokens = EXCLUDED.max_output_tokens,
      architecture = EXCLUDED.architecture,
      supported_parameters = EXCLUDED.supported_parameters,
      upstream = EXCLUDED.upstream,
      "isActive" = TRUE,
      is_available = TRUE,
      last_seen_at = now(),
      updated_at = now(),
      type = 'chat',
      fournisseur = 'openrouter';

    INSERT INTO public.openrouter_models (
      id,
      provider,
      name,
      description,
      created,
      context_length,
      max_output_tokens,
      architecture,
      pricing,
      supported_parameters,
      upstream,
      overrides,
      "isActive",
      is_available,
      last_seen_at,
      updated_at,
      type,
      fournisseur
    )
    SELECT
      'mai-2-mini',
      'mdevslabs',
      'mAI-2-Mini',
      'Fast and efficient cloud model of the mAI family, optimized for speed and everyday tasks.',
      EXTRACT(EPOCH FROM TIMESTAMPTZ '2026-10-25T00:00:00Z')::bigint,
      1000000,
      128000,
      '{"input_modalities":["text","image"],"output_modalities":["text"],"modality":"text+image->text","tokenizer":"Other","instruct_type":null}'::jsonb,
      '{}'::jsonb,
      '["max_tokens","temperature","top_p","tools","tool_choice","reasoning","include_reasoning","response_format","stop","seed"]'::jsonb,
      '{"id":"mai-2-mini","object":"model","owned_by":"mDevsLabs","reasoning":{"default_effort":"high","default_enabled":true,"mandatory":false,"supported_efforts":["max","high","low"]}}'::jsonb,
      '{}'::jsonb,
      TRUE,
      TRUE,
      now(),
      now(),
      'chat',
      'openrouter'
    ON CONFLICT (id) DO UPDATE SET
      provider = EXCLUDED.provider,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      context_length = EXCLUDED.context_length,
      max_output_tokens = EXCLUDED.max_output_tokens,
      architecture = EXCLUDED.architecture,
      supported_parameters = EXCLUDED.supported_parameters,
      upstream = EXCLUDED.upstream,
      "isActive" = TRUE,
      is_available = TRUE,
      last_seen_at = now(),
      updated_at = now(),
      type = 'chat',
      fournisseur = 'openrouter';
  END IF;
END $$;
