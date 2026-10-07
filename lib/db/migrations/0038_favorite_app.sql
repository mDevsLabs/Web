-- Migration 0038 - Menu favori : application ouverte par défaut après
-- connexion (mAI, Site, Vibe ou Code).
--
-- Le choix vit dans `user_preferences` : c'est une préférence d'interface
-- personnelle, au même titre que le modèle ou la visibilité par défaut, pas
-- un attribut du compte. La colonne est un varchar borné à 20 caractères —
-- le contrôle de validité est applicatif (zod côté API, normalisation
-- fail-safe dans lib/apps/catalog.ts : toute valeur illisible retombe sur
-- « mai », jamais sur un privilège implicite).
--
-- Idempotente : rejouable sans effet sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "user_preferences"
  ADD COLUMN IF NOT EXISTS "defaultApp" varchar(20) DEFAULT 'mai' NOT NULL;
