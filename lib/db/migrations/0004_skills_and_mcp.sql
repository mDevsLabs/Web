-- Migration: Skills, MCP Servers and MCP Logs
-- Idempotent: uses IF NOT EXISTS / DO blocks

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Skill" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '',
  "instructions" text NOT NULL DEFAULT '',
  "icon" text DEFAULT 'sparkles',
  "color" varchar(7) DEFAULT '#6366f1',
  "tools" json DEFAULT '[]'::json NOT NULL,
  "parameters" json DEFAULT '[]'::json NOT NULL,
  "pinned" boolean DEFAULT false NOT NULL,
  "isPublic" boolean DEFAULT false NOT NULL,
  "shareId" text,
  "tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "userId" text;
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "name" text;
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '';
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "instructions" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "icon" text DEFAULT 'sparkles';
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "color" varchar(7) DEFAULT '#6366f1';
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "tools" json DEFAULT '[]'::json NOT NULL;
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "parameters" json DEFAULT '[]'::json NOT NULL;
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "isPublic" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "shareId" text;
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'::text[] NOT NULL;
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Skill_userId_idx" ON "Skill" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Skill_userId_pinned_idx" ON "Skill" USING btree ("userId", "pinned");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Skill_shareId_idx" ON "Skill" USING btree ("shareId");

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE lower(table_name)='chat' AND lower(column_name)='skillid') THEN
    ALTER TABLE "Chat" ADD COLUMN "skillId" uuid REFERENCES "Skill"("id") ON DELETE SET NULL;
  END IF;
END $$;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "McpServer" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '',
  "icon" text DEFAULT 'server',
  "transport" varchar NOT NULL DEFAULT 'sse',
  "url" text,
  "command" text,
  "args" json DEFAULT '[]'::json NOT NULL,
  "env" json DEFAULT '{}'::json NOT NULL,
  "authType" varchar NOT NULL DEFAULT 'none',
  "authConfig" json DEFAULT '{}'::json NOT NULL,
  "headers" json DEFAULT '{}'::json NOT NULL,
  "isEnabled" boolean DEFAULT true NOT NULL,
  "requireApproval" varchar NOT NULL DEFAULT 'write_only',
  "toolsCache" json DEFAULT '[]'::json NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "userId" text;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "name" text;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '';
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "icon" text DEFAULT 'server';
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "transport" varchar NOT NULL DEFAULT 'sse';
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "url" text;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "command" text;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "args" json DEFAULT '[]'::json NOT NULL;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "env" json DEFAULT '{}'::json NOT NULL;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "authType" varchar NOT NULL DEFAULT 'none';
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "authConfig" json DEFAULT '{}'::json NOT NULL;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "headers" json DEFAULT '{}'::json NOT NULL;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "isEnabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "requireApproval" varchar NOT NULL DEFAULT 'write_only';
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "toolsCache" json DEFAULT '[]'::json NOT NULL;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "McpServer_userId_idx" ON "McpServer" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "McpServer_userId_isEnabled_idx" ON "McpServer" USING btree ("userId", "isEnabled");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "McpLog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "serverId" uuid REFERENCES "McpServer"("id") ON DELETE CASCADE,
  "serverName" text NOT NULL,
  "toolName" text NOT NULL,
  "chatId" uuid,
  "actionType" varchar NOT NULL DEFAULT 'read',
  "approvalStatus" varchar NOT NULL DEFAULT 'auto_approved',
  "inputPayload" json,
  "outputPayload" json,
  "error" text,
  "durationMs" integer DEFAULT 0,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "userId" text;
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "serverId" uuid REFERENCES "McpServer"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "serverName" text;
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "toolName" text;
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "chatId" uuid;
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "actionType" varchar NOT NULL DEFAULT 'read';
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "approvalStatus" varchar NOT NULL DEFAULT 'auto_approved';
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "inputPayload" json;
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "outputPayload" json;
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "error" text;
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "durationMs" integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "McpLog" ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now() NOT NULL;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "McpLog_userId_idx" ON "McpLog" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "McpLog_serverId_idx" ON "McpLog" USING btree ("serverId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "McpLog_createdAt_idx" ON "McpLog" USING btree ("createdAt" DESC);
