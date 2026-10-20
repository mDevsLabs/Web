-- BLACKLINE 1.0.0. Additive migration; historical migrations remain unchanged.
INSERT INTO weapons(id,name,weapon_class) VALUES
 ('carbine','CR-9 AURORA','CARABINE'),('marksman','S-96 HORIZON','FUSIL LONGUE PORTÉE')
ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,weapon_class=EXCLUDED.weapon_class;
INSERT INTO store_items(id,kind,target,name,credit_price) VALUES
 ('weapon-carbine','weapon','carbine','CR-9 AURORA',1400),
 ('weapon-marksman','weapon','marksman','S-96 HORIZON',1800)
ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,credit_price=EXCLUDED.credit_price;
ALTER TABLE weapon_progress ADD COLUMN IF NOT EXISTS progress_version integer NOT NULL DEFAULT 1 CHECK (progress_version IN (1,2));
ALTER TABLE weapon_progress ADD COLUMN IF NOT EXISTS power integer NOT NULL DEFAULT 0 CHECK (power BETWEEN 0 AND 199);
-- Version 1 rows are converted once by the shared progression normalizer, then saved as version 2.
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS career jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(career)='object');
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS save_nonce uuid;
-- Existing settings are preserved. Missing mobile energy settings are selected by the client per device.
UPDATE player_settings SET settings='{"cameraMode":"first","cameraDistance":3.5}'::jsonb || settings;
CREATE INDEX IF NOT EXISTS player_profiles_recent_save ON player_profiles(updated_at DESC);
COMMENT ON COLUMN player_profiles.career IS 'Solo progression: daily/weekly UTC claims, improvement coins, five loadout slots, squad outfits. Client-controlled; not a competitive economy.';
COMMENT ON COLUMN player_profiles.save_nonce IS 'CAS transaction token: subordinate writes require the successful profile revision.';
