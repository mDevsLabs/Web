-- Migration 0070: plugins créés par l'utilisateur.
-- Un serveur MCP existant devient un plugin (même identifiant de serveur, pour
-- les Skills). Idempotente: sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserPlugin" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "kind" varchar(16) NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "icon" text DEFAULT 'Puzzle' NOT NULL,
  "version" varchar(20) DEFAULT '1.0.0' NOT NULL,
  "isEnabled" boolean DEFAULT true NOT NULL,
  "transport" varchar(16),
  "url" text,
  "authType" varchar(20),
  "requireApproval" varchar(20) DEFAULT 'write_only' NOT NULL,
  "timeoutMs" integer DEFAULT 15000 NOT NULL,
  "rateLimitPerMin" integer DEFAULT 60 NOT NULL,
  "authorizeUrl" text,
  "tokenUrl" text,
  "clientId" text,
  "scopes" text DEFAULT '' NOT NULL,
  "hosts" json DEFAULT '[]'::json NOT NULL,
  "apiBaseUrl" text,
  "mcpServerId" uuid,
  "connectedAccount" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserPlugin_userId_idx" ON "UserPlugin" USING btree ("userId");

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "UserPlugin_mcpServerId_key" ON "UserPlugin" USING btree ("mcpServerId");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserPluginSecret" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pluginId" uuid NOT NULL REFERENCES "UserPlugin"("id") ON DELETE CASCADE,
  "userId" text NOT NULL,
  "kind" varchar(16) NOT NULL,
  "key" text NOT NULL,
  "encryptedValue" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserPluginSecret_pluginId_idx" ON "UserPluginSecret" USING btree ("pluginId");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserPluginSecret_userId_idx" ON "UserPluginSecret" USING btree ("userId");

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "UserPluginSecret_plugin_kind_key" ON "UserPluginSecret" USING btree ("pluginId", "kind", "key");

--> statement-breakpoint
INSERT INTO "UserPlugin" (
  "userId",
  "kind",
  "name",
  "description",
  "icon",
  "version",
  "isEnabled",
  "transport",
  "url",
  "authType",
  "requireApproval",
  "timeoutMs",
  "rateLimitPerMin",
  "scopes",
  "hosts",
  "mcpServerId",
  "createdAt",
  "updatedAt"
)
SELECT
  s."userId",
  'mcp',
  s."name",
  COALESCE(s."description", ''),
  COALESCE(NULLIF(s."icon", ''), 'Puzzle'),
  '1.0.0',
  s."isEnabled",
  s."transport",
  s."url",
  s."authType",
  s."requireApproval",
  s."timeoutMs",
  s."rateLimitPerMin",
  '',
  '[]'::json,
  s."id",
  s."createdAt",
  s."updatedAt"
FROM "McpServer" AS s
WHERE NOT EXISTS (
  SELECT 1 FROM "UserPlugin" AS p WHERE p."mcpServerId" = s."id"
);
