-- ============================================================================
-- mAI Vibe — Migration 019 : Messages de groupe, Co-auteurs auto-acceptés,
-- Outils mAI (catalogue lib/tools), Mentions urgentes (@tous / @user)
-- Miroir SQL des fonctions ensure* (vibe-dms.ts, vibe-posts-crud.ts,
-- vibe-settings.ts, lib/tools/index.ts). 100 % idempotent.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. CONVERSATIONS DE GROUPE
--    dm_conversations reste la table pivot : les conversations 1-1
--    (participant_one_id / participant_two_id) coexistent avec les groupes
--    (is_group = TRUE, participant_one_id = créateur/admin).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS group_avatar_url TEXT;
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dm_conv_is_group ON dm_conversations(is_group);

-- ─────────────────────────────────────────────────────────────
-- 2. MEMBRES DE GROUPE (admin unique = créateur)
--    Les nouveaux membres récupèrent tout l'historique : les messages
--    sont adressés par conversation_id, le fetch inclut tous les membres.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dm_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    added_by BIGINT,
    UNIQUE (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_group_members_conv ON dm_group_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON dm_group_members(user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. CO-AUTEURS SANS INVITATION
--    status 'auto_accepted' : ajouté directement (réglage de l'invité
--    collab_auto_accept) — n'exige aucune action de sa part.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE post_collaborators ADD COLUMN IF NOT EXISTS auto_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE post_collaborators ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- ─────────────────────────────────────────────────────────────
-- 4. MENTIONS URGENTES DANS LES MESSAGES (@tous, @user urgent)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]';
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS urgent_mentions JSONB DEFAULT '[]';

-- Messages de groupe : pas de destinataire unique + suivi de lecture partagé
ALTER TABLE direct_messages ALTER COLUMN recipient_id DROP NOT NULL;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '[]';
CREATE INDEX IF NOT EXISTS idx_dm_group_conv ON direct_messages(conversation_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 5. RÉGLAGES : outils mAI disponibles + auto-acceptation co-auteurs
-- ─────────────────────────────────────────────────────────────
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_enabled_tools JSONB DEFAULT NULL;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS collab_auto_accept BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────
-- 6. VUE : catalogue des outils mAI (miroir déclaratif de lib/tools)
--    simple table de référence servie par GET /v1/mai/tools.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mai_tools_catalog (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slash_command VARCHAR(40),
    mention_tag VARCHAR(40),
    description TEXT,
    icon_name VARCHAR(60),
    category VARCHAR(30),
    sensitive BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    file VARCHAR(200),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
