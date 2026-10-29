-- Migration 0062 : préférences de recherche mAI Search (langue, volume de
-- résultats, sources activées, filtre de sécurité).
--
-- Ces réglages sont des préférences de COMPTE, au même titre que le modèle
-- par défaut ou la voix : ils vivent donc sur `user_preferences`, la table
-- déjà lue par `/api/user/preferences` et par l'onglet « Applications » des
-- paramètres. Pas de table séparée — une table de plus aurait séparé le même
-- concept en deux endroits à synchroniser.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "searchLanguage" varchar(10) NOT NULL DEFAULT 'fr';

--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "searchResultCount" integer NOT NULL DEFAULT 10;

--> statement-breakpoint
-- `jsonb` : la liste des sources est un ensemble, pas une chaîne. Un
-- `varchar` obligerait à sérialiser à la main des deux côtés.
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "searchSources" jsonb NOT NULL DEFAULT '["web","news","images","videos","wikipedia"]'::jsonb;

--> statement-breakpoint
-- Même vocabulaire que le filtre de contenu de Vibe (`content_filter_level`) :
-- low | medium | strict. Un utilisateur ne doit pas apprendre deux
-- échelles pour la même idée.
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "searchSafetyLevel" varchar(20) NOT NULL DEFAULT 'medium';

--> statement-breakpoint
-- La borne supérieure du nombre de résultats est une contrainte de DONNÉE,
-- pas seulement de code : un client qui triche ne doit pas pouvoir demander
-- mille résultats et siphonner le quota du moteur.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_searchResultCount_check'
  ) THEN
    ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_searchResultCount_check"
      CHECK ("searchResultCount" BETWEEN 5 AND 25);
  END IF;
END $$;
