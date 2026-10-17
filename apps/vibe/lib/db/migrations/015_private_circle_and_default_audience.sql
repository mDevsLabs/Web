-- ============================================================================
-- mAI Vibe — Migration 015 : Cercle Privé & Audience par défaut des Vibes
-- ============================================================================

-- 1. Table explicite pour chaque cercle privé utilisateur
CREATE TABLE IF NOT EXISTS user_circles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Cercle Privé',
    description TEXT DEFAULT 'Personnes autorisées à voir mes Vibes privées',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_user_circles_user ON user_circles(user_id);

-- 2. Table des membres de chaque cercle privé
CREATE TABLE IF NOT EXISTS circle_members (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    circle_id INTEGER REFERENCES user_circles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, member_user_id)
);
CREATE INDEX IF NOT EXISTS idx_circle_member ON circle_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_circle_user ON circle_members(user_id);

-- Assurer la colonne circle_id dans circle_members si la table existait déjà
ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS circle_id INTEGER REFERENCES user_circles(id) ON DELETE CASCADE;

-- 3. Préférence d'audience par défaut dans user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS default_vibe_audience VARCHAR(32) DEFAULT 'public';

-- 4. Table SQL dédiée pour la préférence d'audience des Vibes
CREATE TABLE IF NOT EXISTS vibe_audience_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_audience VARCHAR(32) NOT NULL DEFAULT 'public',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vibe_audience_user ON vibe_audience_preferences(user_id);
