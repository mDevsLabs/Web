-- ============================================================================
-- VIBE SOCIAL PLATFORM — MIGRATION 001: CORE SCHEMA (POSTGRESQL NEON)
-- Core Tables: Profiles, Posts, Interactions, Comments, Follows, Media
-- ============================================================================

-- 1. Table Profils Utilisateurs Étendus
CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    website VARCHAR(255),
    location VARCHAR(100),
    interests TEXT[] DEFAULT '{}',
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 100,
    showcase_layout VARCHAR(20) DEFAULT 'stream',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Publications (Posts / Vibes)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    format VARCHAR(30) DEFAULT 'micro_text',
    visibility VARCHAR(20) DEFAULT 'public',
    likes_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    bookmarks_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    toxicity_score NUMERIC(5, 4) DEFAULT 0.0,
    sentiment_score NUMERIC(5, 4) DEFAULT 0.5,
    is_sensitive BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_via VARCHAR(30) DEFAULT 'web',
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);

-- 3. Table des Actifs Médias Associés aux Posts
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image/jpeg',
    file_size_bytes BIGINT DEFAULT 0,
    alt_text TEXT DEFAULT '',
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_post_id ON media_assets(post_id);

-- 4. Table des Interactions (Likes, Reposts, Bookmarks)
CREATE TABLE IF NOT EXISTS post_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id, interaction_type)
);

CREATE INDEX IF NOT EXISTS idx_interactions_user ON post_interactions(user_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_post ON post_interactions(post_id, interaction_type);

-- 5. Table des Commentaires et Réponses
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    depth INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

-- 6. Table des Abonnements (Follows)
CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
