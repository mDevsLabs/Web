-- Migration 0031 - Mémoire : complète le schéma et retire la catégorie.
--
-- Deux problèmes distincts, corrigés ici parce qu'ils partagent la table.
--
-- 1. DRIFT : `isEnabled`, `isImportant` et `tags` sont déclarés dans
--    lib/db/schema.ts (et utilisés par lib/db/queries.ts dans des INSERT et
--    des ORDER BY) mais n'existaient dans AUCUNE migration. Ils n'étaient
--    créés que par le DDL runtime — désactivé par défaut depuis la 0.9.0
--    (DB_RUNTIME_DDL_REPAIR) — ou par scripts/repair-db-drift.mjs, qui est
--    un outil ponctuel. Une base construite uniquement depuis les migrations
--    échouait donc en 42703 « column does not exist » sur GET /api/memory et
--    /api/memory/summary, et l'écran mémoire restait vide.
--
-- 2. CATÉGORIE : `category` était un varchar(50) libre, sans enum, sans
--    CHECK et sans index. Le serveur acceptait n'importe quelle chaîne de 50
--    caractères (z.string().max(50)), et rien ne la consommait hors d'un
--    filtre d'interface : ni les prompts (lib/chat/memory.ts n'injecte que
--    `content`), ni les outils IA, ni le tri (seul `isImportant` compte).
--    Elle ne pouvait donc produire que des données incohérentes, la valeur
--    par défaut du schéma Drizzle ("general") n'ayant jamais été alignée sur
--    une contrainte. La fonctionnalité est retirée ; "Important" reste
--    filtrable car c'est le booléen `isImportant`, pas une catégorie.
--
-- Le DROP est fait APRÈS les ADD : sur une base où `category` existe
-- encore, du code d'une version antérieure ne planterait qu'après coup, et
-- l'ordre inverse laisserait une fenêtre sans `isImportant` (tri des
-- mémoires) alors que l'interface le lit déjà.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "UserMemory"
  ADD COLUMN IF NOT EXISTS "isEnabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "UserMemory"
  ADD COLUMN IF NOT EXISTS "isImportant" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "UserMemory"
  ADD COLUMN IF NOT EXISTS "tags" json DEFAULT '[]'::json NOT NULL;
--> statement-breakpoint
ALTER TABLE "UserMemory" DROP COLUMN IF EXISTS "category";
