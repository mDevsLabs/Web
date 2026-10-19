-- ============================================================================
-- mAI Vibe — Migration 018 : Masquer la coche bleue (badge vérifié)
-- Permet aux comptes éligibles (is_verified = true OU tier Plus/Pro/Max) de
-- retirer la coche bleue de leur profil public (réglage hide_verified_badge).
-- Miroir SQL de ensurePersonalizationColumns() (vibe-settings.ts) et de
-- scripts/migrate.js — 100 % idempotent.
-- ============================================================================

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hide_verified_badge BOOLEAN DEFAULT FALSE;
