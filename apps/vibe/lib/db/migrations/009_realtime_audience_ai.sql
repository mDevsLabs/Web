-- ============================================================================
-- mAI Vibe — Migration 009 : temps réel, audience (Cercle Privé) & outils IA
-- Idempotente : peut être ré-exécutée sans risque. Le backend applique aussi
-- ces éléments paresseusement au runtime (ensureRealtimeTables, ensureCircleTable,
-- ensureTranslationsTable, ensurePersonalizationColumns).
-- ============================================================================

-- Événements temps réel transitoires (typing, dm_message, post_stats)
-- lus par le flux SSE (realtime.ts) — purge automatique > 2 minutes.
CREATE TABLE IF NOT EXISTS realtime_events (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_realtime_user ON realtime_events(user_id, id);

-- Cercle Privé : membres autorisés à voir les posts visibility = 'circle'
CREATE TABLE IF NOT EXISTS circle_members (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, member_user_id)
);
CREATE INDEX IF NOT EXISTS idx_circle_member ON circle_members(member_user_id);

-- Cache des traductions « Traduire avec mAI » (détection de langue + traduction)
CREATE TABLE IF NOT EXISTS post_translations (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    target_lang TEXT NOT NULL,
    detected_language TEXT,
    translation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, target_lang)
);

-- Réglages mAI : modèle par défaut (toutes les requêtes mAI) + voix de lecture
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_default_model TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_tts_voice TEXT;
