-- Migration 0043 : un tour ne doit pas lancer deux générations ni débiter deux usages après un rejeu.
-- Additive et idempotente ; les conversations et messages existants restent intacts.
CREATE TABLE IF NOT EXISTS "WakiesChatTurn" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "conversationId" uuid NOT NULL REFERENCES "WakiesConversation"("id") ON DELETE CASCADE,
  "messageId" text NOT NULL,
  "responseId" uuid DEFAULT gen_random_uuid() NOT NULL,
  "status" varchar(16) DEFAULT 'running' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "WakiesChatTurn_conversation_message_idx" ON "WakiesChatTurn" ("conversationId", "messageId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesChatTurn_user_conversation_idx" ON "WakiesChatTurn" ("userId", "conversationId");

