-- Migration 006: Enhanced user settings & feed customization
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS feed_default_mode VARCHAR(32) DEFAULT 'for_you';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hide_reposts BOOLEAN DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS blocked_keywords TEXT[] DEFAULT '{}';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS two_factor_auth BOOLEAN DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS allow_mentions VARCHAR(32) DEFAULT 'everyone';
