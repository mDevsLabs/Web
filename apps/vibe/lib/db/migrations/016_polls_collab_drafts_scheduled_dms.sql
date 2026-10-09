-- ============================================================================
-- mAI Vibe — Migration 016 : Sondages, Co-signature, Brouillons serveur,
-- DMs programmés/épinglés & Réglages (thème programmé, onboarding, mAI)
-- Miroir SQL des fonctions ensure* (vibe-posts.ts, vibe-dms.ts, vibe-settings.ts).
-- 100 % idempotent : CREATE TABLE/INDEX IF NOT EXISTS, ADD COLUMN IF NOT EXISTS.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. SONDAGES INTÉGRÉS AUX POSTS (vote unique modifiable)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    total_votes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS post_poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES post_polls(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    votes_count INT DEFAULT 0,
    position INT NOT NULL
);
CREATE TABLE IF NOT EXISTS post_poll_votes (
    poll_id UUID NOT NULL,
    user_id BIGINT NOT NULL,
    option_id UUID NOT NULL,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (poll_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_polls_post ON post_polls(post_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON post_poll_options(poll_id);

-- ─────────────────────────────────────────────────────────────
-- 2. POSTS COLLABORATIFS (co-signature : pending | accepted | declined)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_collaborators (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    PRIMARY KEY (post_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- 3. BROUILLONS MULTI-APPAREILS (sync serveur, complément du cookie local)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    html TEXT NOT NULL,
    text TEXT NOT NULL,
    visibility VARCHAR(20) DEFAULT 'public',
    scheduled_at TIMESTAMPTZ,
    ai_generated BOOLEAN DEFAULT FALSE,
    media_assets JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drafts_user ON post_drafts(user_id, updated_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 4. ORDRE D'AFFICHAGE DES MÉDIAS (carrousel + drag & drop)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS position INT DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- 5. DMS PROGRAMMÉS (même mécanique que les posts planifiés)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS send_at TIMESTAMPTZ;
UPDATE direct_messages SET status = 'sent' WHERE status IS NULL;
CREATE INDEX IF NOT EXISTS idx_dm_scheduled ON direct_messages(status, send_at) WHERE status = 'scheduled';

-- ─────────────────────────────────────────────────────────────
-- 6. MESSAGES DM ÉPINGLÉS (max 3 par conversation, cf. PIN_LIMIT applicatif)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dm_pinned_messages (
    conversation_id UUID NOT NULL,
    message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
    pinned_by BIGINT NOT NULL,
    pinned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, message_id)
);

-- ─────────────────────────────────────────────────────────────
-- 7. RÉGLAGES : thème programmé, onboarding, contexte mAI (opt-in)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS scheduled_theme TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_context_posts BOOLEAN DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_context_dms BOOLEAN DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_context_books BOOLEAN DEFAULT FALSE;
