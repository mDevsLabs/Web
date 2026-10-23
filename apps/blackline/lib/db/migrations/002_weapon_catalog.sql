INSERT INTO weapons(id,name,weapon_class) VALUES
('ar','M4 SENTINEL','FUSIL D’ASSAUT'),
('smg','VX-9 PHANTOM','PISTOLET-MITRAILLEUR'),
('dmr','SR-25 REVENANT','FUSIL DE PRÉCISION'),
('pistol','P-12 WARDEN','PISTOLET DE POING')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, weapon_class=EXCLUDED.weapon_class;
