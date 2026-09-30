-- Migration 0033 - `UsageEvent.chatId` : relier un comptage de tokens à sa conversation.
--
-- `UsageEvent` est le journal événementiel de la consommation (une ligne par
-- appel modèle) et sa seule lecture est désormais la page Statistiques. Il
-- portait `userId`, `model`, les compteurs de tokens et `createdAt` — mais
-- AUCUN lien vers la conversation à l'origine de l'appel. Conséquence : dès
-- qu'une requête doit trancher autre chose qu'un total global, il ne reste
-- qu'à deviner la conversation en découpant la clé d'idempotence, qui est une
-- convention applicative et pas un contrat en base :
--
--   Chat  → `chat:<chatId>:<messageId>:<model>`   (lib/chat/stream.ts:94)
--   Agent → `agent:<runId>:<revision>`              (lib/agent/runtime.ts:425)
--
-- Sans lien explicite, les filtres « projet », « mode », « modèle par
-- conversation » et la répartition Chat/Agent ne sont pas exprimables en SQL.
-- On fige donc le lien dans la colonne.
--
-- La colonne reste VOLATILE pour le comportement métier : `recordTokenUsage`
-- (lib/db/queries.ts) continue d'écrire si l'INSERT échoue, et la page
-- Statistiques lit `COALESCE` côté requête. Un backfill raté laisse donc des
-- lignes sans `chatId` — jamais l'inverse : mettre la colonne en NOT NULL
-- ferait échouer le débit de quota, qui est le chemin critique.
--
-- Le backfill est le SEUL endroit de tout le dépôt qui exploite la convention
-- de clé d'idempotence. Une fois ces lignes remplies, plus rien n'en dépend.
--
-- Deux pièges traités explicitement :
--
-- 1. Le cast `::uuid` du backfill Chat lèverait 22P02 (invalid_text_
--    representation) sur une clé d'idempotence mal formée, code qui n'est pas
--    dans la liste des SQLSTATE tolérés par le runner et ferait échouer toute
--    la migration pour une ligne parasite. Le motif est donc filtré par une
--    expression régulière qui n'accepte qu'un uuid canonique, et le
--    `WHERE "chatId" IS NULL` rend la reprise sans objet une fois le
--    remplissage fait.
--
-- 2. `AgentRun` n'est pas garantie présente sur un environnement de schéma
--    partiel. Le backfill Agent est encapsulé dans un DO $$ gardé par
--    `to_regclass` (motif de la migration 0032), et son `::text` évite tout
--    cast de type.
--
-- `chatId` n'est volontairement PAS une clé étrangère vers `Chat.id` : les
-- lignes de planification (lib/planning/executor.ts:424) peuvent être écrites
-- avant que la conversation ne soit persistée, et une FK les refuserait alors.
-- La colonne reste un pointeur souple, comme `AgentRun.chatId` avant elle.
--
-- Idempotente : sûre à rejouer (IF NOT EXISTS + WHERE IS NULL).

--> statement-breakpoint
ALTER TABLE "UsageEvent" ADD COLUMN IF NOT EXISTS "chatId" uuid;

--> statement-breakpoint
-- Backfill Chat : le chatId est le 2e segment de `chat:<uuid>:<messageId>:<model>`.
-- Le motif n'accepte qu'un uuid canonique, donc le cast ne peut pas lever 22P02.
UPDATE "UsageEvent"
   SET "chatId" = split_part("id", ':', 2)::uuid
 WHERE "chatId" IS NULL
   AND "id" ~ '^chat:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}:';

--> statement-breakpoint
-- Backfill Agent : `agent:<runId>:<revision>` → AgentRun.chatId (NOT NULL).
DO $$
BEGIN
  IF to_regclass('public."UsageEvent"') IS NOT NULL
     AND to_regclass('public."AgentRun"') IS NOT NULL
  THEN
    UPDATE "UsageEvent" u
       SET "chatId" = r."chatId"
      FROM "AgentRun" r
     WHERE u."chatId" IS NULL
       AND u."id" LIKE 'agent:%'
       AND r."id"::text = split_part(u."id", ':', 2);
  END IF;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UsageEvent_chatId_idx" ON "UsageEvent" ("chatId");
