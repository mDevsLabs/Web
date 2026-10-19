-- 021 — Épinglage de posts sur le profil (max 2, y compris les posts d'autres comptes)
-- Miroir documentaire : exécuté via scripts/migrate.js (section 17)
-- + ensureProfilePinnedPostsTable (runtime, vibe-posts-core.ts).

CREATE TABLE IF NOT EXISTS profile_pinned_posts (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_pinned_user ON profile_pinned_posts(user_id, created_at DESC);
