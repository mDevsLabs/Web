-- Migration 0073 - Quizzly : profil de jeu, progression des quiz et quêtes.
--
-- POURQUOI DES TABLES DÉDIÉES
--
-- Quizzly est l'application de révision (parcours, série, boutique, quêtes).
-- Ce n'est pas le plugin de chat qui génère un quiz à la demande. Les
-- questions vivent dans des JSON versionnés ; seule la progression du
-- compte est en base, pour qu'un navigateur ne puisse pas s'accorder
-- d'XP, de gemmes ou de cœurs.
--
-- Le nom affiché n'est pas ici : c'est `profiles.display_name` (Vibe),
-- recopié dans l'indicatif Blackline. `yearChosen` distingue un compte
-- qui n'a pas encore choisi son année du défaut « 6e ».
--
-- Idempotente : rejouable sans effet sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyProfile" (
  "userId" text PRIMARY KEY NOT NULL,
  "schoolYear" varchar(12) DEFAULT '6e' NOT NULL,
  "yearChosen" boolean DEFAULT false NOT NULL,
  "xp" integer DEFAULT 0 NOT NULL,
  "gems" integer DEFAULT 0 NOT NULL,
  "hearts" integer DEFAULT 5 NOT NULL,
  "heartsUpdatedAt" timestamptz DEFAULT now() NOT NULL,
  "streakCount" integer DEFAULT 0 NOT NULL,
  "streakLastDay" date,
  "streakFreezes" integer DEFAULT 0 NOT NULL,
  "cosmetics" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyProfile_school_year_check'
  ) THEN
    ALTER TABLE "QuizzlyProfile"
      ADD CONSTRAINT "QuizzlyProfile_school_year_check"
      CHECK ("schoolYear" IN ('6e', '5e', '4e', '3e', '2nde', '1ere', 'terminale'));
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyProfile_hearts_check'
  ) THEN
    ALTER TABLE "QuizzlyProfile"
      ADD CONSTRAINT "QuizzlyProfile_hearts_check"
      CHECK ("hearts" >= 0 AND "hearts" <= 5);
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyProfile_balances_check'
  ) THEN
    ALTER TABLE "QuizzlyProfile"
      ADD CONSTRAINT "QuizzlyProfile_balances_check"
      CHECK (
        "xp" >= 0
        AND "gems" >= 0
        AND "streakCount" >= 0
        AND "streakFreezes" >= 0
      );
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyProfile_cosmetics_object_check'
  ) THEN
    ALTER TABLE "QuizzlyProfile"
      ADD CONSTRAINT "QuizzlyProfile_cosmetics_object_check"
      CHECK (jsonb_typeof("cosmetics") = 'object');
  END IF;
END $$;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyQuizProgress" (
  "userId" text NOT NULL,
  "quizId" text NOT NULL,
  "correctCount" integer NOT NULL,
  "totalCount" integer NOT NULL,
  "passed" boolean DEFAULT false NOT NULL,
  "completedAt" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("userId", "quizId")
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyQuizProgress_score_check'
  ) THEN
    ALTER TABLE "QuizzlyQuizProgress"
      ADD CONSTRAINT "QuizzlyQuizProgress_score_check"
      CHECK (
        "correctCount" >= 0
        AND "totalCount" > 0
        AND "correctCount" <= "totalCount"
      );
  END IF;
END $$;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyQuest" (
  "userId" text NOT NULL,
  "questKey" text NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "claimedAt" timestamptz,
  PRIMARY KEY ("userId", "questKey")
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyQuest_progress_check'
  ) THEN
    ALTER TABLE "QuizzlyQuest"
      ADD CONSTRAINT "QuizzlyQuest_progress_check"
      CHECK ("progress" >= 0);
  END IF;
END $$;

--> statement-breakpoint
COMMENT ON TABLE "QuizzlyProfile" IS
  'Profil de jeu Quizzly, une ligne par compte mAI. Le nom affiché reste celui de Vibe.';
COMMENT ON TABLE "QuizzlyQuizProgress" IS
  'Meilleur résultat d''un quiz Quizzly. La validation ne revient pas en arrière.';
COMMENT ON TABLE "QuizzlyQuest" IS
  'Avancement des quêtes Quizzly, une ligne par compte et par période.';
