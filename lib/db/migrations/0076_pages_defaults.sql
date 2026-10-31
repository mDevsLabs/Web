-- Migration 0076 : modèle et consigne par défaut des nouvelles Pages.
--
-- Le modèle et le prompt d'une page sont propres au document. Sans défaut
-- de compte, chaque page nouvelle repart du modèle du compte et d'une
-- consigne vide. Ces deux colonnes fixent ce point de départ ; une page
-- déjà écrite ne change pas.
--
-- Idempotente : rejouable sans effet sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "pagesDefaultModel" text;

--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "pagesDefaultPrompt" text DEFAULT '' NOT NULL;
