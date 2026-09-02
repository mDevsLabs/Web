-- Migration: MCP fine-grained control + encrypted secrets + Skill MCP binding + global prefs + monitoring columns
-- Idempotent: uses IF NOT EXISTS / DO blocks

--> statement-breakpoint
-- A. Extension McpServer avec monitoring + contrôle fin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='lastSyncAt') THEN
    ALTER TABLE "McpServer" ADD COLUMN "lastSyncAt" timestamp;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='lastCallAt') THEN
    ALTER TABLE "McpServer" ADD COLUMN "lastCallAt" timestamp;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='avgLatencyMs') THEN
    ALTER TABLE "McpServer" ADD COLUMN "avgLatencyMs" integer DEFAULT 0 NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='callCount') THEN
    ALTER TABLE "McpServer" ADD COLUMN "callCount" integer DEFAULT 0 NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='uptimeStatus') THEN
    ALTER TABLE "McpServer" ADD COLUMN "uptimeStatus" varchar(20) DEFAULT 'unknown' NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='timeoutMs') THEN
    ALTER TABLE "McpServer" ADD COLUMN "timeoutMs" integer DEFAULT 15000 NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='rateLimitPerMin') THEN
    ALTER TABLE "McpServer" ADD COLUMN "rateLimitPerMin" integer DEFAULT 60 NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='toolOverrides') THEN
    ALTER TABLE "McpServer" ADD COLUMN "toolOverrides" json DEFAULT '{}'::json NOT NULL;
  END IF;
END $$;

--> statement-breakpoint
-- B. Table secrets chiffrés (env + auth + headers)
CREATE TABLE IF NOT EXISTS "mcp_server_secret" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "serverId" uuid NOT NULL REFERENCES "McpServer"("id") ON DELETE CASCADE,
  "userId" text NOT NULL,
  "kind" varchar(20) NOT NULL CHECK ("kind" IN ('env','auth','header')),
  "key" text NOT NULL,
  "encryptedValue" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "mcp_server_secret_unique" UNIQUE("serverId","kind","key")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_server_secret_serverId_idx" ON "mcp_server_secret" USING btree ("serverId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_server_secret_userId_idx" ON "mcp_server_secret" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_server_secret_kind_idx" ON "mcp_server_secret" USING btree ("kind");

--> statement-breakpoint
-- C. Binding Skill -> MCP
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Skill' AND column_name='mcpServerIds') THEN
    ALTER TABLE "Skill" ADD COLUMN "mcpServerIds" uuid[] DEFAULT '{}' NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Skill' AND column_name='mcpToolFilter') THEN
    ALTER TABLE "Skill" ADD COLUMN "mcpToolFilter" json DEFAULT '{}'::json NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Skill' AND column_name='version') THEN
    ALTER TABLE "Skill" ADD COLUMN "version" varchar(20) DEFAULT 'v1' NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Skill' AND column_name='usageCount') THEN
    ALTER TABLE "Skill" ADD COLUMN "usageCount" integer DEFAULT 0 NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Skill' AND column_name='lastUsedAt') THEN
    ALTER TABLE "Skill" ADD COLUMN "lastUsedAt" timestamp;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Skill' AND column_name='templateId') THEN
    ALTER TABLE "Skill" ADD COLUMN "templateId" uuid REFERENCES "SkillTemplate"("id") ON DELETE SET NULL;
  END IF;
END $$;

--> statement-breakpoint
-- D. Préférences globales MCP par user
CREATE TABLE IF NOT EXISTS "user_mcp_prefs" (
  "userId" text PRIMARY KEY NOT NULL,
  "globalKillSwitch" boolean DEFAULT false NOT NULL,
  "defaultRequireApproval" varchar(20) DEFAULT 'write_only' NOT NULL CHECK ("defaultRequireApproval" IN ('always_allow','write_only','ask_permission')),
  "defaultTimeoutMs" integer DEFAULT 15000 NOT NULL,
  "defaultRateLimitPerMin" integer DEFAULT 60 NOT NULL,
  "allowStdio" boolean DEFAULT true NOT NULL,
  "retentionDays" integer DEFAULT 30 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
-- E. Ensure SkillTemplate / McpTemplate exist (idempotent from 01_*)
CREATE TABLE IF NOT EXISTS "SkillTemplate" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '',
  "instructions" text NOT NULL DEFAULT '',
  "icon" text DEFAULT 'sparkles',
  "color" varchar(7) DEFAULT '#6366f1',
  "tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "tools" json DEFAULT '[]'::json NOT NULL,
  "parameters" json DEFAULT '[]'::json NOT NULL,
  "isPublic" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "McpTemplate" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '',
  "transport" varchar(20) DEFAULT 'sse' NOT NULL,
  "url" text,
  "command" text,
  "args" text,
  "authType" varchar(20) DEFAULT 'none' NOT NULL,
  "icon" text DEFAULT 'server',
  "isPublic" boolean DEFAULT true NOT NULL,
  "tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "SkillTemplate_isPublic_idx" ON "SkillTemplate" USING btree ("isPublic");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "McpTemplate_isPublic_idx" ON "McpTemplate" USING btree ("isPublic");
