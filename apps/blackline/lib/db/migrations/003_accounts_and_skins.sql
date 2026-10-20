ALTER TABLE weapon_progress ADD COLUMN IF NOT EXISTS skin varchar(16) NOT NULL DEFAULT 'factory' CHECK (skin IN ('factory','arctic','ember','night'));
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY,
  player_id uuid NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  email varchar(254) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS account_sessions (
  token_hash char(64) PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_sessions_expiry ON account_sessions(expires_at);
CREATE TABLE IF NOT EXISTS auth_limits (
  key_hash char(64) PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);
