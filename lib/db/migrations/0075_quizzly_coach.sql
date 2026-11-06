-- Migration 0075 - Quizzly : modèle du Coach et dernière tentative.
--
-- POURQUOI CES COLONNES
--
-- Le Coach explique une erreur après que l'élève a quitté le quiz. Le
-- meilleur score ne suffit pas : il ne dit pas quelle option a été choisie.
-- `lastAttempt` est donc écrasé à chaque envoi, tandis que `correctCount`
-- et `passed` continuent de garder le meilleur résultat.
--
-- `modelId` est le modèle du Coach pour ce compte. Nul : on reprend le
-- modèle par défaut du compte, puis le modèle de repli de l'application.
--
-- Idempotente : rejouable sans effet sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "QuizzlyProfile" ADD COLUMN IF NOT EXISTS "modelId" text;

--> statement-breakpoint
ALTER TABLE "QuizzlyQuizProgress" ADD COLUMN IF NOT EXISTS "lastAttempt" jsonb;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyQuizProgress_last_attempt_check'
  ) THEN
    ALTER TABLE "QuizzlyQuizProgress"
      ADD CONSTRAINT "QuizzlyQuizProgress_last_attempt_check"
      CHECK (
        "lastAttempt" IS NULL
        OR jsonb_typeof("lastAttempt") = 'object'
      );
  END IF;
END $$;

--> statement-breakpoint
COMMENT ON COLUMN "QuizzlyProfile"."modelId" IS
  'Modèle du Coach Quizzly. Nul : modèle par défaut du compte.';
COMMENT ON COLUMN "QuizzlyQuizProgress"."lastAttempt" IS
  'Dernière tentative, écrasée à chaque envoi. Le meilleur score reste dans correctCount.';
