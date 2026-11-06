-- Migration 0072: pages Markdown autonomes (éditeur, révisions, fil mAI).
-- Distinctes des artefacts de chat et des pages Wakies. Idempotente.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Page" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "projectId" uuid,
  "title" text DEFAULT 'Sans titre' NOT NULL,
  "content" text DEFAULT '' NOT NULL,
  "customPrompt" text,
  "modelId" text,
  "revision" integer DEFAULT 1 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "Page"
    ADD CONSTRAINT "Page_projectId_Project_id_fk"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Page_userId_idx" ON "Page" USING btree ("userId");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Page_projectId_idx" ON "Page" USING btree ("projectId");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Page_userId_updatedAt_idx" ON "Page" USING btree ("userId", "updatedAt");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PageRevision" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pageId" uuid NOT NULL,
  "title" text NOT NULL,
  "content" text DEFAULT '' NOT NULL,
  "source" varchar(16) NOT NULL,
  "createdBy" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "PageRevision"
    ADD CONSTRAINT "PageRevision_pageId_Page_id_fk"
    FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PageRevision_pageId_createdAt_idx" ON "PageRevision" USING btree ("pageId", "createdAt");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PageMessage" (
  "id" text PRIMARY KEY NOT NULL,
  "pageId" uuid NOT NULL,
  "userId" text NOT NULL,
  "role" varchar(16) NOT NULL,
  "parts" json NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "PageMessage"
    ADD CONSTRAINT "PageMessage_pageId_Page_id_fk"
    FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PageMessage_pageId_createdAt_idx" ON "PageMessage" USING btree ("pageId", "createdAt");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PageProposal" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pageId" uuid NOT NULL,
  "userId" text NOT NULL,
  "baseHash" text NOT NULL,
  "ops" jsonb NOT NULL,
  "description" text,
  "status" varchar(16) DEFAULT 'pending' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "resolvedAt" timestamp
);

--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "PageProposal"
    ADD CONSTRAINT "PageProposal_pageId_Page_id_fk"
    FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PageProposal_pageId_status_idx" ON "PageProposal" USING btree ("pageId", "status");
