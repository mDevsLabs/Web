-- Migration 0063 : notifications unifiées (mAI + Vibe + Wakies) dans une
-- table unique.
--
-- POURQUOI
--
-- Les trois applications avaient chacune leur stockage, leur état lu/non lu
-- et leur interface. L'utilisateur recevait donc trois cloches, trois
-- réglages, et une notification déjà lue dans Vibe pouvait réapparaître
-- comme non lue ailleurs.
--
-- La table `Notification` devient l'unique source de vérité de l'état
-- lu/non lu. Les notifications Vibe et Wakies y sont RÉPLIQUÉES par un
-- tick idempotent ; leur source reste propriétaire de l'événement, la table
-- de l'hôte devient propriétaire de la lecture.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
-- L'ORIGINE : l'application qui a produit l'événement. `mai` par défaut,
-- donc une notification créée sans origine explicite reste une notification
-- mAI, comme avant l'unification.
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "origin" varchar(20) NOT NULL DEFAULT 'mai';

--> statement-breakpoint
-- L'identifiant de l'événement DANS SA SOURCE (uuid Vibe, seq Wakies). Il
-- n'est pas unique seul : deux applications peuvent produire le même id.
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "sourceId" text;

--> statement-breakpoint
-- La charge utile propre à la source (acteur, url, conversation, vignette…).
-- `jsonb` : la forme varie selon l'origine, et un `text` obligerait à
-- sérialiser à la main des deux côtés.
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "sourceMeta" jsonb;

--> statement-breakpoint
-- Un seul événement par (origine, identifiant source) : la réplication est
-- idempotente, un rejeu de tick ne duplique rien.
--
-- C'est un INDEX UNIQUE, pas une contrainte `UNIQUE` : en SQL, une
-- contrainte `UNIQUE` traite `NULL` comme une valeur et refuse donc deux
-- notifications mAI sans `sourceId`. Un index unique, lui, les laisse
-- passer — ce qu'on veut, puisque les notifications natives de mAI n'ont
-- pas d'identifiant source.
CREATE UNIQUE INDEX IF NOT EXISTS "Notification_origin_sourceId_key"
  ON "Notification" USING btree ("origin", "sourceId")
  WHERE "sourceId" IS NOT NULL;

--> statement-breakpoint
-- Les notifications Vibe et Wakies deviennent des types de la table unique.
DO $$ BEGIN
  IF EXISTS (
    -- `pg_constraint` n'a PAS de colonne `table_name` : c'est
    -- `information_schema.table_constraints` qui la porte. Interroger
    -- `pg_constraint` avec `table_name` échoue en 42703 et fait TOUTE LA
    -- transaction de migration échouer. Le nom de la table vient donc de
    -- `pg_class`, joint par `conrelid`.
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'Notification_type_check'
      AND t.relname = 'Notification'
  ) THEN
    ALTER TABLE "Notification" DROP CONSTRAINT "Notification_type_check";
  END IF;

  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_type_check"
    CHECK ("type" IN (
      'ai_response', 'project_created', 'mcp_created', 'mcp_access_request',
      'news', 'planning_task_completed', 'project_member_joined', 'quota_warning',
      'agent_run_finished', 'agent_run_failed', 'agent_approval_required',
      'agent_user_input_required',
      'vibe_like', 'vibe_repost', 'vibe_reply', 'vibe_mention', 'vibe_quote',
      'vibe_follow', 'vibe_dm', 'vibe_ai_digest', 'vibe_system',
      'wakies_reply'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint
-- La lecture des notifications filtre par origine : sans cet index, la
-- cloche mAI trierait toute la table pour afficher les trois applications.
CREATE INDEX IF NOT EXISTS "Notification_userId_origin_createdAt_idx"
  ON "Notification" USING btree ("userId", "origin", "createdAt");
