-- 022 — Livres publics + références de livres dans les posts (mention @ / attachement)
-- Miroir documentaire : exécuté via scripts/migrate.js (section 17)
-- + ensureBooksTables étendu (runtime, vibe-books.ts).

ALTER TABLE vibe_books ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS post_book_refs (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES vibe_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_post_book_refs_book ON post_book_refs(book_id);
