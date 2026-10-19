-- Migration 0054 : formulaires de feedback et récompenses de réinitialisation de limites.
-- Permet aux administrateurs de proposer des formulaires horodatés (début/fin, questions, options)
-- et aux utilisateurs d'enregistrer leurs réponses en obtenant la remise à zéro
-- immédiate de leur consommation de limites (mAI, API, Images ou Audio).
-- Additif uniquement et idempotent.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserForm" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '',
  "startDate" timestamp with time zone DEFAULT now() NOT NULL,
  "endDate" timestamp with time zone,
  "questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "options" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserForm_isActive_idx" ON "UserForm" ("isActive");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserForm_startDate_endDate_idx" ON "UserForm" ("startDate", "endDate");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserFormResponse" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "formId" uuid NOT NULL REFERENCES "UserForm"("id") ON DELETE CASCADE,
  "userId" text NOT NULL,
  "answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "rewardType" varchar(20),
  "rewardResetApplied" boolean DEFAULT false NOT NULL,
  "rewardAppliedAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "UserFormResponse_formId_userId_key" ON "UserFormResponse" ("formId", "userId");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserFormResponse_userId_idx" ON "UserFormResponse" ("userId");
