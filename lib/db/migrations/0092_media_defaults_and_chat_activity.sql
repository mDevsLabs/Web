-- Migration 0092 : suivi du dernier message sur Chat (tri sidebar + section Épinglés)
-- et alignement des modèles image/audio par défaut sur les catalogues réels en base.
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "Chat"
  ADD COLUMN IF NOT EXISTS "lastMessageAt" timestamp DEFAULT now() NOT NULL;

--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public."Message_v2"') IS NOT NULL THEN
    UPDATE "Chat" c
    SET "lastMessageAt" = GREATEST(
      c."createdAt",
      COALESCE(
        (SELECT MAX(m."createdAt") FROM "Message_v2" m WHERE m."chatId" = c."id"),
        c."createdAt"
      )
    )
    WHERE c."lastMessageAt" IS DISTINCT FROM GREATEST(
      c."createdAt",
      COALESCE(
        (SELECT MAX(m."createdAt") FROM "Message_v2" m WHERE m."chatId" = c."id"),
        c."createdAt"
      )
    );
  END IF;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Chat_userId_pinned_lastMessageAt_idx"
  ON "Chat" ("userId", "pinned" DESC, "lastMessageAt" DESC);

--> statement-breakpoint
ALTER TABLE "user_preferences"
  ALTER COLUMN "defaultImageModel" SET DEFAULT 'black-forest-labs/flux-1.1-pro';

--> statement-breakpoint
ALTER TABLE "user_preferences"
  ALTER COLUMN "defaultAudioModel" SET DEFAULT 'heygen/heygen-voice-1-turbo:free';

--> statement-breakpoint
ALTER TABLE "user_preferences"
  ALTER COLUMN "defaultAudioVoice" SET DEFAULT 'nadine';

--> statement-breakpoint
UPDATE "user_preferences"
SET "defaultImageModel" = 'black-forest-labs/flux-1.1-pro'
WHERE "defaultImageModel" IN (
  'black-forest-labs/flux-schnell',
  'black-forest-labs/flux-1-schnell',
  'flux-schnell',
  'flux-1-schnell'
);

--> statement-breakpoint
UPDATE "user_preferences"
SET
  "defaultAudioModel" = 'heygen/heygen-voice-1-turbo:free',
  "defaultAudioVoice" = CASE
    WHEN "defaultAudioVoice" IN (
      'flux-alexis-en',
      'flux-michael-en',
      'flux-stacy-en',
      'flux-sam-en',
      'flux-asteria-en',
      'flux-orion-en',
      'flux-alexis-fr',
      'flux-jeanne-fr'
    ) THEN 'nadine'
    ELSE "defaultAudioVoice"
  END
WHERE "defaultAudioModel" IN (
  'deepgram/flux-tts:free',
  'openai/tts-1',
  'openai/tts-1-hd'
);
