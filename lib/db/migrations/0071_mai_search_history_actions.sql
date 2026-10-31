-- Migration 0071: historique mAI Search — titre affiché, épingle et réflexion.
-- Le texte de la requête reste la recherche réelle. Le titre est un libellé
-- choisi par le compte. La réflexion est enregistrée avec la synthèse pour
-- pouvoir la rouvrir. Idempotente: sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "MaiSearchQuery" ADD COLUMN IF NOT EXISTS "title" text;

--> statement-breakpoint
ALTER TABLE "MaiSearchQuery" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;

--> statement-breakpoint
ALTER TABLE "MaiSearchQuery" ADD COLUMN IF NOT EXISTS "reasoning" text;
