-- ============================================================================
-- mAI Vibe — Migration 026 : Stories (publications éphémères de 24 h).
-- Miroir SQL de vibe-stories.ts / ensureStoriesTables (le runtime crée tout de
-- façon idempotente). 100 % idempotent, additif uniquement.
--
-- Cycle de vie : une story est « live » tant que deleted_at IS NULL ET que son
-- expires_at n'est pas dépassé. Passé ce délai elle bascule en archive sur le
-- profil, sans job ni cron : l'expiration est un prédicat de lecture. La
-- suppression explicite reste un soft-delete (deleted_at), donc réversible.
--
-- Le compteur quotidien est une table DÉDIÉE (vibe_story_usage_daily) et non
-- daily_image_usage : une story n'est pas une image générée par l'IA, et
-- partager le compteur corromprait les deux quotas. Sa clé `usage_date` est
-- écrite par l'application en date locale Europe/Paris, jamais par
-- CURRENT_DATE (qui est UTC) — voir l'en-tête de vibe-stories.ts.
-- ============================================================================

-- 1. Story : un auteur, une durée de vie, une visibilité
CREATE TABLE IF NOT EXISTS vibe_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption TEXT,
  visibility VARCHAR(20) NOT NULL DEFAULT 'followers',
  expires_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vibe_stories_visibility_check
    CHECK (visibility IN ('followers', 'public', 'private'))
);

-- Tri du rail (auteur, plus récente d'abord, expirées exclues) et balayage d'un
-- auteur. Le prédicat ne porte que sur deleted_at : un index partiel refuse
-- toute condition non immuable, donc `expires_at > NOW()` n'y aurait pas sa
-- place — le filtre d'expiration se fait à la lecture.
CREATE INDEX IF NOT EXISTS idx_stories_author_active
  ON vibe_stories(user_id, expires_at DESC)
  WHERE deleted_at IS NULL;

-- 2. Médias d'une story (photo et/ou vidéo, ordonnés, jusqu'à STORY_MAX_ITEMS)
CREATE TABLE IF NOT EXISTS vibe_story_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES vibe_stories(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  pathname TEXT,
  media_type VARCHAR(20) NOT NULL,
  file_size_bytes BIGINT,
  position SMALLINT NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vibe_story_media_type_check
    CHECK (media_type IN ('image', 'video'))
);
CREATE INDEX IF NOT EXISTS idx_story_media_position
  ON vibe_story_media(story_id, position);

-- 3. Vues : une ligne par spectateur et par story. La clé composée dédoublonne
-- d'office, donc revoir une story ne gonfle pas le compteur — et le compteur
-- exact (COUNT(*)) est ce que l'auteur consulte dans sa liste de vues.
CREATE TABLE IF NOT EXISTS vibe_story_views (
  story_id UUID NOT NULL REFERENCES vibe_stories(id) ON DELETE CASCADE,
  viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (story_id, viewer_id)
);
CREATE INDEX IF NOT EXISTS idx_story_views_recent
  ON vibe_story_views(story_id, viewed_at DESC);

-- 4. Réactions rapides. Un emoji par spectateur et par story : rejouer le même
-- emoji est un no-op, pas un cumul.
CREATE TABLE IF NOT EXISTS vibe_story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES vibe_stories(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (story_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story
  ON vibe_story_reactions(story_id);

-- 5. Quota journalier de publication, par forfait (1 / 5 / 10 / illimité).
-- Clé (user_id, usage_date) : l'upsert ON CONFLICT est idempotent, et une date
-- écoulée n'est jamais recalculée.
CREATE TABLE IF NOT EXISTS vibe_story_usage_daily (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  stories_created INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date)
);
CREATE INDEX IF NOT EXISTS idx_story_usage_date
  ON vibe_story_usage_daily(usage_date);
