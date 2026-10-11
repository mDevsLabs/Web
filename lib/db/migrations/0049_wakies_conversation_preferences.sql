-- Les préférences de messagerie appartiennent au compte et suivent ses appareils.
-- Migration additive et idempotente, sans modification des messages existants.
ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "favorite" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "muted" boolean DEFAULT false NOT NULL;
