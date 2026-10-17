-- ============================================================================
-- mAI Vibe — Migration 025 : conversations des Livres dans Messages +
-- publication jointe aux messages + index mAI.
-- Miroir SQL de vibe-books-conversations.ts / ensureDMTables /
-- ensureMAIConversations (le runtime crée tout de façon idempotente).
-- 100 % idempotent.
-- ============================================================================

-- 1. Rattachement d'une conversation de groupe à un Livre
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS book_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS idx_dm_conversations_book ON dm_conversations(book_id) WHERE book_id IS NOT NULL;

-- 2. Publication jointe à un message (carte cliquable, Livres uniquement)
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS attached_post_id UUID;
CREATE INDEX IF NOT EXISTS idx_dm_attached_post ON direct_messages(attached_post_id) WHERE attached_post_id IS NOT NULL;

-- 3. Index mAI (historique multi-conversations)
CREATE INDEX IF NOT EXISTS idx_mai_messages_conv ON mai_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mai_conversations_user ON mai_conversations(user_id, updated_at DESC);

-- 4. Backfill : conversation Messages pour chaque Livre existant
INSERT INTO dm_conversations
  (participant_one_id, participant_two_id, is_group, group_name, created_by, book_id,
   last_message_preview, last_message_at)
SELECT b.user_id, NULL, TRUE, b.title, b.user_id, b.id, 'Conversation du Livre', COALESCE(b.updated_at, NOW())
FROM vibe_books b
WHERE NOT EXISTS (SELECT 1 FROM dm_conversations dm WHERE dm.book_id = b.id);

-- 5. Backfill : rattachement des membres du Livre à la conversation
INSERT INTO dm_group_members (conversation_id, user_id, role, added_by)
SELECT dm.id, m.user_id, CASE WHEN m.role = 'owner' THEN 'admin' ELSE 'member' END, b.user_id
FROM dm_conversations dm
JOIN vibe_books b ON b.id = dm.book_id
JOIN vibe_book_members m ON m.book_id = dm.book_id
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- 6. Mise à niveau du rôle du propriétaire (admin comme dans les groupes)
UPDATE dm_group_members gm SET role = 'admin'
WHERE gm.role <> 'admin'
  AND EXISTS (
    SELECT 1 FROM dm_conversations dm
    JOIN vibe_books b ON b.id = dm.book_id
    WHERE dm.id = gm.conversation_id AND b.user_id = gm.user_id
  );
