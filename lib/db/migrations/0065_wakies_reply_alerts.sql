-- Migration 0065 : réglages de notification des Wakies.
--
-- POURQUOI UNE COLONNE
--
-- Wakies n'avait AUCUN réglage de notification : la page de réglages
-- renvoyait vers « Notifications mAI » et le point final. Après l'unification
-- des notifications (migration 0063), la cloche mAI affiche les alertes
-- Wakies — mais la décision de les PRODUIRE reste dans Wakies, qui écrit
-- `WakiesNotification` à la fin d'un tour terminé.
--
-- Cette colonne est donc le lieu de la décision, comme `user_settings` côté
-- Vibe. Elle vit sur `WakiesSettings` (une ligne par compte) et non sur la
-- table `Notification` : celle-ci porte l'ÉVÉNEMENT, celle-là le RÉGLAGE.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "WakiesSettings"
  ADD COLUMN IF NOT EXISTS "replyAlertsEnabled" boolean DEFAULT true NOT NULL;

--> statement-breakpoint
COMMENT ON COLUMN "WakiesSettings"."replyAlertsEnabled" IS
  'Produire une alerte (WakiesNotification) à la fin d''un tour de conversation terminé.';
