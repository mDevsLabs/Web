# 🤖 Directives & Règles pour Agents IA — mAI Web (`1-web`)

Ce document contient les règles fondamentales et les consignes d'architecture à respecter impérativement lors du développement sur l'application principale **mAI Web** (`app/`, `components/`, `lib/`, `hooks/`).

---

## 1. 🏗️ Architecture du double runtime

Le dépôt abrite deux mondes qui partagent le `package.json` mais ont des runtimes distincts :
- **L'application Next.js 16** (BFF sous `app/`, `components/`, `lib/`, `hooks/`) :
  - Compilée par `next build`.
  - Typecheckée strictement par `tsconfig.json`.
  - Se connecte à PostgreSQL (Neon) via Drizzle ORM.
- **Le backend Hono** (~45 fichiers TS à la racine du dépôt : `main.ts`, `config.ts`, `models.ts`...) :
  - Déployé indépendamment sur Val Town (`https://mai.val.run`).
  - Hors du build Next et hors du `tsconfig.json`.

> [!IMPORTANT]
> Les routes `app/(chat)/api/**/route.ts` forment un **BFF** (Backend-for-Frontend). Elles appellent le backend distant via `MAI_API_URL` (défaut : `https://mai.val.run`) et normalisent les erreurs amont avec `lib/api/error-response.ts`.

---

## 2. ⚡ Stack technique & Conventions

| Composant | Technologie retenue | Règles impératives |
|---|---|---|
| **Framework** | Next **16.3.3** (App Router, React 19.2) | `params` et `searchParams` sont des **Promises** (`await params`). Tout handler de page doit être `async`. |
| **Interception** | `proxy.ts` | **Pas** de `middleware.ts` (renommé en `proxy.ts` sous Next 16). |
| **Styles** | Tailwind CSS **v4 CSS-first** | **Aucun** `tailwind.config.js`. Variables CSS dans `:root` et `.dark`, exposées via `@theme inline` dans `app/globals.css`. |
| **Design** | Système achromatique | Seuls 4 accents autorisés : `text-success`, `bg-warning/10`, `ring-info/20`, `text-destructive`. **Jamais** de couleurs arbitraires (`emerald-500`, `amber-600`...). |
| **Primitives** | `@utility` dans `globals.css` | Utiliser `surface-card`, `surface-muted`, `chip` (état actif via `data-active`), `field-input`. |
| **Base de données**| Drizzle ORM + PostgreSQL (Neon) | Schéma unique `lib/db/schema.ts`. Migrations strictes et idempotentes dans `lib/db/migrations/`. |
| **Lint / Format** | **Biome** (via `ultracite`) | **Ni ESLint ni Prettier**. Ne pas toucher aux dossiers exclus (`components/ui`, `components/vibe/vibe.css`...). |
| **Tests** | Vitest (unit) + Playwright (e2e) | `pnpm test:unit` doit passer avant toute finalisation. |

---

## 3. 🗄️ Base de données & Migrations

- **Zéro DDL au runtime** : `DB_RUNTIME_DDL_REPAIR="false"` par défaut. Toute colonne ajoutée à `lib/db/schema.ts` exige impérativement une migration SQL.
- **Règle du commit atomique** : Un nouveau fichier `lib/db/migrations/NNNN_nom.sql` doit **toujours** être accompagné de sa mise à jour dans `lib/db/migrations/meta/_journal.json` dans le même commit.
- **Idempotence obligatoire** : Toujours utiliser `IF NOT EXISTS`, `IF EXISTS`, `ON CONFLICT DO NOTHING`.
- **Pas de `DROP COLUMN`** : Les migrations sont additives uniquement.

---

## 4. 🔐 Session & Authentification

- **Le cookie n'est pas la session** : `getMaiUser` (`lib/auth/session.ts`) est la seule autorité. Le contrôle HS256 local n'est qu'une vérification d'expiration (`lib/auth/token-liveness.ts`).
- **Secret partagé** : `MAI_JWT_SECRET` doit être rigoureusement identique entre le client/BFF et le backend Val Town pour éviter que l'utilisateur soit verrouillé dans une fausse session.

---

## 5. 🎯 Forfaits et Quotas

Quatre forfaits canoniques (`lib/auth/plan.ts`) : `free` (0) < `plus` (1) < `pro` (2) < `max` (3).
- Un tier inconnu retombe toujours par sécurité sur `free` (`normalizeTierKey`).
- Les quotas sont gérés par le serveur (`lib/plans/tier-limits.ts`). L'interface ne fait que refléter les limites renvoyées par le backend.
- L'Espace Agent est strictement réservé aux forfaits payants (`plus`, `pro`, `max`).

---

## 6. 🛠️ Commandes usuelles

```bash
pnpm dev            # Démarre le serveur Next.js en développement
pnpm build          # Lance la compilation de production Next.js
pnpm check          # Vérification de lint et formatage (Biome / ultracite)
pnpm typecheck      # Vérification des types TypeScript (tsc --noEmit)
pnpm test:unit      # Exécution des tests unitaires Vitest
pnpm db:generate    # Génère les fichiers de migration Drizzle
pnpm db:migrate     # Applique les migrations en base
```
