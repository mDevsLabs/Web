-- Migration : versioning des Skills (snapshots + statistiques d'usage).
-- Recrée de façon idempotente les tables du fichier orphelin
-- 01_skills_mcp_marketplace.sql (jamais appliqué par drizzle-kit,
-- absent de meta/_journal.json).

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
  "mcpServerIds" JSONB DEFAULT '[]',
  "mcpToolFilter" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SkillVersion_skillId_idx" ON "SkillVersion" ("skillId");
CREATE INDEX IF NOT EXISTS "SkillVersion_userId_idx" ON "SkillVersion" ("userId");
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='SkillVersion') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SkillVersion' AND column_name='mcpServerIds') THEN
      ALTER TABLE "SkillVersion" ADD COLUMN "mcpServerIds" JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SkillVersion' AND column_name='mcpToolFilter') THEN
      ALTER TABLE "SkillVersion" ADD COLUMN "mcpToolFilter" JSONB DEFAULT '{}';
    END IF;
  END IF;
END $$;
--> statement-breakpoint
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
--> statement-breakpoint
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
