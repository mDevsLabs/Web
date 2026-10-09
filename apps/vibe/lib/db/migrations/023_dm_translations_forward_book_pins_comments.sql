-- ============================================================================
-- mAI Vibe — Migration 021 : Réponses & traduction des DM, suppression locale,
-- transfert, gestion de groupe, épingles et discussion des Livres
-- Miroir SQL des fonctions ensure* (vibe-dms.ts, vibe-books.ts,
-- vibe-settings.ts). 100 % idempotent.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. MESSAGES : traduction mémorisée, transfert (attribution),
--    suppression locale (« supprimer pour moi »)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS forwarded_from JSONB;

-- Messages de groupe : pas de destinataire unique (lecture suivie via read_by)
-- + groupes : participant_two_id NULL (plusieurs groupes par compte malgré
-- UNIQUE(participant_one_id, participant_two_id) — les NULL sont distincts).
ALTER TABLE direct_messages ALTER COLUMN recipient_id DROP NOT NULL;
ALTER TABLE dm_conversations ALTER COLUMN participant_two_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS dm_hidden_messages (
    user_id BIGINT NOT NULL,
    message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_hidden_user ON dm_hidden_messages(user_id);

-- ─────────────────────────────────────────────────────────────
-- 2. RÉGLAGES : traduction automatique des messages entrants
-- ─────────────────────────────────────────────────────────────
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS dm_auto_translate BOOLEAN DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS dm_translate_lang TEXT;

-- ─────────────────────────────────────────────────────────────
-- 3. LIVRES : épingles de contenu (max 3 par Livre) + discussion
-- ─────────────────────────────────────────────────────────────
ALTER TABLE vibe_book_items ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE vibe_book_items ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;
ALTER TABLE vibe_book_items ADD COLUMN IF NOT EXISTS pinned_by BIGINT;

CREATE TABLE IF NOT EXISTS vibe_book_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES vibe_books(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_comments_book ON vibe_book_comments(book_id, created_at DESC);
