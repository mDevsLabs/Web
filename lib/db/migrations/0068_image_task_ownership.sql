-- Migration 0068: association des tâches d'image Midjourney à leur compte.
-- Le backend Val Town refuse désormais la lecture ou l'action sur une tâche
-- dont le `task_id` n'appartient pas au compte authentifié. Les tâches
-- historiques non attribuées restent refusées (404), jamais exposées.
-- Idempotente: sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mprojects_image_tasks" (
  "task_id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "api_key" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mprojects_image_tasks_user_id_idx" ON "mprojects_image_tasks" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mprojects_image_tasks_api_key_idx" ON "mprojects_image_tasks" ("api_key");
