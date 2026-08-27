-- Migration : augmenter Skills et MCP avec templates, versions, statistiques, marketplace
-- Générée le 2026-08-27 pour le projet mAI Web

-- 1. Table de templates de Skills (marketplace) — 100 templates prédéfinis
CREATE TABLE IF NOT EXISTS "SkillTemplate" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) DEFAULT '',
  "instructions" TEXT NOT NULL DEFAULT '',
  "icon" VARCHAR(50) DEFAULT 'sparkles',
  "color" VARCHAR(7) DEFAULT '#6366f1',
  "tags" VARCHAR(50)[] DEFAULT '{}',
  "tools" JSONB DEFAULT '[]',
  "parameters" JSONB DEFAULT '[]',
  "isPublic" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SkillTemplate_isPublic_idx" ON "SkillTemplate" ("isPublic");
CREATE INDEX IF NOT EXISTS "SkillTemplate_name_idx" ON "SkillTemplate" ("name");

-- 2. Table de versions / historique des Skills (snapshot à chaque modification)
CREATE TABLE IF NOT EXISTS "SkillVersion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "skillId" UUID NOT NULL REFERENCES "Skill" ("id") ON DELETE CASCADE,
  "userId" VARCHAR(255) NOT NULL,
  "versionLabel" VARCHAR(20) DEFAULT 'v1',
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) DEFAULT '',
  "instructions" TEXT NOT NULL DEFAULT '',
  "color" VARCHAR(7) DEFAULT '#6366f1',
  "icon" VARCHAR(50) DEFAULT 'sparkles',
  "tags" VARCHAR(50)[] DEFAULT '{}',
  "tools" JSONB DEFAULT '[]',
  "parameters" JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SkillVersion_skillId_idx" ON "SkillVersion" ("skillId");
CREATE INDEX IF NOT EXISTS "SkillVersion_userId_idx" ON "SkillVersion" ("userId");

-- 3. Table d'utilisation/statistiques des Skills
CREATE TABLE IF NOT EXISTS "SkillUsage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "skillId" UUID NOT NULL REFERENCES "Skill" ("id") ON DELETE CASCADE,
  "userId" VARCHAR(255) NOT NULL,
  "invocationCount" INTEGER DEFAULT 0,
  "lastInvokedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SkillUsage_skillId_idx" ON "SkillUsage" ("skillId");
CREATE INDEX IF NOT EXISTS "SkillUsage_userId_idx" ON "SkillUsage" ("userId");

-- 4. Table de templates MCP (marketplace de serveurs préconfigurés)
CREATE TABLE IF NOT EXISTS "McpTemplate" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) DEFAULT '',
  "transport" VARCHAR(20) DEFAULT 'sse',
  "url" VARCHAR(500) DEFAULT '',
  "command" VARCHAR(500) DEFAULT '',
  "args" VARCHAR(500) DEFAULT '',
  "authType" VARCHAR(20) DEFAULT 'none',
  "icon" VARCHAR(50) DEFAULT 'server',
  "isPublic" BOOLEAN DEFAULT true,
  "tags" VARCHAR(50)[] DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "McpTemplate_isPublic_idx" ON "McpTemplate" ("isPublic");
CREATE INDEX IF NOT EXISTS "McpTemplate_name_idx" ON "McpTemplate" ("name");

-- 5. Colonnes manquantes sur Skill (versioning, paramètres statistiques)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Skill' AND column_name='version') THEN
    ALTER TABLE "Skill" ADD COLUMN "version" VARCHAR(20) DEFAULT 'v1';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Skill' AND column_name='usageCount') THEN
    ALTER TABLE "Skill" ADD COLUMN "usageCount" INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Skill' AND column_name='lastUsedAt') THEN
    ALTER TABLE "Skill" ADD COLUMN "lastUsedAt" TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Skill' AND column_name='templateId') THEN
    ALTER TABLE "Skill" ADD COLUMN "templateId" UUID REFERENCES "SkillTemplate" ("id") ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Colonnes manquantes sur McpServer (monitoring : uptime, dernière sync, latence)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='lastSyncAt') THEN
    ALTER TABLE "McpServer" ADD COLUMN "lastSyncAt" TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='lastCallAt') THEN
    ALTER TABLE "McpServer" ADD COLUMN "lastCallAt" TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='avgLatencyMs') THEN
    ALTER TABLE "McpServer" ADD COLUMN "avgLatencyMs" INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='callCount') THEN
    ALTER TABLE "McpServer" ADD COLUMN "callCount" INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='McpServer' AND column_name='uptimeStatus') THEN
    ALTER TABLE "McpServer" ADD COLUMN "uptimeStatus" VARCHAR(20) DEFAULT 'unknown';
  END IF;
END $$;
