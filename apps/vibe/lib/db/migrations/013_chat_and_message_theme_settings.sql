-- ============================================================================
-- MIGRATION 013 — THÈMES DE MESSAGES & ARRIÈRE-PLANS DE DISCUSSION
-- Enregistrement en base de données des personnalisations de messages :
-- message_bubble_theme, chat_background_theme, message_bubble_shape.
-- ============================================================================

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS message_bubble_theme TEXT DEFAULT 'monochrome';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS chat_background_theme TEXT DEFAULT 'default';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS message_bubble_shape TEXT DEFAULT 'pill';
