-- Migration 0085: fenêtres de maintenance et verrouillage du site mAI.
--
-- Permet de planifier et d'activer des périodes de maintenance bloquant
-- l'accès au site et aux API avec un panneau informatif et compte à rebours.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "MaintenanceWindow" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(150) NOT NULL,
  "description" text DEFAULT '',
  "startAt" timestamp with time zone NOT NULL,
  "endAt" timestamp with time zone NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "MaintenanceWindow_active_range_idx"
  ON "MaintenanceWindow" ("isActive", "startAt", "endAt");
