-- ============================================================================
-- mAI Vibe — Migration 017 : Stats créateur (sources + visites profil)
-- Miroir SQL de ensurePostColumns() pour les séries temporelles.
-- 100 % idempotent : CREATE TABLE/INDEX IF NOT EXISTS, ADD COLUMN IF NOT EXISTS.
-- NOTE : post_views est normalement créé au runtime par ensurePostColumns()
-- (vibe-posts-core.ts). On le (re)crée ici pour que la migration soit
-- autonome et ne casse pas sur une base neuve (SQLSTATE 42P01).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- 0. TABLE post_views (profil temporel des vues)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    duration_ms INT NOT NULL DEFAULT 1000,
    dwell_ms INT NOT NULL DEFAULT 1000,
    visible_ratio FLOAT DEFAULT 0.5,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_views_user ON post_views(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_views_post ON post_views(post_id);

-- ─────────────────────────────────────────────────────────────
-- 1. SOURCE DE TRAFIC SUR post_views (feed|profile|detail|search|dm|trends)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE post_views ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'feed';
CREATE INDEX IF NOT EXISTS idx_views_post_created ON post_views(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_views_created ON post_views(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 2. VISITES PROFIL (distinct des vues posts / impressions feed)
-- Anti-spam applicatif : 1 visite/viewer/24h (clause EXISTS côté handler).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    source TEXT DEFAULT 'profile',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views(profile_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_created ON profile_views(created_at DESC);
