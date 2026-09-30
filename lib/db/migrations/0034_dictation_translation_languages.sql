-- Migration 0034 - Langues de dictée vocale et de traduction.
--
-- Deux préférences utilisateur, toutes deux dans `user_preferences` parce
-- qu'elles décrivent une façon de travailler et non une donnée personnelle :
--
--  - `defaultDictationLanguage` : locale BCP-47 de la reconnaissance vocale
--    du navigateur. Tant que cette colonne n'existe pas, `hooks/use-speech.ts`
--    impose `navigator.language || "fr-FR"` en dur, au démarrage ET à chaque
--    `start()` : impossible de dicter dans une autre langue que celle du
--    système. La valeur sentinelle `auto` conserve exactement ce
--    comportement, ce qui rend la migration sans risque pour les comptes
--    existants.
--
--  - `defaultTranslationLanguage` : cible DeepL par défaut du bouton
--    « Traduire » sur une réponse de l'IA. `EN` parce que l'interface est
--    française et que la traduction sert d'abord à lire une réponse dans une
--    autre langue : le comportement reste inchangé pour qui ne touche jamais
--    au réglage.
--
-- Les deux colonnes sont des `varchar` libres, pas des enums : la liste des
-- locales Web SpeechSupported évolue avec les navigateurs, et un enum PG
-- rendrait impossible d'ajouter une locale sans ALTER TYPE. La validation
-- réelle est faite par `lib/i18n/languages.ts`, dont les listes sont la
-- source de vérité partagée entre l'interface et la route serveur.
--
-- Une contrainte CHECK n'est pas posée non plus, volontairement : une
-- préférence illisible doit retomber sur son défaut (fail-safe), jamais
-- faire échouer l'écriture de toute la ligne de préférences.
--
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultDictationLanguage" varchar(20) NOT NULL DEFAULT 'auto';

--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "defaultTranslationLanguage" varchar(10) NOT NULL DEFAULT 'EN';
