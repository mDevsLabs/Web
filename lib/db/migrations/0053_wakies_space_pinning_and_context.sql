-- Migration 0053 : Espaces épinglables et contexte persistant d'une conversation.
--
-- Deux besoins distincts, une seule migration additive :
--
--   1. Le menu « … » des Espaces doit épingler. `WakiesSpace` (0037) ne portait
--      ni épingle ni `updatedAt` : sans colonne, l'ordre de la section « ESPACES »
--      ne peut pas être décidé par le serveur, et il le doit — l'interface ne
--      recalcule jamais un ordre qui vient de la base.
--   2. Une mention `@@jeton` est un RÉGLAGE PERSISTANT du fil. `WakiesConversation`
--      (0042) porte les colonnes de sélection d'outils, mais rien pour les pages,
--      les Espaces et les Wakies dont on veut le contexte à chaque tour.
--
-- SÉMANTIQUE DES NULL, copiée de 0042 : tableaux NULLABLES et SANS DEFAULT.
-- `null` = « rien de réglé, on replie sur le Wakie », `[]` = « réglage explicite :
-- rien ». Écraser un de ces deux états avec l'autre supprimerait un choix.
--
-- Pas de clé étrangère sur ces trois colonnes : ce sont des IDENTIFIANTS, comme
-- `mcpServerIds` ou `skillIds`. Une FK aurait exigé de décider un `ON DELETE` non
-- additif ; la résolution jette chaque tour l'identifiant devenu pendant.
--
-- Additif uniquement : aucune colonne supprimée, aucun type modifié, aucune
-- donnée réécrite. Idempotente : sûre à rejouer sur une base déjà migrée. Le code
-- qui lit ces colonnes est déployé APRÈS cette migration, sinon la liste des
-- Espaces échoue en 42703 et plus aucun espace de travail ne s'affiche.

--> statement-breakpoint
ALTER TABLE IF EXISTS "WakiesSpace" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;

--> statement-breakpoint
ALTER TABLE IF EXISTS "WakiesSpace" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesSpace_userId_pinned_createdAt_idx" ON "WakiesSpace" ("userId", "pinned", "createdAt");

--> statement-breakpoint
ALTER TABLE IF EXISTS "WakiesConversation" ADD COLUMN IF NOT EXISTS "contextSpaceIds" uuid[];

--> statement-breakpoint
ALTER TABLE IF EXISTS "WakiesConversation" ADD COLUMN IF NOT EXISTS "contextPageIds" uuid[];

--> statement-breakpoint
ALTER TABLE IF EXISTS "WakiesConversation" ADD COLUMN IF NOT EXISTS "contextWakieIds" uuid[];
