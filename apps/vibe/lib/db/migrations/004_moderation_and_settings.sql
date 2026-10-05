-- ============================================================================
-- VIBE SOCIAL PLATFORM — MIGRATION 004: MODERATION & USER SETTINGS
-- Tables for Content Moderation, Age Verification, Verification Badges, Settings
-- ============================================================================

-- 1. Table des Paramètres Utilisateur Détaillés
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    notify_on_like BOOLEAN DEFAULT TRUE,
    notify_on_repost BOOLEAN DEFAULT TRUE,
    notify_on_reply BOOLEAN DEFAULT TRUE,
    notify_on_dm BOOLEAN DEFAULT TRUE,
    content_filter_level VARCHAR(20) DEFAULT 'medium',
    blur_sensitive_content BOOLEAN DEFAULT TRUE,
    allow_dms_from VARCHAR(20) DEFAULT 'everyone',
    age_restriction_enabled BOOLEAN DEFAULT FALSE,
    theme_preference VARCHAR(20) DEFAULT 'monochrome_dark',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Demandes et Enregistrements de Vérification (Badges)
CREATE TABLE IF NOT EXISTS verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'approved',
    badge_label VARCHAR(50),
    document_hash TEXT,
    liveness_score NUMERIC(5, 4) DEFAULT 1.0,
    fraud_risk_score NUMERIC(5, 4) DEFAULT 0.0,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_user ON verification_records(user_id);

-- 3. Table des Signalements et Modération
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL,
    details TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    ai_moderation_verdict JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des Signets (Bookmarks)
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
