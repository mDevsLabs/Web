-- Migration 0036 - `ToolExecution.chatId` / `ToolExecution.userId`, et
-- `runId` nullable : tracer les appels d'outils du mode CHAT.
--
-- `ToolExecution` est le journal des appels d'outils, et sa catégorie contient
-- déjà `plugins` et `mcp`. Mais `runId` était `NOT NULL` avec une clé étrangère
-- vers `AgentRun` : la table ne pouvait structurellement QUE contenir des
-- exécutions d'Agent. Conséquence lue sur la page Statistiques : le classement
-- « Outils les plus utilisés » ne comptait les plugins qu'en mode Agent, alors
-- que le chemin Chat (app/api/chat/route.ts) instancie les mêmes outils de
-- plugin via `createPluginTools` sans écrire une seule ligne. Un plugin très
-- utilisé en mode Chat y affichait « 0 exécution » — un chiffre ABSENT, pire
-- qu'un chiffre faux.
--
-- On rend donc la table apte à porter les DEUX chemins :
--
-- - `runId` devient nullable : `NULL` = exécution du chemin Chat. La contrainte
--   d'intégrité reste entière (une valeur présente pointe toujours un run
--   existant, la FK est conservée).
-- - `userId` est ajouté : `ToolExecution` n'avait pas d'identité propre, la
--   lecture de statistiques devait passer par `AgentRun`. Une exécution Chat
--   n'a pas de run, donc pas de chemin vers son compte. Volontairement
--   nullable : les lignes existantes ne sont pas réécrites, et l'historique
--   Agent reste lu par jointure.
-- - `chatId` est ajouté, SANS clé étrangère, comme `UsageEvent.chatId` : la
--   suppression d'une conversation ne doit pas effacer son historique d'appels
--   d'outils.
--
-- Idempotente : `ALTER … DROP NOT NULL` et `ADD COLUMN IF NOT EXISTS` sont
-- rejouables sans effet de bord.
--
-- `ALTER COLUMN … DROP NOT NULL` est une RELAXATION de contrainte, pas une
-- perte : aucune donnée n'est supprimée, aucune colonne n'est retirée.

--> statement-breakpoint
ALTER TABLE "ToolExecution" ALTER COLUMN "runId" DROP NOT NULL;

--> statement-breakpoint
ALTER TABLE "ToolExecution" ADD COLUMN IF NOT EXISTS "chatId" uuid;

--> statement-breakpoint
ALTER TABLE "ToolExecution" ADD COLUMN IF NOT EXISTS "userId" text;

--> statement-breakpoint
-- Lecture de la page Statistiques : « les appels d'outils de ce compte sur la
-- période », chemin Chat compris. `runId IS NULL` n'est pas dans l'index — la
-- colonne est filtrée après le bornage par (userId, createdAt).
CREATE INDEX IF NOT EXISTS "ToolExecution_userId_createdAt_idx"
  ON "ToolExecution" ("userId", "createdAt");
