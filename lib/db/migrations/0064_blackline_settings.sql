-- Migration 0064 - Blackline : réglages du jeu enregistrés par compte.
--
-- POURQUOI UNE TABLE DÉDIÉE
--
-- Blackline est un jeu solo Vite/Three.js monté sous /blackline dans l'hôte
-- mAI. Ses réglages (qualité, résolution de rendu, sensibilité, volume,
-- réticule, touches PC…) étaient jusqu'ici un `localStorage` par appareil :
-- changer d'appareil, c'était tout recommencer.
--
-- La table est UNIQUE PAR COMPTE (`userId` en clé primaire), comme
-- `WakiesSettings` et `user_preferences`. Le jeu est mono-utilisateur : il
-- n'y a pas de « ressource d'un autre compte » à protéger au-delà de cette
-- clé, et la lecture suit toujours `userId`.
--
-- POURQUOI UN JSONB ET NON DES COLONNES
--
-- Le jeu expose une trentaine de réglages de formes très différentes
-- (énumérations, nombres bornés, texte court, table de touches). Une colonne
-- par réglage serait une trentaine de colonnes à migrer à chaque ajout du
-- jeu. Le JSONB porte un objet que le serveur BORNE (taille, profondeur) et
-- normalise — même modèle que `PluginInstallation.settings`.
--
-- CE QUE LA TABLE NE CONTIENT PAS
--
-- La PROGRESSION du jeu (XP, armes, collection, carrière) reste dans le
-- `localStorage` de l'appareil. Blackline a volontairement retiré la
-- synchronisation en ligne (version 1.2.0) : ses récompenses ne constituent
-- pas une économie serveur, et les sauvegardes d'un jeu solo local ne sont
-- pas un actif à protéger. Seul le JOURNAL des réglages est partagé.
--
-- Idempotente : `CREATE TABLE IF NOT EXISTS` est rejouable sans effet de bord.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "BlacklineSettings" (
  "userId" text PRIMARY KEY NOT NULL,
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);

-- Contrainte de forme : `settings` doit être un OBJET, pas un scalaire ni un
-- tableau. Sans elle, une écriture erronée produirait une ligne que la
-- lecture ne saurait pas interpréter — et le jeu retomberait silencieusement
-- sur ses réglages par défaut.
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BlacklineSettings_settings_object_check'
  ) THEN
    ALTER TABLE "BlacklineSettings"
      ADD CONSTRAINT "BlacklineSettings_settings_object_check"
      CHECK (jsonb_typeof("settings") = 'object');
  END IF;
END $$;

-- La lecture des réglages d'un compte est le seul accès nécessaire : l'index
-- est donc la clé primaire elle-même (lecture par `userId`).
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BlacklineSettings_userId_idx"
  ON "BlacklineSettings" ("userId");

COMMENT ON TABLE "BlacklineSettings" IS
  'Réglages du jeu BLACKLINE, par compte mAI. La progression du jeu reste locale à l''appareil.';
COMMENT ON COLUMN "BlacklineSettings"."settings" IS
  'Réglages sérialisés du jeu. Bornés et normalisés par le serveur (lib/blackline/settings.ts).';
