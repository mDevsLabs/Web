-- Migration 0067 : volume de résultats de mAI Search élargi (1 à 200) et
-- plafonné par forfait.
--
-- Pourquoi : la recherche était bornée à 25 résultats par source. Le
-- volume utile d'une recherche va bien au-delà, et il dépend du forfait
-- (Free 50, Plus 100, Pro 150, Max 200). Le plafond DU FORFAIT est appliqué
-- par le serveur (`resolveMaiSearchResultCount`), jamais par l'interface.
--
-- Ce que la migration change : la CONTRAINTE de données. Elle disait
-- `BETWEEN 5 AND 25` — un compte Max ne pouvait pas enregistrer 100, et un
-- compte dont la préférence avait été réduite à 1 était refusé par la base.
-- La borne devient `BETWEEN 1 AND 200` : la borne ABSOLUE du produit. Le
-- plafond par forfait reste une décision serveur, il n'a pas sa place dans
-- une contrainte de colonne (elle ne connaît pas le compte concerné).
--
-- Idempotente : sûre à rejouer sur une base déjà migrée. Le `DROP
-- CONSTRAINT IF EXISTS` précède l'ajout, donc la contrainte ancienne est
-- bien remplacée et pas dupliquée.

--> statement-breakpoint
ALTER TABLE "user_preferences" DROP CONSTRAINT IF EXISTS "user_preferences_searchResultCount_check";

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_searchResultCount_check'
  ) THEN
    ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_searchResultCount_check"
      CHECK ("searchResultCount" BETWEEN 1 AND 200);
  END IF;
END $$;
