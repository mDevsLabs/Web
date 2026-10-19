-- Migration 005: Verified boolean and Bot Test Account
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Ensure Bot account exists with password_hash
-- NOTE: le seed @bot public est volontairement désactivé. Le runner
-- lib/db/migrator.ts ajoute une neutralisation des anciens hashs et ne
-- transmet jamais ce bloc à PostgreSQL. Utilisez BOT_PASSWORD_HASH pour
-- recréer explicitement un compte de test.
