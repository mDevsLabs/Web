-- Migration 0052 : cycle de vie des tâches planifiées Wakies.
-- Le tick cron reprend une tâche dont le bail a expiré (crash d'invocation ou
-- exécution plus longue que le bail). Sans porteur ni compteur, la même
-- occurrence pouvait être revendue sans fin, l'erreur précédente était écrasée à
-- chaque revendication et l'échec définitif n'existait pas.
-- Additif uniquement : aucune colonne supprimée, aucun type modifié, aucune
-- donnée réécrite. Le code qui lit ces colonnes est déployé APRÈS cette
-- migration, sinon le claim échoue en 42703 et plus aucune tâche ne part.
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE IF EXISTS "WakiesTask" ADD COLUMN IF NOT EXISTS "attempt" integer DEFAULT 0 NOT NULL;

--> statement-breakpoint
ALTER TABLE IF EXISTS "WakiesTask" ADD COLUMN IF NOT EXISTS "claimedBy" varchar(128);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WakiesTask_status_leaseUntil_idx" ON "WakiesTask" ("status", "leaseUntil");
