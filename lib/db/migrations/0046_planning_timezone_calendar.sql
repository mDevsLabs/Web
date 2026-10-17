-- Migration 0046 : la récurrence planifiée devient calendaire.
--
-- Pourquoi : l'ancien moteur avançait les récurrences par durée UTC figée
-- (setDate/setMonth sur un objet Date), calculée dans le fuseau local du
-- serveur. Un plan « le 10 du mois à 9 h à Paris » dérivait à chaque passage
-- à l'heure d'été, dépendait du host, et le 31 du mois débordait sur le mois
-- suivant (31 janv. → 3 mars → 3 avril). La source de vérité devient l'heure
-- murale { fuseau IANA, jour du mois, heure, minute, politique mensuelle } ;
-- l'instant UTC (`scheduledAt`) n'est plus qu'une conséquence recalculée.
--
-- Valeurs par défaut : Europe/Paris (socle francophone historique de la base),
-- heure/minute et jour dérivés du `scheduledAt` existant, politique « clamp »
-- (le 31 janv. tombe au 28/29 févr. — le calendrier ne dérive plus).
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ScheduledMessage' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE "ScheduledMessage"
            ADD COLUMN "timezone" varchar(64) NOT NULL DEFAULT 'Europe/Paris';
    END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ScheduledMessage' AND column_name = 'hour'
    ) THEN
        ALTER TABLE "ScheduledMessage"
            ADD COLUMN "hour" smallint;
    END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ScheduledMessage' AND column_name = 'minute'
    ) THEN
        ALTER TABLE "ScheduledMessage"
            ADD COLUMN "minute" smallint;
    END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ScheduledMessage' AND column_name = 'dayOfMonth'
    ) THEN
        ALTER TABLE "ScheduledMessage"
            ADD COLUMN "dayOfMonth" smallint;
    END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ScheduledMessage' AND column_name = 'monthlyPolicy'
    ) THEN
        ALTER TABLE "ScheduledMessage"
            ADD COLUMN "monthlyPolicy" varchar(12) NOT NULL DEFAULT 'clamp';
    END IF;
END $$;

--> statement-breakpoint
-- Amorçage : dériver les champs calendaires de l'instant planifié existant,
-- dans le fuseau posé par défaut (Europe/Paris). Les colonnes étant NULL pour
-- les lignes anciennes, seul l'amorçage les remplit ; une ligne créée ensuite
-- porte ses propres valeurs.
UPDATE "ScheduledMessage"
SET
    "hour"       = COALESCE("hour",       EXTRACT(HOUR  FROM "scheduledAt" AT TIME ZONE 'Europe/Paris')::smallint),
    "minute"     = COALESCE("minute",     EXTRACT(MINUTE FROM "scheduledAt" AT TIME ZONE 'Europe/Paris')::smallint),
    "dayOfMonth" = COALESCE("dayOfMonth", EXTRACT(DAY    FROM "scheduledAt" AT TIME ZONE 'Europe/Paris')::smallint);
