-- Migration 0089: table des ticks CRON « paresseux » (bail atomique dans Neon)
--
-- Une ligne par tick (agent, planning, wakies, vibe, notifications, quizzly).
-- `next_run_at` porte l'échéance ; `lease_until` le bail posé par l'instance qui
-- exécute le tick, de sorte qu'une seule instance le traite à la fois et que le
-- bail expiré (instance morte) soit repris. Les lignes sont créées à la demande
-- par l'application (INSERT ... ON CONFLICT DO NOTHING).
--
-- Additive et idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cron_ticks" (
	"name" text PRIMARY KEY NOT NULL,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_until" timestamp with time zone,
	"last_started_at" timestamp with time zone,
	"last_finished_at" timestamp with time zone,
	"last_error" text
);
