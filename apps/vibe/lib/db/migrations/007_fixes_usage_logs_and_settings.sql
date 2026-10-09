-- ============================================================================
-- VIBE SOCIAL PLATFORM — MIGRATION 007: CORRECTIONS & TABLES MANQUANTES
-- Corrige les incohérences de schéma, ajoute usage_logs, dms_enabled,
-- unifie allow_dms (renomme allow_dms_from), ajoute les index de performance
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLE usage_logs — Manquante (causait des erreurs silencieuses)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) DEFAULT 'api_call',
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    endpoint VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLE weekly_usage — Assure l'existence (peut être déjà présente)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_usage_user ON weekly_usage(user_id, week_start);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLE daily_image_usage — Assure l'existence
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_image_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    images_generated INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_image_usage_user ON daily_image_usage(user_id, usage_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. user_settings — Corrections & colonnes manquantes
-- ─────────────────────────────────────────────────────────────────────────────

-- Ajouter allow_dms (unifier allow_dms_from → allow_dms)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS allow_dms VARCHAR(20) DEFAULT 'everyone';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS dms_enabled BOOLEAN DEFAULT TRUE;

-- Copier les valeurs existantes de allow_dms_from vers allow_dms de manière sécurisée (si la colonne existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'allow_dms_from'
    ) THEN
        EXECUTE 'UPDATE user_settings SET allow_dms = allow_dms_from WHERE allow_dms = ''everyone'' AND allow_dms_from IS NOT NULL AND allow_dms_from != ''everyone''';
    END IF;
END $$;

-- Ajouter blur_sensitive_content si manquant
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS blur_sensitive_content BOOLEAN DEFAULT TRUE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. posts — Assurer que parent_post_id existe pour les reposts
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE posts ADD COLUMN IF NOT EXISTS parent_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_repost BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_posts_parent ON posts(parent_post_id) WHERE parent_post_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. profiles — Ajouter updated_at si manquant
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. notifications — Assurer la colonne is_read
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read)
WHERE is_read = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. direct_messages — Assurer les colonnes read_at et is_read
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_dm_unread ON direct_messages(recipient_id, is_read)
WHERE is_read = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. post_interactions — Index composé optimisé (si pas déjà fait)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_post_interactions_lookup
    ON post_interactions(post_id, interaction_type, user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Commentaire final
-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 007 terminée : usage_logs créée, user_settings corrigée,
-- weekly_usage & daily_image_usage assurées, index de performance ajoutés.
-- ============================================================================
