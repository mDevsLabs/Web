-- 0029 — Modèles d'agents : unicité, icônes, modèle par défaut, et modes
-- d'outils de la planification.
--
-- 1. Dédoublonne AgentTemplate (le seed de 0007 n'était pas idempotent :
--    INSERT sans "id" -> gen_random_uuid() à chaque exécution, aucun index
--    UNIQUE sur "name" -> le ON CONFLICT DO NOTHING sans cible ne pouvait
--    jamais se déclencher). On garde la ligne la plus ancienne par nom.
-- 2. L'index UNIQUE sur ("name") rend désormais ces rejeux ultérieurs sans
--    effet : ON CONFLICT DO NOTHING sans cible couvre toute contrainte unique.
-- 3. Suppression du système emoji (désormais remplacé par des icônes lucide).
-- 4. Alignement du modèle par défaut sur DEFAULT_CHAT_MODEL.
-- 5. Nouvelle colonne ScheduledMessage."toolMode" (3 modes) + backfill.
--
-- Idempotente : sûre à rejouer.

-- 1. Dédoublonnage des modèles d'agents (garde la plus ancienne par nom).
DO $$
DECLARE
  removed_count integer;
BEGIN
  DELETE FROM "AgentTemplate" a
  USING "AgentTemplate" b
  WHERE a."name" = b."name"
    AND a."id" > b."id";
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  IF removed_count > 0 THEN
    RAISE NOTICE '0029 : % doublon(s) AgentTemplate supprimé(s)', removed_count;
  END IF;
END $$;
--> statement-breakpoint

-- 2. Unicité du nom : garde-fou définitif + idempotence du seed de 0007.
CREATE UNIQUE INDEX IF NOT EXISTS "AgentTemplate_name_key"
  ON "AgentTemplate" ("name");
--> statement-breakpoint

-- 3. Suppression du système emoji au profit des icônes lucide.
ALTER TABLE "Agent" DROP COLUMN IF EXISTS "emoji";
--> statement-breakpoint
ALTER TABLE "AgentTemplate" DROP COLUMN IF EXISTS "emoji";
--> statement-breakpoint

-- 4. Modèle par défaut unique : gemini/gemini-3.8-flash.
UPDATE "AgentTemplate" SET "defaultModelId" = 'gemini/gemini-3.8-flash';
--> statement-breakpoint
ALTER TABLE "AgentTemplate" ALTER COLUMN "defaultModelId"
  SET DEFAULT 'gemini/gemini-3.8-flash';
--> statement-breakpoint
UPDATE "Agent" SET "defaultModelId" = 'gemini/gemini-3.8-flash';
--> statement-breakpoint
ALTER TABLE "Agent" ALTER COLUMN "defaultModelId"
  SET DEFAULT 'gemini/gemini-3.8-flash';
--> statement-breakpoint
UPDATE "ScheduledMessage" SET "modelId" = 'gemini/gemini-3.8-flash'
  WHERE "modelId" = 'google/gemini-2.5-flash';
--> statement-breakpoint
ALTER TABLE "ScheduledMessage" ALTER COLUMN "modelId"
  SET DEFAULT 'gemini/gemini-3.8-flash';
--> statement-breakpoint

-- 5. Planification : 3 modes d'outils au lieu d'une liste d'outils unitaires.
--    auto     : tous les outils (natifs, plugins, MCP, skills)
--    plugins  : uniquement plugins, serveurs MCP et skills
--    none     : aucun outil
ALTER TABLE "ScheduledMessage"
  ADD COLUMN IF NOT EXISTS "toolMode" varchar(16) NOT NULL DEFAULT 'auto';
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE "ScheduledMessage"
    ADD CONSTRAINT "ScheduledMessage_toolMode_check"
    CHECK ("toolMode" IN ('auto', 'plugins', 'none'));
EXCEPTION
  -- La contrainte existe déjà : migration rejouée, rien à faire.
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- Backfill des tâches existantes : une sélection vide signifiait « aucun
-- outil », toute autre sélection donnait accès à des outils.
UPDATE "ScheduledMessage"
SET "toolMode" = CASE
  WHEN COALESCE("enabledTools", '[]'::json) = '[]'::json THEN 'none'
  ELSE 'auto'
END
WHERE "toolMode" IS DISTINCT FROM (
  CASE
    WHEN COALESCE("enabledTools", '[]'::json) = '[]'::json THEN 'none'
    ELSE 'auto'
  END
);
--> statement-breakpoint
