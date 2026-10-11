-- Migration 0044 : vie sociale des Wakies — profils, galerie, amis, groupes
-- de conversation, épingles de messages et réactions.
-- Additive et idempotente : sûre à rejouer sur une base déjà migrée.

-- Visibilité publique et pseudo recherchable sur le Wakie.
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "isPublic" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "handle" varchar(30);
--> statement-breakpoint
-- Pseudo unique quand il est renseigné : deux Wakies publics ne partagent jamais le même handle.
CREATE UNIQUE INDEX IF NOT EXISTS "WakiesWakie_handle_key" ON "WakiesWakie" ("handle") WHERE "handle" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesWakie_isPublic_idx" ON "WakiesWakie" ("isPublic") WHERE "isPublic" = true;
--> statement-breakpoint
-- Profil social : bio, avatar, bannière et liens. Une ligne par Wakie, créée à la lecture.
CREATE TABLE IF NOT EXISTS "WakiesWakieProfile" (
  "wakieId" uuid PRIMARY KEY NOT NULL REFERENCES "WakiesWakie"("id") ON DELETE CASCADE,
  "bio" text DEFAULT '' NOT NULL,
  "avatarPath" text,
  "bannerPath" text,
  "links" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Galerie d'images du profil social. Le quota est volumétrique par Wakie (Plus 10, Pro 50, Max illimité).
CREATE TABLE IF NOT EXISTS "WakiesWakieImage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "wakieId" uuid NOT NULL REFERENCES "WakiesWakie"("id") ON DELETE CASCADE,
  "blobPathname" text NOT NULL,
  "alt" text DEFAULT '' NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesWakieImage_wakieId_position_idx" ON "WakiesWakieImage" ("wakieId", "position");
--> statement-breakpoint
-- Amis : un abonnement d'un compte vers un Wakie public. Le propriétaire est dénormalisé pour purger sans jointure.
CREATE TABLE IF NOT EXISTS "WakiesFriend" (
  "subscriberUserId" text NOT NULL,
  "wakieId" uuid NOT NULL REFERENCES "WakiesWakie"("id") ON DELETE CASCADE,
  "ownerUserId" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("subscriberUserId", "wakieId")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesFriend_subscriber_idx" ON "WakiesFriend" ("subscriberUserId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesFriend_wakie_idx" ON "WakiesFriend" ("wakieId");
--> statement-breakpoint
-- Conversation de GROUPE : participants mentionnables individuellement ou
-- collectivement (@all). Le Wakie organisateur (WakiesConversation.wakieId)
-- figure toujours dans les membres.
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
-- Message ÉPINGLÉ par le compte : la bande « Épinglés » du fil de lecture sert
-- ces lignes. Le geste appartient au compte, jamais au Wakie.
ALTER TABLE "WakiesMessage" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "WakiesMessage" ADD COLUMN IF NOT EXISTS "pinnedAt" timestamp;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesMessage_conversationId_pinned_idx" ON "WakiesMessage" ("conversationId", "pinned");
--> statement-breakpoint
-- Réaction posée sur un message. La clé (message, émoji, auteur) rend la pose
-- idempotente ; byWakieId est NULL pour une réaction posée par le compte.
CREATE TABLE IF NOT EXISTS "WakiesMessageReaction" (
  "messageId" text NOT NULL REFERENCES "WakiesMessage"("id") ON DELETE CASCADE,
  "emoji" varchar(16) NOT NULL,
  "byWakieId" uuid REFERENCES "WakiesWakie"("id") ON DELETE CASCADE,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("messageId", "emoji", "byWakieId")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesMessageReaction_messageId_idx" ON "WakiesMessageReaction" ("messageId");
