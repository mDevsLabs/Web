-- Migration 0021 : Propositions de modifications ciblées d'Artifacts.
-- Une proposal décrit un patch typé (DocumentPatchOp[] dans lib/artifacts/patch.ts)
-- généré par l'IA contre un état précis du document (baseHash FNV-1a).
-- Elle n'est jamais appliquée implicitement : l'utilisateur accepte ou refuse.
-- Idempotente (IF NOT EXISTS), style 0017/0019/0020.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "DocumentProposal" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "documentId" uuid NOT NULL,
  "userId" text NOT NULL,
  "chatId" uuid,
  "ops" jsonb NOT NULL,
  "baseHash" text NOT NULL,
  "description" text,
  "status" varchar DEFAULT 'pending' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "resolvedAt" timestamp
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "DocumentProposal_documentId_status_idx"
  ON "DocumentProposal" USING btree ("documentId", "status");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "DocumentProposal_userId_createdAt_idx"
  ON "DocumentProposal" USING btree ("userId", "createdAt");
