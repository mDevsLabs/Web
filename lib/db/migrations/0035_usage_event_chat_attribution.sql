-- Migration 0035 - `UsageEvent.chatMode` / `UsageEvent.chatProjectId` : figer
-- l'attribution d'un comptage de tokens à sa conversation.
--
-- La migration 0033 a posé `UsageEvent.chatId`, et la page Statistiques s'en
-- sert pour filtrer « mode » et « projet ». Elle le fait par une JOINTURE
-- `Chat` — et cette jointure est fausse dès que la conversation est supprimée :
--
--   `deleteChatById` / `deleteAllChatsByUserId` (lib/db/queries.ts) SUPPRIMENT
--   la ligne `Chat`. `UsageEvent` survit (aucune clé étrangère), donc la
--   consommation existe encore, mais plus rien ne prouve à quelle conversation
--   elle appartenait. Un `INNER JOIN` faisait alors disparaître les tokens
--   d'une conversation supprimée : poser le filtre « Mode Chat » suffisait à
--   faire chuter le total de tokens, et le révoquer ne le remplaçait pas.
--
-- Pire : la jointure est contestable même quand la conversation existe.
-- `Chat.projectId` est en `ON DELETE SET NULL` — supprimer un projet fait donc
-- disparaître l'information « cette consommation venait de ce projet ».
--
-- On fige donc les DEUX dimensions dans le journal, au moment où elles sont
-- vraies. Le filtre devient une colonne comparée, plus une jointure dont
-- l'intégrité dépend d'une décision de l'utilisateur.
--
-- Volontairement SANS clé étrangère, comme `chatId` : `recordTokenUsage` écrit
-- sur le chemin critique du quota et ne doit jamais échouer parce qu'une
-- conversation n'existe pas encore. Une valeur illisible reste `NULL` et la
-- ligne est comptée dans le total non filtré — un token consommé ne disparaît
-- jamais d'un chiffre global.
--
-- Le backfill ne touche QUE les lignes dont la conversation existe encore : une
-- conversation déjà supprimée n'a plus de mode à recopier, et deviner serait
-- pire qu'ignorer. Ces lignes restent donc non attribuables — le tableau de
-- gauche filtre par mode les exclut, ce que la page signale (`warnings`).
--
-- Idempotente : sûre à rejouer (IF NOT EXISTS + backfill restreint aux lignes
-- encore vides). Le `to_regclass` évite d'échouer sur un schéma partiel.

--> statement-breakpoint
ALTER TABLE "UsageEvent" ADD COLUMN IF NOT EXISTS "chatMode" varchar(16);

--> statement-breakpoint
ALTER TABLE "UsageEvent" ADD COLUMN IF NOT EXISTS "chatProjectId" uuid;

--> statement-breakpoint
-- Backfill depuis `Chat`, pour les conversations encore vivantes.
DO $$
BEGIN
  IF to_regclass('public."UsageEvent"') IS NOT NULL
     AND to_regclass('public."Chat"') IS NOT NULL
  THEN
    UPDATE "UsageEvent" u
       SET "chatMode" = c."mode",
           "chatProjectId" = c."projectId"
      FROM "Chat" c
     WHERE u."chatId" = c."id"
       AND (u."chatMode" IS NULL OR u."chatProjectId" IS NULL);
  END IF;
END $$;

--> statement-breakpoint
-- La requête la plus fréquente de la page Statistiques est « mes tokens de la
-- période, pour ce mode » : sans cet index, chaque changement de filtre est un
-- parcours de toutes les lignes du compte sur la fenêtre.
CREATE INDEX IF NOT EXISTS "UsageEvent_userId_chatMode_createdAt_idx"
  ON "UsageEvent" ("userId", "chatMode", "createdAt");
