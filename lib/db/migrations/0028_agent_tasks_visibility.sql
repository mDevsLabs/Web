-- Migration 0028 : la liste de tâches n'est visible que si l'utilisateur a
-- activé l'option « Tâches » sur le run. Le plan reste généré et injecté dans
-- le prompt système (il cadre les tâches longues), mais l'interface ne le
-- rend plus par défaut — le drapeau est donc persisté pour que l'historique
-- reste exact après un refresh.
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "AgentRun"
  ADD COLUMN IF NOT EXISTS "tasksEnabled" boolean DEFAULT false NOT NULL;
