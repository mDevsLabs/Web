-- ============================================================================
-- MIGRATION 012 — LANGUE DE L'INTERFACE & TRADUCTION DEEPL
-- Préférence de langue de traduction (user_settings.ui_language ; NULL =
-- langue du navigateur) + cache des traductions DeepL.
-- post_translations (posts) est créée paresseusement par vibe-ai.ts /
-- translate.ts ; enregistrement canonique ici avec la colonne provider
-- ('deepl' | 'mai') qui distingue le moteur utilisé.
-- ============================================================================

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS ui_language TEXT;

CREATE TABLE IF NOT EXISTS post_translations (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    target_lang TEXT NOT NULL,
    detected_language TEXT,
    translation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, target_lang)
);
ALTER TABLE post_translations ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'mai';

CREATE TABLE IF NOT EXISTS comment_translations (
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    target_lang TEXT NOT NULL,
    detected_language TEXT,
    translation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (comment_id, target_lang)
);
