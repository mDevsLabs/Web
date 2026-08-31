-- Migration : commandes personnalisées (section Configuration des paramètres).
-- Chaque commande / ou @ déclenche une action : MCP, agent, skill, prompt
-- prédéfini, outils ou navigation.

CREATE TABLE IF NOT EXISTS "CustomCommand" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "kind" VARCHAR(10) NOT NULL CHECK ("kind" IN ('slash', 'mention')),
  "trigger" VARCHAR(32) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) DEFAULT '',
  "icon" VARCHAR(50) DEFAULT 'zap',
  "color" VARCHAR(7) DEFAULT '#6366f1',
  "actionType" VARCHAR(20) NOT NULL CHECK ("actionType" IN ('mcp', 'agent', 'skill', 'prompt', 'tools', 'navigation')),
  "payload" JSONB DEFAULT '{}' NOT NULL,
  "enabled" BOOLEAN DEFAULT true NOT NULL,
  "pinned" BOOLEAN DEFAULT false NOT NULL,
  "usageCount" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "CustomCommand_userId_kind_trigger_key" UNIQUE ("userId", "kind", "trigger")
);
CREATE INDEX IF NOT EXISTS "CustomCommand_userId_idx" ON "CustomCommand" ("userId");
CREATE INDEX IF NOT EXISTS "CustomCommand_userId_kind_idx" ON "CustomCommand" ("userId", "kind");
