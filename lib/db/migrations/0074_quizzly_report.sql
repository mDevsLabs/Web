-- Migration 0074 - Quizzly : signalement d'un exercice.
--
-- POURQUOI UNE TABLE
--
-- Les questions sont rédigées par un modèle. L'élève signale un énoncé
-- depuis le quiz : la ligne garde la question, la matière et le compte
-- au moment de l'envoi, même si le JSON change ensuite.
--
-- Idempotente : rejouable sans effet sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyReport" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "username" varchar(120),
  "email" varchar(320),
  "quizId" text NOT NULL,
  "questionId" varchar(8) NOT NULL,
  "questionNumber" integer NOT NULL,
  "year" varchar(12) NOT NULL,
  "subjectId" varchar(40) NOT NULL,
  "subjectLabel" varchar(80) NOT NULL,
  "chapterFile" varchar(2) NOT NULL,
  "chapterTitle" varchar(160) NOT NULL,
  "unitId" varchar(8) NOT NULL,
  "unitTitle" varchar(160) NOT NULL,
  "quizTitle" varchar(120) NOT NULL,
  "questionText" text NOT NULL,
  "options" jsonb NOT NULL,
  "message" text NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyReport_question_check'
  ) THEN
    ALTER TABLE "QuizzlyReport"
      ADD CONSTRAINT "QuizzlyReport_question_check"
      CHECK (
        "questionNumber" >= 1
        AND "questionNumber" <= 10
        AND "questionId" ~ '^q([1-9]|10)$'
      );
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyReport_year_check'
  ) THEN
    ALTER TABLE "QuizzlyReport"
      ADD CONSTRAINT "QuizzlyReport_year_check"
      CHECK ("year" IN ('6e', '5e', '4e', '3e', '2nde', '1ere', 'terminale'));
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyReport_place_check'
  ) THEN
    ALTER TABLE "QuizzlyReport"
      ADD CONSTRAINT "QuizzlyReport_place_check"
      CHECK (
        "chapterFile" IN ('01', '02')
        AND "unitId" IN ('u1', 'u2')
      );
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyReport_message_check'
  ) THEN
    ALTER TABLE "QuizzlyReport"
      ADD CONSTRAINT "QuizzlyReport_message_check"
      CHECK (char_length(btrim("message")) BETWEEN 1 AND 1000);
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyReport_options_check'
  ) THEN
    ALTER TABLE "QuizzlyReport"
      ADD CONSTRAINT "QuizzlyReport_options_check"
      CHECK (jsonb_typeof("options") = 'array');
  END IF;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "QuizzlyReport_userId_createdAt_idx"
  ON "QuizzlyReport" USING btree ("userId", "createdAt");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "QuizzlyReport_quiz_question_idx"
  ON "QuizzlyReport" USING btree ("quizId", "questionId");

--> statement-breakpoint
COMMENT ON TABLE "QuizzlyReport" IS
  'Signalement d''un exercice Quizzly : question, matière et compte au moment de l''envoi.';
