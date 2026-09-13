-- Migration 0015: plugins installés par utilisateur (table PluginInstallation)
-- Idempotent: CREATE TABLE / INDEX IF NOT EXISTS

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PluginInstallation" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL,
  "pluginId" varchar(64) NOT NULL,
  "version" varchar(20) DEFAULT '1.0.0' NOT NULL,
  "isEnabled" boolean DEFAULT true NOT NULL,
  "settings" json DEFAULT '{}'::json NOT NULL,
  "installedAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "PluginInstallation_userId_pluginId_key" ON "PluginInstallation" USING btree ("userId", "pluginId");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PluginInstallation_userId_idx" ON "PluginInstallation" USING btree ("userId");
