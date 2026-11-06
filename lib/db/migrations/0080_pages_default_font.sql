-- Migration 0080 : police de lecture par défaut des Pages.
--
-- Le modèle et la consigne (0076) sont copiés sur une page nouvelle. La
-- police, elle, est un réglage de lecture du compte : le texte sans marque
-- la suit sur toutes les pages, y compris celles déjà écrites. Une zone
-- peut ensuite porter sa propre police dans le Markdown.
--
-- Idempotente : rejouable sans effet sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "pagesDefaultFont" varchar(10) DEFAULT 'sans' NOT NULL;
