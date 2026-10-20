-- Migration 0066 : aligner le modèle par DÉFAUT des colonnes sur
-- `DEFAULT_CHAT_MODEL` (mAI-2-Mini).
--
-- POURQUOI
--
-- Le modèle par défaut de l'application a changé en bêta 7.2 : la constante
-- `DEFAULT_CHAT_MODEL` (`lib/ai/models.ts`) vaut désormais `mai-2-mini`, et
-- le schéma Drizzle l'utilise comme `default` des colonnes concernées. La
-- migration 0029, elle, alignait encore tout sur `gemini/gemini-3.8-flash`.
--
-- Sans ce réalignement, la base et le code divergeaient : une ligne créée
-- SANS modèle explicite (un agent créé par l'API, une tâche planifiée par le
-- planificateur) prenait en base un modèle retiré du catalogue, que
-- l'interface ne propose plus. Le comportement observé dépendait donc de la
-- façon dont la ligne avait été créée — un défaut de cohérence, pas un choix.
--
-- Les VALEURS EXISTANTES ne sont PAS réécrites : un agent dont le modèle a
-- été choisi à la main garde ce choix. Seuls les DEFAULTS des colonnes
-- changent, et les lignes qui portent encore l'ancien modèle PAR DÉFAUT
-- (c'est-à-dire celles qui n'ont jamais été modifiées) sont alignées — sans
-- quoi elles continueraient de viser un modèle absent du catalogue.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
-- `AgentTemplate.defaultModelId`
DO $$
BEGIN
  IF to_regclass('public."AgentTemplate"') IS NOT NULL THEN
    ALTER TABLE "AgentTemplate"
      ALTER COLUMN "defaultModelId" SET DEFAULT 'mai-2-mini';
    -- Les lignes qui portent encore l'ANCIEN modèle par défaut sont
    -- alignées : elles n'ont jamais été modifiées à la main.
    UPDATE "AgentTemplate"
      SET "defaultModelId" = 'mai-2-mini'
      WHERE "defaultModelId" = 'gemini/gemini-3.8-flash';
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

--> statement-breakpoint
-- `Agent.defaultModelId`
DO $$
BEGIN
  IF to_regclass('public."Agent"') IS NOT NULL THEN
    ALTER TABLE "Agent"
      ALTER COLUMN "defaultModelId" SET DEFAULT 'mai-2-mini';
    UPDATE "Agent"
      SET "defaultModelId" = 'mai-2-mini'
      WHERE "defaultModelId" = 'gemini/gemini-3.8-flash';
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

--> statement-breakpoint
-- `ScheduledMessage.modelId`
DO $$
BEGIN
  IF to_regclass('public."ScheduledMessage"') IS NOT NULL THEN
    ALTER TABLE "ScheduledMessage"
      ALTER COLUMN "modelId" SET DEFAULT 'mai-2-mini';
    UPDATE "ScheduledMessage"
      SET "modelId" = 'mai-2-mini'
      WHERE "modelId" = 'gemini/gemini-3.8-flash';
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;
