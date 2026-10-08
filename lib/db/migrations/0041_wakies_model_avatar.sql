-- Migration 0041 : le modèle IA et la mascotte des Wakies.
--
-- Le chat Wakies appelait le modèle par défaut codé en dur : impossible de
-- choisir le modèle qui répond, et le journal d'usage portait toujours le même
-- identifiant quel que soit le compte. `WakiesWakie.model` est le DÉFAUT des
-- nouvelles conversations de ce Wakie, et `WakiesConversation.model` la valeur
-- réellement utilisée par une conversation (celle que le menu de modèle du chat
-- écrit). NULL = repli sur le comportement historique, donc aucun compte en
-- place ne change de modèle ni de coût.
--
-- `avatar` fige la mascotte choisie à la création (`blue`, `mint`, `orange`,
-- `purple`, `red` — les images de /wakies). NULL = mascotte déduite de
-- l'identifiant : les Wakies existants gardent exactement la leur.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "model" text;

--> statement-breakpoint
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "avatar" varchar(16);

--> statement-breakpoint
ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "model" text;
