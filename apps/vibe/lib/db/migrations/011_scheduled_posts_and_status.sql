-- ============================================================================
-- MIGRATION 011 — STATUT DE PUBLICATION & VIBES PLANIFIÉES
-- ============================================================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
UPDATE posts SET status = 'published' WHERE status IS NULL;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_status_vis_pub ON posts(status, visibility, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_due ON posts(status, scheduled_at) WHERE status = 'scheduled';
