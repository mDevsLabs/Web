CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY,
  callsign varchar(18) NOT NULL DEFAULT 'OPÉRATEUR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS player_profiles (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp BETWEEN 0 AND 10000000),
  kills integer NOT NULL DEFAULT 0 CHECK (kills BETWEEN 0 AND 10000000),
  deaths integer NOT NULL DEFAULT 0 CHECK (deaths BETWEEN 0 AND 10000000),
  wins integer NOT NULL DEFAULT 0 CHECK (wins BETWEEN 0 AND 10000000),
  matches integer NOT NULL DEFAULT 0 CHECK (matches BETWEEN 0 AND 10000000),
  best_wave integer NOT NULL DEFAULT 0 CHECK (best_wave BETWEEN 0 AND 10000000),
  best_streak integer NOT NULL DEFAULT 0 CHECK (best_streak BETWEEN 0 AND 10000000),
  selected_weapon varchar(16) NOT NULL DEFAULT 'ar',
  version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS player_settings (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(settings) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS weapons (
  id varchar(16) PRIMARY KEY,
  name varchar(64) NOT NULL,
  weapon_class varchar(64) NOT NULL
);
CREATE TABLE IF NOT EXISTS weapon_progress (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  weapon_id varchar(16) NOT NULL REFERENCES weapons(id),
  xp integer NOT NULL DEFAULT 0 CHECK (xp BETWEEN 0 AND 10000000),
  kills integer NOT NULL DEFAULT 0 CHECK (kills BETWEEN 0 AND 10000000),
  headshots integer NOT NULL DEFAULT 0 CHECK (headshots BETWEEN 0 AND 10000000),
  equipped text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, weapon_id)
);
CREATE TABLE IF NOT EXISTS match_history (
  id uuid PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mode varchar(20) NOT NULL CHECK (mode IN ('tdm','domination','hardpoint','survival')),
  result jsonb NOT NULL CHECK (jsonb_typeof(result) = 'object'),
  played_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS match_history_player_time ON match_history(player_id, played_at DESC);
