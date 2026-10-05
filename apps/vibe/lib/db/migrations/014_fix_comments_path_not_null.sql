-- ============================================================================
-- MIGRATION 014 — CORRECTION CONTRAINTE NOT NULL SUR COMMENTS.PATH
-- Rendre la colonne path optionnelle sur comments si elle existe
-- et créer la table comment_likes si absente.
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'path'
    ) THEN
        ALTER TABLE comments ALTER COLUMN path DROP NOT NULL;
        ALTER TABLE comments ALTER COLUMN path SET DEFAULT '';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, comment_id)
);
