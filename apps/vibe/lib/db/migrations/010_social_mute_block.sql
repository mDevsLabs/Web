-- ============================================================================
-- MIGRATION 010 — GRAPH SOCIAL : MUTE (masquage silencieux) & normalisation
-- du blocage. Idempotent.
--   • muted_users  : un utilisateur masque les publications/notifications
--     d'un autre, sans que celui-ci ne s'en rende compte.
--   • blocked_users: table créée à l'origine à l'exécution par vibe-dms.ts
--     (ensureDMTables) ; formalisée ici pour traçabilité. Le CREATE IF NOT
--     EXISTS est sans effet si la table existe déjà avec ses BIGINT.
-- ============================================================================

CREATE TABLE IF NOT EXISTS muted_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    muted_user_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, muted_user_id)
);

CREATE INDEX IF NOT EXISTS idx_muted_users_user ON muted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_muted_users_muted ON muted_users(muted_user_id);

CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    blocked_user_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_user ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_user_id);
