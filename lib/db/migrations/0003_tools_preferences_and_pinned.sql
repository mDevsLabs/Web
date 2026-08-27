-- Migration: AI Tools Preferences (Image/Audio) & Pinned/Renamed Generations
-- Idempotent: uses IF NOT EXISTS / DO blocks

--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_image_model') THEN
      ALTER TABLE "users" ADD COLUMN "default_image_model" text DEFAULT 'black-forest-labs/flux-schnell';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_image_size') THEN
      ALTER TABLE "users" ADD COLUMN "default_image_size" varchar(20) DEFAULT '1024x1024';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_audio_model') THEN
      ALTER TABLE "users" ADD COLUMN "default_audio_model" text DEFAULT 'deepgram/flux-tts:free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_audio_voice') THEN
      ALTER TABLE "users" ADD COLUMN "default_audio_voice" varchar(50) DEFAULT 'flux-alexis-en';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_audio_speed') THEN
      ALTER TABLE "users" ADD COLUMN "default_audio_speed" double precision DEFAULT 1.0;
    END IF;
  END IF;
END $$;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mprojects_image_generations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL,
  "api_key" text,
  "title" text,
  "pinned" boolean DEFAULT false NOT NULL,
  "model" text NOT NULL DEFAULT 'black-forest-labs/flux-schnell',
  "prompt" text NOT NULL,
  "negative_prompt" text,
  "width" integer DEFAULT 1024 NOT NULL,
  "height" integer DEFAULT 1024 NOT NULL,
  "image_url" text NOT NULL,
  "status" text DEFAULT 'completed' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE "mprojects_image_generations" ADD COLUMN IF NOT EXISTS "title" text;

--> statement-breakpoint
ALTER TABLE "mprojects_image_generations" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mprojects_image_generations_user_id_idx" ON "mprojects_image_generations" USING btree ("user_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mprojects_image_generations_pinned_idx" ON "mprojects_image_generations" USING btree ("user_id", "pinned");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mprojects_image_generations_created_at_idx" ON "mprojects_image_generations" USING btree ("created_at" DESC);

--> statement-breakpoint
ALTER TABLE "mprojects_speech_generations" ADD COLUMN IF NOT EXISTS "title" text;

--> statement-breakpoint
ALTER TABLE "mprojects_speech_generations" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mprojects_speech_generations_pinned_idx" ON "mprojects_speech_generations" USING btree ("user_id", "pinned");
