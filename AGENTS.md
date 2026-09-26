<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` - verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# mAI Web

Plateforme d'IA multi-fonction : chat, Agent autonome, Skills, MCP, plugins,
mémoire, projets, génération d'images et de synthèse vocale, tâches planifiées.
Interface et documentation **en français**.

---

## 1. Le point le plus important : deux runtimes dans un seul dépôt

Ce dépôt contient **deux applications indépendantes** qui partagent `package.json`
mais ne se compilent pas ensemble.

| | Application Next.js | Backend Hono (Val Town) |
|---|---|---|
| Racine | `app/`, `components/`, `lib/`, `hooks/` | ~45 fichiers `*.ts` **à la racine du dépôt** |
| Point d'entrée | `app/layout.tsx` | `main.ts` |
| Build | `next build` | Aucun — déployé sur `https://mai.val.run` |
| Base | PostgreSQL (Drizzle) | Neon **et** SQLite (`esm.town/v/std/sqlite`) |
| Auth | `MAI_SESSION_COOKIE` + NextAuth v5 | JWT `jose` + clé API `mai-<tier>-…` |
| Typecheck | Oui (`tsconfig.json`) | **Non** — exclu du `include` |

Conséquences pratiques :

- `main.ts`, `config.ts`, `vibe-*.ts`, `models.ts`, `email.ts`, `realtime.ts`…
  sont **hors du build Next**. Les modifier ne déclenche ni typecheck ni build.
  Ils sont déployés indépendamment sur Val Town.
- L'application Next est un **BFF** : ses 78 routes `app/(chat)/api/**/route.ts`
  appellent le backend via `MAI_API_URL` (`lib/constants.ts`, défaut
  `https://mai.val.run`) et normalisent les erreurs amont avec
  `lib/api/error-response.ts`.
- Le détail du backend est documenté dans **`docs/BACKEND_API.md`** (les 42
  fichiers du graphe d'imports transitif de `main.ts`).
- Le détail de l'Agent est dans **`docs/AGENT.md`**.
- L'API publique pour agents externes est dans **`docs/AI_AGENTS_API.md`**.

## 2. Stack

| Domaine | Choix |
|---|---|
| Framework | Next **16.3.3** (App Router, `cacheComponents`, `reactCompiler`), React 19.2 |
| Interception | `proxy.ts` — **pas** `middleware.ts` (renommé en Next 16) |
| Styles | Tailwind CSS **v4 CSS-first** (aucun `tailwind.config.js`) |
| UI | Radix (`radix-ui` unifié), `cva`, `cmdk`, `sonner`, `framer-motion`, `lucide-react` |
| Base | `drizzle-orm` + `postgres` (PG) · `zod` v4 |
| Auth | `next-auth` 5 (beta), `jose`, `bcrypt` |
| État client | `swr` (jamais React Query ni Redux) |
| AI | `ai` 7 + `@ai-sdk/react` + `@ai-sdk/openai` |
| Lint/format | **Biome** via `ultracite`. Il n'y a **ni ESLint ni Prettier** |
| Tests | `vitest` (unit) + `playwright` (e2e) |

`components.json` déclare le style shadcn maison **`radix-maia`**.
`biome.jsonc` **exclut** du lint : `components/ui`, `components/ai-elements`,
`components/elements`, `lib/utils.ts`, `hooks/use-mobile.ts`, et les catalogues
générés `lib/plugins/*.generated.ts`.

## 3. Arborescence

```
app/
├── (auth)/                 login, register, NextAuth
├── (chat)/                 l'application authentifiée
│   ├── api/                78 routes BFF
│   ├── agents/ archived/ audio/ chat/[id]/ images/ library/
│   ├── mcp/ planning/ projects/ skills/ tools/
│   └── settings/           page.tsx (2561 l.) + agent/page.tsx
├── api/cron/               ticks Agent et planification
├── globals.css             ← design system (tokens + primitives)
└── layout.tsx              polices, ThemeProvider, Toaster
components/
├── agent/ agents/ ai-elements/ chat/ common/ onboarding/ planning/ settings/ tools/
└── ui/                     24 primitives Radix (exclus du lint)
lib/
├── agent/ (35 f.) ai/ auth/ chat/ commands/ db/ editor/ mcp/ plans/ plugins/
├── projects/ prompts/ security/ skill-templates/ notifications/
└── constants.ts errors.ts ratelimit.ts types.ts utils.ts
hooks/                      21 hooks, dont use-tier, use-notifications
tests/                      unit/ e2e/ pages/ prompts/
docs/                       AGENT.md, BACKEND_API.md, AI_AGENTS_API.md, …
```

Alias : `@/*` → racine du dépôt (d'où `app/…`, `lib/…`).

## 4. Design system — `app/globals.css`

Tailwind v4 : **tous les tokens sont des variables CSS**, déclarées dans
`:root` puis redéfinies dans `.dark`, et exposées au namespace Tailwind via
`@theme inline`. Il n'y a pas de fichier de configuration Tailwind.

### Règle de couleur

L'interface est **achromatique par défaut**. Une couleur n'apparaît que
lorsqu'elle porte une information, et il n'existe que **quatre** accents :

| Token | Rôle |
|---|---|
| `--success` | validation, permission accordée |
| `--warning` | quota, donnée épinglée, « Important » |
| `--info` | information, tags |
| `--destructive` | erreur, action destructive, champ obligatoire |

→ utiliser `text-success`, `bg-warning/10`, `ring-info/20`, etc.
**Ne jamais** écrire `emerald-500`, `amber-600`, `sky-600` dans un composant :
c'était la source principale d'incohérence avant la refonte. Ajouter une
couleur passe par `globals.css`.

### Primitives de surface

Quatre `@utility` encapsulent ce qui était dupliqué ~13 fois par fichier :

| Primitive | Remplace |
|---|---|
| `surface-card` | `rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4 sm:p-6` |
| `surface-muted` | encadré explicatif / info / avertissement |
| `chip` | pastille filtrante — **état actif via `data-active`, jamais une classe conditionnelle** |
| `field-input` | champ de saisie, focus porté par l'anneau |

## 5. Forfaits

Quatre forfaits : **Free**, **Plus**, **Pro**, **Max**.

Vocabulaire canonique (`lib/auth/plan.ts`) : `free | plus | pro | max`, rang
0→3. `normalizeTierKey` mappe l'alias backend `gratuit` → `free`, et **retombe
sur `free`** pour toute valeur inconnue — fail-safe obligatoire : un tier
illisible ne doit jamais accorder de privilège.

| Source de vérité | Fichier |
|---|---|
| Vocabulaire, rangs, gardes | `lib/auth/plan.ts` |
| Quotas et plafonds | `lib/plans/tier-limits.ts` |
| Durées de run Agent, timeouts techniques | `lib/plans/tier-capabilities.ts` |
| Miroir backend | `config.ts` (Val Town) |

`lib/plans/tier-limits.ts` est le **point d'entrée** de toute limite produit.
Les constantes de quotas y sont ajoutées **avec** leurs getters, et le client
ne recalcule jamais : il lit ce que le serveur applique.

## 6. Base de données

- Schéma : `lib/db/schema.ts` (un seul fichier, lu par `drizzle-kit`)
- Requêtes : `lib/db/queries.ts` (~5400 l.) et les `lib/agent/*-queries.ts`
- Migrations : `lib/db/migrations/`, Drizzle
- Moteur : PostgreSQL (Neon)

### 6.1 Écrire une migration

Les deux fichiers — le `.sql` **et** l'entrée `meta/_journal.json` — vont dans
le **même commit**. Un `.sql` sans entrée de journal est un **no-op silencieux** ;
une entrée sans `.sql` fait planter le job.

```sql
-- Migration NNNN : pourquoi (le QUOI est évident dans le SQL).
-- Idempotente : sûre à rejouer sur une base déjà migrée.

--> statement-breakpoint
ALTER TABLE "X" ADD COLUMN IF NOT EXISTS "y" boolean DEFAULT false NOT NULL;
```

Contraintes impératives :

- **Idempotence obligatoire** : `IF NOT EXISTS`, `IF EXISTS`,
  `ON CONFLICT DO NOTHING`, `DO $$ … EXCEPTION WHEN duplicate_object THEN NULL`.
  Drizzle ne compare **aucun checksum** : réappliquer est silencieusement toléré,
  une entrée déjà appliquée n'est jamais rejouée.
- **`when` strictement croissant, ajouté en dernier dans le tableau.** Le
  runtime itère le **tableau** et compare au watermark numérique : une entrée
  insérée avec un `when` périmé est ignorée **sans erreur**.
- **Nommage** : `NNNN_snake_case_descriptif.sql`, préfixe 4 chiffres.
- **Pas de `DROP COLUMN` ni de changement destructif** — les migrations sont
  additives ; le rollback applicatif consiste à redéployer l'artefact
  précédent.
- Le runner est `lib/db/migrate.ts` (`pnpm db:migrate`). Il exécute ~40 étapes
  de réparation **avant** les migrations Drizzle, chacune en `try/catch` +
  `noteIgnoredStep(error)`. Sept SQLSTATE sont tolérés (`42701`, `42703`,
  `42710`, `42883`, `42P01`, `42P07`, `42P16`) ; **tout autre échec fait
  échouer le job** sauf `MIGRATIONS_STRICT=false`.
- `scripts/check-db-schema.mjs` est la garde bloquante du déploiement
  (`REQUIRED_TABLES`, `REQUIRED_COLUMNS`). Toute colonne ajoutée par une
  migration y entre.

### 6.2 Pas de DDL au runtime

`ensureTableTypes` / `ensureColumnDefaults` (`lib/db/queries.ts`) sont
**derrière `DB_RUNTIME_DDL_REPAIR=true`**, désactivé par défaut et
contractuel (`tests/unit/db-migration-safety.test.ts`).

Corollaire : **toute colonne ajoutée à `schema.ts` exige une migration**, sinon
les requêtes échouent en `42703`. Ajouter une colonne à `lib/db/schema.ts` sans
migration a déjà laissé `UserMemory` inutilisable sur une base neuve.

Le backend Val Town fait exception : il utilise `ensureDMTables()`,
`ensureMAIAccount()`, `ensureMAIConversations()` et `ensurePostColumns()` au
chargement, sur sa base SQLite. Ne pas confondre les deux politiques.

## 7. Conventions de code

- **Commentaires, identifiants de commit et messages d'erreur en français.**
  L'interface est monolingue.
- Explication du **pourquoi** en tête de fichier ; le *quoi* est dans le code.
- Un `server-only` (`import "server-only"`) sur tout module qui touche la base
  ou les secrets. Un module destiné au client **ne doit pas** importer
  `lib/api/error-response` (il est `server-only`) : extraire la logique pure
  dans `lib/` et garder la fabrication de `Response` dans la route.
- Les secrets d'agents ne sont **jamais** devinés ni transmis par l'API : email
  vide, clés utilisateur absentes.
- Un tier illisible ⇒ `free`. Une préférence de notification illisible ⇒ on
  envoie quand même et on journalise.
- `pnpm check` avant de dire « fini ». `pnpm typecheck`, `pnpm test:unit`
  également.

## 8. Commandes

```bash
pnpm dev            # next dev
pnpm build          # next build
pnpm check          # ultracite check  (Biome)
pnpm fix            # ultracite fix    (Biome, réécrit TOUT le dépôt)
pnpm typecheck      # tsc --noEmit
pnpm test:unit      # vitest run
pnpm test           # playwright (e2e)
pnpm db:generate    # drizzle-kit generate
pnpm db:migrate     # tsx lib/db/migrate.ts
pnpm db:studio      # drizzle-kit studio
```

> ⚠️ `pnpm fix` formate **tout** le dépôt, y compris `*.sql` et `*.md`. En cas
> de travail parallèle dans l'arbre, préférer :
> `node node_modules/@biomejs/biome/bin/biome check --write <fichiers>`

## 9. Points d'attention historiques

Des pièges déjà payés, à ne pas réintroduire :

- **`loader: null` de Next 16** : tout handler de page doit être `async`.
- `params` et `searchParams` sont des **Promises** dans les routes :
  `{ params }: { params: Promise<{ id: string }> }` puis `await params`.
- Le champ `users.tier` est un `varchar(50)` **libre**, absent de
  `lib/db/schema.ts` : `drizzle-kit` n'en produira jamais le DDL. Toute
  contrainte l'impliquant doit être écrite à la main (migration **et**
  `lib/db/migrate.ts` **et** éventuellement `scripts/check-db-schema.mjs`).
- `lib/db/queries.ts` conserve un repli vers les colonnes historiques de
  `users` (`custom_instructions`, …) pour les environnements non migrés.
- Les quotas de tokens du chat sont vérifiés côté serveur ; l'interface ne
  fait qu'afficher. Le serveur tranche.
- `Notification.permission` ne peut être demandée que depuis un geste
  utilisateur — d'où la modale au chargement avec un bouton explicite.
