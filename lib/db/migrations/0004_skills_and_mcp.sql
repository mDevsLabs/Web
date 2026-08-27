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
CREATE INDEX IF NOT EXISTS "Skill_userId_idx" ON "Skill" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "Skill_userId_pinned_idx" ON "Skill" USING btree ("userId", "pinned");
CREATE INDEX IF NOT EXISTS "Skill_shareId_idx" ON "Skill" USING btree ("shareId");

--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Chat' AND column_name='skillId') THEN
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
CREATE INDEX IF NOT EXISTS "McpServer_userId_idx" ON "McpServer" USING btree ("userId");
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
CREATE INDEX IF NOT EXISTS "McpLog_userId_idx" ON "McpLog" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "McpLog_serverId_idx" ON "McpLog" USING btree ("serverId");
CREATE INDEX IF NOT EXISTS "McpLog_createdAt_idx" ON "McpLog" USING btree ("createdAt" DESC);
