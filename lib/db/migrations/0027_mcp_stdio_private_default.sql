-- Migration 0027 : stdio MCP désactivé par défaut et opt-in explicite.
-- Les anciennes lignes qui profitaient du défaut historique true sont
-- replacées sur false ; un administrateur peut ensuite réactiver un wrapper
-- vérifié via les préférences MCP.

--> statement-breakpoint
ALTER TABLE "user_mcp_prefs"
  ALTER COLUMN "allowStdio" SET DEFAULT false;

--> statement-breakpoint
UPDATE "user_mcp_prefs"
SET "allowStdio" = false
WHERE "allowStdio" = true;
