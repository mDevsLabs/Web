-- Migration 0048 : état de LECTURE d'une conversation (compteur de non-lus).
-- Additive et idempotente : sûre à rejouer sur une base déjà migrée.
--
-- POURQUOI UN CURSEUR `seq` ET NON UN HORODATAGE
--
-- `seq` est le seul ordre MONOTONE de `WakiesMessage` : deux messages d'une
-- même salve de groupe partagent leur `createdAt`, et un curseur daté
-- laisserait l'un des deux éternellement « non lu ». Le curseur est un `seq`
-- de message, comparé strictement (`seq > lastReadSeq`).
--
-- Défaut 0 : toutes les conversations existantes partent de « rien n'a été
-- lu ». C'est le choix honnête — on ne peut pas inventer rétroactivement ce
-- que le compte avait lu — et il est rattrapable en une ouverture de
-- conversation, la route `read` acceptant le `seq` réellement visible.

ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "lastReadSeq" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesConversation_userId_lastRead_idx" ON "WakiesConversation" ("userId", "lastReadSeq");
