-- ============================================================================
-- mAI Vibe — Migration 024 : Discussion des Livres — réponses citées et
-- réactions emoji (miroir SQL de ensureBooksTables, vibe-books.ts).
-- 100 % idempotent.
-- ============================================================================

-- Réponse citée : le commentaire ciblé peut être supprimé sans casser le fil
ALTER TABLE vibe_book_comments ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES vibe_book_comments(id) ON DELETE SET NULL;

-- Réactions emoji des membres (modèle dm_reactions)
CREATE TABLE IF NOT EXISTS vibe_book_comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES vibe_book_comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_book_comment_reactions_comment ON vibe_book_comment_reactions(comment_id);
