-- Migration 0020 : Projets partagés — membres, invitations et fichiers.
-- Un Projet devient un espace de travail collaboratif persistant :
-- • "ProjectMember" : rôles owner/member (unique projectId+userId, cascade).
-- • "ProjectInvite" : code URL-safe unique servant de lien ET de code manuel,
--   avec expiration, révocation et quota d'utilisations. Une seule invitation
--   active par projet (index unique partiel).
-- • "ProjectFile" : référence des fichiers du projet dans le stockage cloud
--   MAI (Z1 Storage) — jamais de binaire en base — avec extraction texte
--   bornée et statut, pour une injection filtrée par capacités du modèle.
-- Idempotente : CREATE TABLE/INDEX IF NOT EXISTS, style 0017/0019.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProjectMember" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL,
  "role" varchar DEFAULT 'member' NOT NULL,
  "userId" text NOT NULL,
  "invitedBy" text,
  "joinedAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProjectInvite" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL,
  "code" text NOT NULL,
  "createdBy" text NOT NULL,
  "maxUses" integer,
  "useCount" integer DEFAULT 0 NOT NULL,
  "expiresAt" timestamp,
  "revokedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProjectFile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL,
  "fileName" text NOT NULL,
  "contentType" text DEFAULT 'application/octet-stream' NOT NULL,
  "fileSize" integer,
  "uploadedBy" text NOT NULL,
  "fileRef" text,
  "storageUrl" text NOT NULL,
  "extractionStatus" varchar DEFAULT 'pending' NOT NULL,
  "extractedText" text,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_Project_id_fk"
  FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE;

--> statement-breakpoint
ALTER TABLE "ProjectInvite" ADD CONSTRAINT "ProjectInvite_projectId_Project_id_fk"
  FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE;

--> statement-breakpoint
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectId_Project_id_fk"
  FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE;

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMember_projectId_userId_key"
  ON "ProjectMember" USING btree ("projectId", "userId");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectMember_projectId_idx"
  ON "ProjectMember" USING btree ("projectId");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectMember_userId_idx"
  ON "ProjectMember" USING btree ("userId");

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectInvite_code_key"
  ON "ProjectInvite" USING btree ("code");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectInvite_projectId_idx"
  ON "ProjectInvite" USING btree ("projectId");

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectInvite_one_active_per_project_key"
  ON "ProjectInvite" USING btree ("projectId") WHERE "revokedAt" IS NULL;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProjectFile_projectId_createdAt_idx"
  ON "ProjectFile" USING btree ("projectId", "createdAt");

--> statement-breakpoint
-- Types de notification : un membre rejoint un projet partagé (pattern 0014/0017).
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_type_check";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_type_check"
  CHECK ("type" IN ('ai_response','project_created','mcp_created','mcp_access_request','news','planning_task_completed','quota_warning','agent_run_finished','agent_run_failed','agent_approval_required','agent_user_input_required','project_member_joined'));
