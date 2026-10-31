-- Migration 0081: figer le tirage global des quêtes Quizzly.
--
-- Le catalogue JSON peut changer après un déploiement. Le jour et la
-- semaine déjà publiés gardent leurs quêtes : la première lecture écrit
-- les identifiants, les lectures suivantes les relisent. Le niveau se
-- calcule depuis l'XP et n'a pas de colonne.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyQuestDraw" (
  "periodKey" varchar(24) PRIMARY KEY NOT NULL,
  "questIds" jsonb NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'QuizzlyQuestDraw_quest_ids_check'
  ) THEN
    ALTER TABLE "QuizzlyQuestDraw"
      ADD CONSTRAINT "QuizzlyQuestDraw_quest_ids_check"
      CHECK (jsonb_typeof("questIds") = 'array');
  END IF;
END $$;
