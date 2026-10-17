-- ============================================================================
-- VIBE — MIGRATION 008 : Posts générés par IA, citations & feedback d'algorithme
-- Toutes les opérations sont idempotentes (ADD COLUMN IF NOT EXISTS).
-- NOTE : scripts/migrate.js applique ces ALTERs ; le backend les garantit
-- aussi à l'exécution (pattern "ensure" paresseux, cf. vibe-posts.ts /
-- vibe-settings.ts) pour les déploiements sans migration manuelle.
-- ============================================================================

-- Badge « Créé avec l'IA » déclaré par l'utilisateur (ou défaut de ses réglages)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;

-- Post original cité (quote-post) : publication intégrée, distincte du repost
ALTER TABLE posts ADD COLUMN IF NOT EXISTS quoted_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- Réglage : les nouvelles publications de l'utilisateur sont-elles marquées
-- « créées avec l'IA » par défaut ?
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS posts_ai_generated_by_default BOOLEAN DEFAULT FALSE;

-- Index de lecture pour l'attachement des citations dans les fils
CREATE INDEX IF NOT EXISTS idx_posts_quoted_post_id ON posts(quoted_post_id) WHERE quoted_post_id IS NOT NULL;
