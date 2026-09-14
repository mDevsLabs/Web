-- Migration 0019: lien stable entre un Skill/McpServer installé et son modèle.
-- Idempotent: ALTER ... IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
--
-- • "Skill"."templateId" passe de uuid à text : les modèles de Skills sont
--   identifiés par un slug stable (ex : « sql-data-analyst »), et non par un
--   uuid de ligne de la table SkillTemplate désormais inutilisée.
-- • "McpServer"."templateId" est ajouté (slug du modèle MCP d'origine), ce qui
--   permet un appariement exact dans le Store et une installation idempotente.
-- • Les index uniques partiels (userId, templateId) empêchent toute double
--   installation du même modèle pour un même utilisateur.

--> statement-breakpoint
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "templateId" text;

--> statement-breakpoint
ALTER TABLE "Skill" DROP CONSTRAINT IF EXISTS "Skill_templateId_fkey";

--> statement-breakpoint
ALTER TABLE "Skill" ALTER COLUMN "templateId" TYPE text USING "templateId"::text;

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Skill_userId_templateId_key" ON "Skill" USING btree ("userId", "templateId") WHERE "templateId" IS NOT NULL;

--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN IF NOT EXISTS "templateId" text;

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "McpServer_userId_templateId_key" ON "McpServer" USING btree ("userId", "templateId") WHERE "templateId" IS NOT NULL;
