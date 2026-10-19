-- Les réponses interrompues restent lisibles, mais ne déclenchent aucune alerte.
CREATE TABLE IF NOT EXISTS "WakiesNotification" (
  "seq" serial PRIMARY KEY,
  "userId" text NOT NULL,
  "conversationId" uuid NOT NULL REFERENCES "WakiesConversation"("id") ON DELETE CASCADE,
  "messageId" text NOT NULL UNIQUE REFERENCES "WakiesMessage"("id") ON DELETE CASCADE,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesNotification_userId_seq_idx" ON "WakiesNotification" ("userId", "seq");
--> statement-breakpoint
-- Une clé primaire rendait byWakieId obligatoire et empêchait les réactions humaines.
-- La clé calculée conserve l'unicité de chaque auteur, y compris l'utilisateur.
ALTER TABLE "WakiesMessageReaction" ADD COLUMN IF NOT EXISTS "actorKey" text GENERATED ALWAYS AS (coalesce("byWakieId"::text, 'user')) STORED;
--> statement-breakpoint
ALTER TABLE "WakiesMessageReaction" DROP CONSTRAINT IF EXISTS "WakiesMessageReaction_pkey";
--> statement-breakpoint
ALTER TABLE "WakiesMessageReaction" DROP CONSTRAINT IF EXISTS "WakiesMessageReaction_messageId_emoji_byWakieId_pk";
--> statement-breakpoint
ALTER TABLE "WakiesMessageReaction" ALTER COLUMN "byWakieId" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "WakiesMessageReaction" ALTER COLUMN "actorKey" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"WakiesMessageReaction"'::regclass AND contype = 'p') THEN
    ALTER TABLE "WakiesMessageReaction" ADD CONSTRAINT "WakiesMessageReaction_messageId_emoji_actorKey_pk" PRIMARY KEY ("messageId", "emoji", "actorKey");
  END IF;
END $$;
