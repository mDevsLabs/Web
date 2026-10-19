-- Migration 0042 : sélection de Skills, Plugins, serveurs MCP et outils, par
-- Wakie et par conversation ; avancement de la configuration de départ.
--
-- Le chat Wakies n'appelait qu'un seul outil, la recherche Web, et n'exposait
-- aucune notion de sélection. Les Skills, les Plugins et les serveurs MCP
-- existent déjà dans le compte mAI (`Skill`, `PluginInstallation`, `McpServer`) :
-- cette migration ne les copie nulle part, elle n'enregistre que les
-- IDENTIFIANTS choisis, pour que la bibliothèque reste la source unique.
--
-- SÉMANTIQUE DES NULL — la même que `model` (migration 0041)
--
-- Sur `WakiesWakie` : NULL = aucun réglage, donc ce qui est livré par défaut.
-- Sur `WakiesConversation` : NULL = repli sur le réglage du Wakie. Ce n'est PAS
-- la même chose qu'un tableau vide, qui signifie « choix explicite de ne rien
-- utiliser ». C'est la distinction qui permet à un réglage de Wakie de servir
-- de défaut sans jamais écraser une conversation qui a choisi autrement.
--
-- Les colonnes sont NULLABLES et SANS DEFAULT pour que la migration soit à la
-- fois additive ET neutre : une colonne NOT NULL DEFAULT '[]' rendrait
-- indistinguables « je n'ai rien choisi » et « j'ai choisi de ne rien utiliser »,
-- et changerait le comportement des comptes existants sans que personne l'ait
-- demandé.
--
-- `skillParams` est indexé par identifiant de Skill, et non fusionné : deux
-- Skills distincts peuvent déclarer un paramètre du même nom, et leurs valeurs
-- ne doivent pas se confondre.
--
-- `onboardingCompleted` vaut TRUE par défaut : les Wakies historiques doivent
-- rester reconnaissables et ne pas être renvoyés vers l'assistant. Seule la
-- création d'un espace de départ (ensureStarterWorkspace) passe la ligne à
-- FALSE, au moment exact où elle crée le premier profil.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "WakiesSettings" ADD COLUMN IF NOT EXISTS "onboardingCompleted" boolean NOT NULL DEFAULT true;

--> statement-breakpoint
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "mcpServerIds" uuid[];

--> statement-breakpoint
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "pluginIds" text[];

--> statement-breakpoint
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "skillIds" uuid[];

--> statement-breakpoint
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "skillParams" jsonb;

--> statement-breakpoint
ALTER TABLE "WakiesWakie" ADD COLUMN IF NOT EXISTS "toolIds" text[];

--> statement-breakpoint
ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "mcpServerIds" uuid[];

--> statement-breakpoint
ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "pluginIds" text[];

--> statement-breakpoint
ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "skillIds" uuid[];

--> statement-breakpoint
ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "skillParams" jsonb;

--> statement-breakpoint
ALTER TABLE "WakiesConversation" ADD COLUMN IF NOT EXISTS "toolIds" text[];