-- Migration 0079 - Quizzly : historique du Coach.
--
-- POURQUOI CES TABLES
--
-- Le Coach garde les fils sur le compte. Le modèle relit ces lignes,
-- pas un historique envoyé par le navigateur. Renommer, épingler,
-- exporter et partager se font depuis ces lignes, sans page publique.
--
-- Idempotente : rejouable sans effet sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyCoachConversation" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "title" varchar(80) NOT NULL,
  "pinned" boolean DEFAULT false NOT NULL,
  "pinnedAt" timestamptz,
  "intent" varchar(16) DEFAULT 'chat' NOT NULL,
  "quizId" text,
  "questionId" varchar(8),
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyCoachMessage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversationId" uuid NOT NULL,
  "userId" text NOT NULL,
  "role" varchar(16) NOT NULL,
  "text" text NOT NULL,
  "pinned" boolean DEFAULT false NOT NULL,
  "pinnedAt" timestamptz,
  "createdAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyCoachMessage_conversation_fkey'
  ) THEN
    ALTER TABLE "QuizzlyCoachMessage"
      ADD CONSTRAINT "QuizzlyCoachMessage_conversation_fkey"
      FOREIGN KEY ("conversationId")
      REFERENCES "QuizzlyCoachConversation" ("id")
      ON DELETE CASCADE;
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyCoachConversation_intent_check'
  ) THEN
    ALTER TABLE "QuizzlyCoachConversation"
      ADD CONSTRAINT "QuizzlyCoachConversation_intent_check"
      CHECK ("intent" IN ('chat', 'explain', 'summary', 'encourage'));
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyCoachConversation_title_check'
  ) THEN
    ALTER TABLE "QuizzlyCoachConversation"
      ADD CONSTRAINT "QuizzlyCoachConversation_title_check"
      CHECK (char_length("title") >= 1);
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyCoachMessage_role_check'
  ) THEN
    ALTER TABLE "QuizzlyCoachMessage"
      ADD CONSTRAINT "QuizzlyCoachMessage_role_check"
      CHECK ("role" IN ('user', 'assistant'));
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyCoachMessage_text_check'
  ) THEN
    ALTER TABLE "QuizzlyCoachMessage"
      ADD CONSTRAINT "QuizzlyCoachMessage_text_check"
      CHECK (char_length("text") BETWEEN 1 AND 8000);
  END IF;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "QuizzlyCoachConversation_user_pinned_idx"
  ON "QuizzlyCoachConversation" ("userId", "pinned", "updatedAt");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "QuizzlyCoachMessage_conversation_idx"
  ON "QuizzlyCoachMessage" ("conversationId", "createdAt");

--> statement-breakpoint
COMMENT ON TABLE "QuizzlyCoachConversation" IS
  'Fil du Coach Quizzly. Le partage reste local : aucune URL publique.';
COMMENT ON TABLE "QuizzlyCoachMessage" IS
  'Message d''un fil Coach. Le modèle relit ces lignes, pas le corps du navigateur.';
