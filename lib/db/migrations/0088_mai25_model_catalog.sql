-- Migration 0088 : déclarer les modèles mAI-2.5 (Opal, Apex, Omni) dans openrouter_models.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.
-- Les modèles sont enregistrés avec leurs capacités complètes (reasoning, vision, computer use).

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.openrouter_models') IS NOT NULL THEN
    -- 1. mAI-2.5-Opal (Flagship)
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
      'mai-2.5-opal',
      'mdevslabs',
      'mAI-2.5-Opal',
      'Fleuron de la génération mAI-2.5, servi dans le cloud : raisonnement approfondi (thinking), ingénierie logicielle avancée et utilisation autonome de l''ordinateur (computer use).',
      EXTRACT(EPOCH FROM TIMESTAMPTZ '2026-11-19T00:00:00Z')::bigint,
      1000000,
      384000,
      '{"input_modalities":["text","image","file"],"output_modalities":["text"],"modality":"text+image+file->text","tokenizer":"Other","instruct_type":null}'::jsonb,
      '{}'::jsonb,
      '["max_tokens","temperature","top_p","tools","tool_choice","reasoning","include_reasoning","response_format","stop","seed"]'::jsonb,
      '{"id":"mai-2.5-opal","object":"model","owned_by":"mDevsLabs","reasoning":{"default_effort":"high","default_enabled":true,"mandatory":false,"supported_efforts":["max","high","low"]}}'::jsonb,
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

    -- 2. mAI-2.5-Apex (Rigueur & Performance)
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
      'mai-2.5-apex',
      'mdevslabs',
      'mAI-2.5-Apex',
      'Modèle cloud de référence alliant rigueur absolue et haute performance pour le code critique, l''audit de sécurité et les mathématiques vérifiables.',
      EXTRACT(EPOCH FROM TIMESTAMPTZ '2026-11-19T00:00:00Z')::bigint,
      1000000,
      256000,
      '{"input_modalities":["text","image","file"],"output_modalities":["text"],"modality":"text+image+file->text","tokenizer":"Other","instruct_type":null}'::jsonb,
      '{}'::jsonb,
      '["max_tokens","temperature","top_p","tools","tool_choice","reasoning","include_reasoning","response_format","stop","seed"]'::jsonb,
      '{"id":"mai-2.5-apex","object":"model","owned_by":"mDevsLabs","reasoning":{"default_effort":"high","default_enabled":true,"mandatory":false,"supported_efforts":["max","high","low"]}}'::jsonb,
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

    -- 3. mAI-2.5-Omni (Polyvalence quotidienne)
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
      'mai-2.5-omni',
      'mdevslabs',
      'mAI-2.5-Omni',
      'Modèle cloud agile, rapide et polyvalent de la gamme mAI-2.5, conçu pour la productivité au quotidien, la synthèse et l''automatisation de bureau.',
      EXTRACT(EPOCH FROM TIMESTAMPTZ '2026-11-19T00:00:00Z')::bigint,
      1000000,
      128000,
      '{"input_modalities":["text","image"],"output_modalities":["text"],"modality":"text+image->text","tokenizer":"Other","instruct_type":null}'::jsonb,
      '{}'::jsonb,
      '["max_tokens","temperature","top_p","tools","tool_choice","reasoning","include_reasoning","response_format","stop","seed"]'::jsonb,
      '{"id":"mai-2.5-omni","object":"model","owned_by":"mDevsLabs","reasoning":{"default_effort":"high","default_enabled":true,"mandatory":false,"supported_efforts":["max","high","low"]}}'::jsonb,
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
