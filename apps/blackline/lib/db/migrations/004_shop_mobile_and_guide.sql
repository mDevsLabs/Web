-- Local solo-game collection; no real-money payments or anti-cheat leaderboard.
CREATE TABLE IF NOT EXISTS store_items (
  id varchar(32) PRIMARY KEY,
  kind varchar(12) NOT NULL CHECK (kind IN ('weapon','shot','kill')),
  target varchar(32) NOT NULL,
  name varchar(64) NOT NULL,
  credit_price integer NOT NULL CHECK (credit_price >= 0),
  enabled boolean NOT NULL DEFAULT true
);
INSERT INTO store_items(id,kind,target,name,credit_price) VALUES
 ('weapon-shotgun','weapon','shotgun','SG-8 BREACHER',750),
 ('weapon-lmg','weapon','lmg','LM-60 BASTION',1100),
 ('shot-ion','shot','ion','ION',300),
 ('shot-violet','shot','violet','SPECTRE',450),
 ('kill-pulse','kill','pulse','RÉSONANCE',550)
ON CONFLICT(id) DO UPDATE SET kind=EXCLUDED.kind,target=EXCLUDED.target,name=EXCLUDED.name,credit_price=EXCLUDED.credit_price;
INSERT INTO weapons(id,name,weapon_class) VALUES ('shotgun','SG-8 BREACHER','FUSIL À POMPE'),('lmg','LM-60 BASTION','MITRAILLEUSE LÉGÈRE') ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,weapon_class=EXCLUDED.weapon_class;
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS collection jsonb NOT NULL DEFAULT '{"purchases":[],"shot":"standard","kill":"none"}'::jsonb CHECK (jsonb_typeof(collection)='object');
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS guide_step integer NOT NULL DEFAULT 0 CHECK (guide_step BETWEEN 0 AND 5);
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS guide_complete boolean NOT NULL DEFAULT false;
-- Settings are JSONB: extend their defaults without replacing existing user choices.
UPDATE player_settings SET settings='{"mobileAutoFire":true,"mobileAimAssist":true,"touchOpacity":0.8,"toggleAim":false,"hitmarkerSound":true,"screenEffects":true,"reduceMotion":false,"grenadePower":1}'::jsonb || settings;
