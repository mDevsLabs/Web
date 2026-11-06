-- Migration 0082: catalogue persistant de la boutique Quizzly.
--
-- Le catalogue statique de `lib/quizzly/shop.ts` reste la base. Les articles
-- et offres ajoutés par `scripts/admin.ts` vivent ici : le script et le
-- serveur Next sont deux processus distincts, une liste en mémoire ne
-- survivrait ni au redémarrage ni à un déploiement.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuizzlyShopItem" (
  "id" varchar(40) PRIMARY KEY NOT NULL,
  "label" varchar(60) NOT NULL,
  "description" varchar(300) NOT NULL,
  "kind" varchar(12) NOT NULL,
  "price" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
