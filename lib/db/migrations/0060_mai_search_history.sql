-- Migration 0060 : Historique des recherches mAI Search et retours utilisateurs
CREATE TABLE IF NOT EXISTS "MaiSearchQuery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"query" text NOT NULL,
	"resultsCount" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"vote" varchar(10),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "MaiSearchQuery_userId_idx" ON "MaiSearchQuery" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "MaiSearchQuery_userId_createdAt_idx" ON "MaiSearchQuery" USING btree ("userId","createdAt");
