-- Migration 0030 : le mode d'écran par défaut devient une préférence persistée,
-- et l'intensité de réflexion s'aligne sur les niveaux réellement exposés par
-- les modèles (max, xhigh, high, medium, low, minimal, none) au lieu du
-- triplet low/medium/high posé par 0016. L'autonomie disparaît de l'interface :
-- la colonne est ramenée à 'standard' pour que les runs historiques, les
-- permissions d'outils et le moteur de prompt continuent de fonctionner sans
-- que rien ne perde sa cohérence.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
-- 1. Préférence de mode d'écran. Alignée sur Chat.mode (VARCHAR(10) : la même
--    contrainte de longueur doit accueillir 'chat' comme 'agent').
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AgentSettings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'AgentSettings' AND column_name = 'defaultMode'
    ) THEN
      ALTER TABLE "AgentSettings"
        ADD COLUMN "defaultMode" VARCHAR(10) DEFAULT 'chat' NOT NULL;
    END IF;
  END IF;
END $$;

-- statement-breakpoint
-- 2. Les CHECK posés par 0016 n'admettent que low/medium/high : ils doivent
--    être élargis AVANT toute écriture, sinon le PATCH /api/agent/settings
--    échouerait sur un niveau « max » pourtant parfaitement valide. Les
--    contraintes sont nommées automatiquement par Postgres, on les retrouve donc
--    par définition plutôt que par nom.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AgentSettings') THEN
    FOR constraint_name IN
      SELECT conname FROM pg_constraint
      WHERE conrelid = '"AgentSettings"'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%reasoningLevel%'
    LOOP
      EXECUTE format('ALTER TABLE "AgentSettings" DROP CONSTRAINT %I', constraint_name);
    END LOOP;
  END IF;
END $$;

-- statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AgentSettings') THEN
    ALTER TABLE "AgentSettings"
      ADD CONSTRAINT "AgentSettings_reasoningLevel_check"
      CHECK ("reasoningLevel" IN ('max', 'xhigh', 'high', 'medium', 'low', 'minimal', 'none'));
  END IF;
END $$;

-- statement-breakpoint
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AgentRun') THEN
    FOR constraint_name IN
      SELECT conname FROM pg_constraint
      WHERE conrelid = '"AgentRun"'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%reasoningLevel%'
    LOOP
      EXECUTE format('ALTER TABLE "AgentRun" DROP CONSTRAINT %I', constraint_name);
    END LOOP;
  END IF;
END $$;

-- statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AgentRun') THEN
    ALTER TABLE "AgentRun"
      ADD CONSTRAINT "AgentRun_reasoningLevel_check"
      CHECK ("reasoningLevel" IN ('max', 'xhigh', 'high', 'medium', 'low', 'minimal', 'none'));
  END IF;
END $$;

-- statement-breakpoint
-- 3. Autonomie : le choix n'existe plus dans l'interface, on aligne les lignes
--    existantes sur la valeur que le serveur applique désormais. 'medium'
--    reste valide pour la réflexion (aucun recalage de données nécessaire).
UPDATE "AgentSettings" SET "autonomy" = 'standard' WHERE "autonomy" <> 'standard';

-- statement-breakpoint
UPDATE "AgentRun" SET "autonomy" = 'standard' WHERE "autonomy" <> 'standard';

-- statement-breakpoint
-- 4. Décomposition du quota : les tokens de réflexion sont comptabilisés avec
--    l'entrée et la sortie, mais gardés dans une colonne distincte pour rester
--    lisibles (ils sont un sous-ensemble des tokens de sortie côté fournisseur).
ALTER TABLE "UsageEvent" ADD COLUMN IF NOT EXISTS "reasoningTokens" INTEGER DEFAULT 0 NOT NULL;
