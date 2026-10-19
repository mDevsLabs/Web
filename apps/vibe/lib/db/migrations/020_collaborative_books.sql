-- ============================================================================
-- mAI Vibe — Migration 020 : Livres collaboratifs
-- Code de partage (lien/code), membres (owner/member), attribution des Vibe
-- ajoutées. Miroir SQL de ensureBooksTables() (vibe-books.ts). 100 % idempotent.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. LIVRES : code de partage + horodatage de mise à jour
--    join_code NULL pour les Livres legacy : backfill runtime (alphabet
--    non ambigu, retry de collision) dans vibe-books.ts#ensureBooksTables.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE vibe_books ADD COLUMN IF NOT EXISTS join_code VARCHAR(12);
ALTER TABLE vibe_books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS idx_vibe_books_join_code
    ON vibe_books(join_code) WHERE join_code IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. MEMBRES D'UN LIVRE (créateur inclus, role 'owner')
--    L'adhésion est immédiate via lien/code ; le créateur reste
--    vibe_books.user_id — cette table est l'annuaire des membres.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vibe_book_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES vibe_books(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (book_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_book_members_book ON vibe_book_members(book_id);
CREATE INDEX IF NOT EXISTS idx_book_members_user ON vibe_book_members(user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. ATTRIBUTION : qui a partagé chaque Vibe dans le Livre
-- ─────────────────────────────────────────────────────────────
ALTER TABLE vibe_book_items ADD COLUMN IF NOT EXISTS added_by BIGINT;

-- ─────────────────────────────────────────────────────────────
-- 4. BACKFILL : inscrire les créateurs existants comme membres propriétaires
-- ─────────────────────────────────────────────────────────────
INSERT INTO vibe_book_members (book_id, user_id, role)
SELECT b.id, b.user_id, 'owner' FROM vibe_books b
WHERE NOT EXISTS (SELECT 1 FROM vibe_book_members m WHERE m.book_id = b.id AND m.user_id = b.user_id);
