-- Migration 0077 - Quizzly : ligues, amis, booster et offre du jour.
--
-- POURQUOI CES TABLES
--
-- L'XP totale reste sur le profil : elle ne redescend pas. Le classement
-- de ligue, lui, est une semaine civile (lundi 00:00 Europe/Paris). Le
-- siège porte l'XP de cette semaine, la cohorte groupe au plus 30 comptes,
-- et la clôture est une ligne : un rejeu du tick ne reclasse pas deux fois.
--
-- L'amitié est mutuelle et vit ici. Le miroir ne retient que les
-- abonnements Vibe créés par Quizzly, pour qu'un retrait ne défasse pas
-- un suivi que la personne avait déjà choisi sur Vibe.
--
-- Le record de série, le booster, le bouclier et le cadeau du jour sont
-- des faits de compte : le navigateur ne peut pas se les accorder.
--
-- Idempotente : rejouable sans effet sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "QuizzlyProfile" ADD COLUMN IF NOT EXISTS "streakBest" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "QuizzlyProfile" ADD COLUMN IF NOT EXISTS "league" varchar(12) DEFAULT 'bronze' NOT NULL;
--> statement-breakpoint
ALTER TABLE "QuizzlyProfile" ADD COLUMN IF NOT EXISTS "leagueShieldWeek" varchar(8);
--> statement-breakpoint
ALTER TABLE "QuizzlyProfile" ADD COLUMN IF NOT EXISTS "xpBoostUntil" timestamptz;
--> statement-breakpoint
ALTER TABLE "QuizzlyProfile" ADD COLUMN IF NOT EXISTS "lastDailyGift" date;
--> statement-breakpoint
ALTER TABLE "QuizzlyProfile" ADD COLUMN IF NOT EXISTS "subjects" jsonb DEFAULT '[]'::jsonb NOT NULL;

--> statement-breakpoint
UPDATE "QuizzlyProfile"
SET "streakBest" = "streakCount"
WHERE "streakBest" < "streakCount";

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyProfile_league_check'
  ) THEN
    ALTER TABLE "QuizzlyProfile"
      ADD CONSTRAINT "QuizzlyProfile_league_check"
      CHECK (
        "league" IN (
          'bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion'
        )
      );
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyProfile_subjects_check'
  ) THEN
    ALTER TABLE "QuizzlyProfile"
      ADD CONSTRAINT "QuizzlyProfile_subjects_check"
      CHECK (jsonb_typeof("subjects") = 'array');
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyProfile_streak_best_check'
  ) THEN
    ALTER TABLE "QuizzlyProfile"
      ADD CONSTRAINT "QuizzlyProfile_streak_best_check"
      CHECK ("streakBest" >= 0);
  END IF;
END $$;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyLeagueCohort" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "weekKey" varchar(8) NOT NULL,
  "league" varchar(12) NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "QuizzlyLeagueCohort_league_check" CHECK (
    "league" IN (
      'bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion'
    )
  )
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "QuizzlyLeagueCohort_week_league_idx"
  ON "QuizzlyLeagueCohort" ("weekKey", "league");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyLeagueSeat" (
  "userId" text NOT NULL,
  "weekKey" varchar(8) NOT NULL,
  "cohortId" uuid NOT NULL,
  "league" varchar(12) NOT NULL,
  "weeklyXp" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "QuizzlyLeagueSeat_pkey" PRIMARY KEY ("userId", "weekKey"),
  CONSTRAINT "QuizzlyLeagueSeat_weekly_xp_check" CHECK ("weeklyXp" >= 0),
  CONSTRAINT "QuizzlyLeagueSeat_league_check" CHECK (
    "league" IN (
      'bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion'
    )
  )
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "QuizzlyLeagueSeat_cohort_idx"
  ON "QuizzlyLeagueSeat" ("cohortId");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyLeagueClosure" (
  "weekKey" varchar(8) PRIMARY KEY NOT NULL,
  "closedAt" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyFriendship" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "requesterId" text NOT NULL,
  "addresseeId" text NOT NULL,
  "status" varchar(12) DEFAULT 'pending' NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "respondedAt" timestamptz,
  "mirroredAt" timestamptz,
  CONSTRAINT "QuizzlyFriendship_distinct_check"
    CHECK ("requesterId" <> "addresseeId"),
  CONSTRAINT "QuizzlyFriendship_status_check"
    CHECK ("status" IN ('pending', 'accepted', 'declined'))
);

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "QuizzlyFriendship_paire_idx"
  ON "QuizzlyFriendship" (
    LEAST("requesterId", "addresseeId"),
    GREATEST("requesterId", "addresseeId")
  );

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "QuizzlyFriendship_addressee_idx"
  ON "QuizzlyFriendship" ("addresseeId", "status");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyFollowMirror" (
  "friendshipId" uuid NOT NULL,
  "followerVibeId" text NOT NULL,
  "followingVibeId" text NOT NULL,
  CONSTRAINT "QuizzlyFollowMirror_pkey"
    PRIMARY KEY ("friendshipId", "followerVibeId", "followingVibeId")
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'QuizzlyFollowMirror_friendship_fk'
  ) THEN
    ALTER TABLE "QuizzlyFollowMirror"
      ADD CONSTRAINT "QuizzlyFollowMirror_friendship_fk"
      FOREIGN KEY ("friendshipId") REFERENCES "QuizzlyFriendship" ("id")
      ON DELETE CASCADE;
  END IF;
END $$;

--> statement-breakpoint
COMMENT ON COLUMN "QuizzlyProfile"."streakBest" IS
  'Plus longue série atteinte. Ne redescend pas quand la série en cours casse.';
COMMENT ON COLUMN "QuizzlyProfile"."league" IS
  'Ligue courante. Le siège hebdomadaire porte le score, pas cette colonne.';
COMMENT ON COLUMN "QuizzlyProfile"."subjects" IS
  'Matières suivies pour l''année choisie. Tableau vide : toutes les matières.';
COMMENT ON TABLE "QuizzlyFollowMirror" IS
  'Abonnements Vibe créés par une amitié Quizzly. Un retrait ne touche que ces lignes.';
