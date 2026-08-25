-- Migration: Speech API (Text-to-Speech) & Weekly Quotas Tracking
-- Idempotent: uses IF NOT EXISTS / DO blocks

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS weekly_speech_usage (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  requests_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT weekly_speech_usage_user_week_unique UNIQUE (user_id, week_start)
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS weekly_speech_usage_user_id_idx ON weekly_speech_usage USING btree (user_id);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS weekly_speech_usage_week_start_idx ON weekly_speech_usage USING btree (week_start);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS mprojects_speech_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  api_key TEXT,
  model TEXT NOT NULL DEFAULT 'deepgram/flux-tts:free',
  voice TEXT DEFAULT 'flux-alexis-en',
  input_text TEXT NOT NULL,
  tokens_count INTEGER NOT NULL DEFAULT 0,
  character_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS mprojects_speech_generations_user_id_idx ON mprojects_speech_generations USING btree (user_id);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS mprojects_speech_generations_created_at_idx ON mprojects_speech_generations USING btree (created_at DESC);
