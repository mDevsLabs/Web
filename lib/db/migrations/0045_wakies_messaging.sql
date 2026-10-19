-- Migration 0045 : messagerie de groupe séquentielle et réponses structurées.
-- Additive et idempotente : sûre à rejouer sur une base déjà migrée.
--
-- Consolide le volet conversations de 0044 (groupes, épingles, réactions),
-- déjà porté en réparations dans `lib/db/migrate.ts` : rejouer ici est un
-- no-op sur une base à jour, et répare une base au journal incomplet.
-- Ajoute : réponse à un message (`replyToId`), auteur d'une réponse de groupe
-- (`authorWakieId`), accent couleur du Wakie (`accent`), et tours de génération
-- par participant (`WakiesChatTurn.wakieId`).
--
-- Le point délicat : l'index unique historique (conversation, message)
-- interdisait deux réponses au même message. Sans le remplacer, la deuxième
-- bulle d'un groupe serait rejetée en 409. Le nouvel index ajoute le Wakie.

-- Volet 0044 consolidé : conversation de groupe.
ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "isGroup" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WakiesConversationMember" (
  "conversationId" uuid NOT NULL REFERENCES "WakiesConversation"("id") ON DELETE CASCADE,
  "wakieId" uuid NOT NULL REFERENCES "WakiesWakie"("id") ON DELETE CASCADE,
  "isOrganizer" boolean DEFAULT false NOT NULL,
  "joinedAt" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("conversationId", "wakieId")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesConversationMember_wakieId_idx" ON "WakiesConversationMember" ("wakieId");
--> statement-breakpoint
-- Volet 0044 consolidé : épingles.
ALTER TABLE "WakiesMessage" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "WakiesMessage" ADD COLUMN IF NOT EXISTS "pinnedAt" timestamp;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesMessage_conversationId_pinned_idx" ON "WakiesMessage" ("conversationId", "pinned");
--> statement-breakpoint
-- Volet 0044 consolidé : réactions.
CREATE TABLE IF NOT EXISTS "WakiesMessageReaction" (
  "messageId" text NOT NULL REFERENCES "WakiesMessage"("id") ON DELETE CASCADE,
  "emoji" varchar(16) NOT NULL,
  "byWakieId" uuid REFERENCES "WakiesWakie"("id") ON DELETE CASCADE,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("messageId", "emoji", "byWakieId")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesMessageReaction_messageId_idx" ON "WakiesMessageReaction" ("messageId");
--> statement-breakpoint
-- Réponse à un message précis : citation structurée (exploitée au lot 2).
-- `SET NULL` : supprimer la cible ne doit jamais effacer la réponse.
ALTER TABLE "WakiesMessage" ADD COLUMN IF NOT EXISTS "replyToId" text REFERENCES "WakiesMessage"("id") ON DELETE SET NULL;
--> statement-breakpoint
-- Auteur d'un message assistant dans un groupe. NULL = l'organisateur du fil
-- (`WakiesConversation.wakieId`) : les fils 1:1 existants restent lisibles
-- sans réécriture, et un Wakie supprimé retombe sur l'organisateur.
ALTER TABLE "WakiesMessage" ADD COLUMN IF NOT EXISTS "authorWakieId" uuid REFERENCES "WakiesWakie"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesMessage_authorWakieId_idx" ON "WakiesMessage" ("authorWakieId");
--> statement-breakpoint
-- Accent couleur du Wakie (bulle et avatar). NULL = dérivé de la mascotte
-- côté lecture : aucun Wakie existant ne change d'apparence sans geste.
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "accent" varchar(16);
--> statement-breakpoint
-- Tours par participant : la colonne d'abord (nullable pour un déploiement
-- sans coupure : l'ancien code écrit sans `wakieId` tant qu'il tourne).
ALTER TABLE "WakiesChatTurn" ADD COLUMN IF NOT EXISTS "wakieId" uuid REFERENCES "WakiesWakie"("id") ON DELETE CASCADE;
--> statement-breakpoint
-- Reprise des tours historiques : chaque tour existant appartient au Wakie
-- organisateur de sa conversation (les conversations orphelines n'existent
-- pas : la clé étrangère est en cascade).
UPDATE "WakiesChatTurn" SET "wakieId" = (SELECT "wakieId" FROM "WakiesConversation" WHERE "WakiesConversation"."id" = "WakiesChatTurn"."conversationId") WHERE "wakieId" IS NULL;
--> statement-breakpoint
-- Durcissement opportuniste : seulement si la reprise n'a laissé aucun NULL
-- (un tour inséré entre la reprise et ce bloc reste nullable, sans échec).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM "WakiesChatTurn" WHERE "wakieId" IS NULL) THEN
    ALTER TABLE "WakiesChatTurn" ALTER COLUMN "wakieId" SET NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
-- Remplacement de l'index : l'ancien interdisait N réponses au même message.
DROP INDEX IF EXISTS "WakiesChatTurn_conversation_message_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "WakiesChatTurn_conversation_message_wakie_idx" ON "WakiesChatTurn" ("conversationId", "messageId", "wakieId");
