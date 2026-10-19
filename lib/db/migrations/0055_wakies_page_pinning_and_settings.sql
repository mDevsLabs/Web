-- Migration 0055 : Pages épinglables et réglages de lecture.
--
-- Deux besoins distincts, une seule migration additive :
--
--   1. Le menu « … » d'une page doit épingler, comme l'ont fait les Espaces en
--      0053. `WakiesPage` (0037) ne portait aucune colonne d'ordre : sans elle,
--      une page épinglée ne peut pas passer en tête de la bibliothèque, et c'est
--      au serveur de décider cet ordre — l'interface ne recalcule jamais ce qui
--      vient de la base.
--   2. Une page doit pouvoir être lue large, sans son titre, avec un signe
--      distinctif. Ce sont des RÉGLAGES DE RENDU, pas des données métier : ils
--      tiennent dans un seul jsonb, et une colonne par réglage aurait imposé une
--      migration à chaque ajout.
--
-- `settings` reste NULLABLE sans DEFAULT : `null` = « rien de réglé, rendu par
-- défaut », `{…}` = « réglage explicite ». Écraser `null` avec un objet complet
-- inventé par le client aurait créé un réglage que l'utilisateur n'a pas fait.
--
-- L'index porte `(spaceId, pinned)` parce que la bibliothèque liste les pages
-- D'UN espace ; `(userId, pinned)` seul n'aurait servi aucune requête réelle.
--
-- Additif uniquement : aucune colonne supprimée, aucun type modifié, aucune
-- donnée réécrite. Idempotente : sûre à rejouer sur une base déjà migrée. Le
-- code qui lit ces colonnes est déployé APRÈS cette migration, sinon la liste
-- des pages échoue en 42703 et plus aucune bibliothèque ne s'affiche.

--> statement-breakpoint
ALTER TABLE IF EXISTS "WakiesPage" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;

--> statement-breakpoint
ALTER TABLE IF EXISTS "WakiesPage" ADD COLUMN IF NOT EXISTS "settings" jsonb;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesPage_spaceId_pinned_idx" ON "WakiesPage" ("spaceId", "pinned");
