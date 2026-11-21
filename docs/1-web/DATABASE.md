# Base de données & Migrations — mAI Web

Ce document détaille la politique, le schéma et la gestion des migrations PostgreSQL de l'application mAI Web.

---

## 1. Technologies & Fournisseurs

- **Moteur de base de données**: PostgreSQL serverless hébergé chez **Neon**.
- **ORM**: **Drizzle ORM** avec pilote `postgres` (postgres.js).
- **Configuration Drizzle**: `drizzle.config.ts`.
- **Définition du schéma**: Fichier central unique `lib/db/schema.ts` (déclarant toutes les tables: `User`, `Chat`, `Message`, `Vote`, `Document`, `Suggestion`, `UserMemory`, et les tables spécifiques aux agents).

---

## 2. Règles absolues de migration

### A. Idempotence obligatoire
Chaque instruction SQL dans les fichiers de migration (`lib/db/migrations/NNNN_nom.sql`) doit être strictement rejouable sans provoquer d'erreur:
- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE "X" ADD COLUMN IF NOT EXISTS "y"`
- `CREATE INDEX IF NOT EXISTS`
- `DO $$ BEGIN... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`

### B. Le Journal de migration Drizzle (`_journal.json`)
Drizzle suit l'historique des migrations via `lib/db/migrations/meta/_journal.json`.
> [!CAUTION]
> Un fichier `.sql` ajouté sans son entrée correspondante dans `_journal.json` est un **no-op silencieux**.
> Inversement, une entrée dans `_journal.json` sans fichier `.sql` fait planter le job de migration.
> **Le `.sql` et `_journal.json` doivent toujours être inclus dans le même commit.**

### C. Zéro DDL au runtime
Les fonctions de réparation dynamique au runtime (`ensureTableTypes`, `ensureColumnDefaults` dans `lib/db/queries.ts`) sont protégées par le drapeau `DB_RUNTIME_DDL_REPAIR=false`.
- Il est formellement interdit d'altérer des tables à la volée durant les requêtes utilisateur.
- Toute nouvelle colonne ajoutée à `lib/db/schema.ts` exige impérativement une migration préalable appliquée en base, sous peine d'erreur SQL `42703 (undefined_column)`.
- La garde de déploiement `scripts/check-db-schema.mjs` vérifie la présence effective de toutes les tables et colonnes requises avant de permettre la mise en production.

---

## 4. Modules de requêtes serveur dédiés (Neon direct)

Dans le cadre du décommissionnement de Val Town, les opérations critiques sont exécutées directement sur Neon via Drizzle :

- **Générations d'images & audio** : `lib/db/queries/generations.ts`
  - Table `mprojects_image_generations` : enregistrement, pagination, suppression et épinglage des générations d'images.
  - Table `mprojects_speech_generations` : enregistrement, pagination et suppression des synthèses vocales.
  - Calcul direct des quotas journaliers (`countTodayImageGenerations`).
- **Stockage Cloud & Fichiers** : `lib/db/queries/storage.ts`
  - Tables `cloud_storage_usage` & `cloud_files` : lecture des quotas d'espace par utilisateur et forfait (`bytes_limit`, `bytes_used`), listing paginé des fichiers, renommage et suppression directe en base avec transactions atomiques.
- **Authentification & OTP** : `lib/auth/verification.ts` & `lib/auth/server-auth.ts`
  - Tables `verification_codes`, `token_blacklist` : émission et validation des codes de vérification OTP, mise à jour sécurisée des profils et avatars utilisateur.
- **Moteur d'usage en %** : `lib/plans/usage-engine.ts`
  - Comptabilisation et agrégation directe des métriques d'utilisation en pourcentage par forfait (Free: 100, Plus: 200, Pro: 400, Max: 1 000 unités), réinitialisé de manière hebdomadaire (lundi à 00:00 UTC).

---

## 5. Commandes de gestion

```bash
# Générer une nouvelle migration à partir des changements dans schema.ts
pnpm db:generate

# Exécuter les migrations en local ou sur la base cible
pnpm db:migrate

# Ouvrir l'explorateur visuel Drizzle Studio
pnpm db:studio
```
