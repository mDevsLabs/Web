<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

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
- Le détail du backend est documenté dans **`docs/1-web/BACKEND_API.md`** (les 42
  fichiers du graphe d'imports transitif de `main.ts`).
- Le détail de l'Agent est dans **`docs/1-web/AGENT_ENGINE.md`**.
- L'API publique pour agents externes est dans **`docs/1-web/AI_AGENTS_API.md`**.
- Les règles spécifiques par domaine sont réparties dans **`docs/1-web/AGENTS.md`**,
  **`docs/2-vibe/AGENTS.md`**, **`docs/3-wakies/AGENTS.md`**, **`docs/4-coder/AGENTS.md`**
  et **`docs/5-site/AGENTS.md`**.


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
│   ├── settings/           page.tsx (2561 l.) + agent/page.tsx
│   └── vibe/               app sociale portée sous /vibe (pages générées)
├── api/cron/               ticks Agent et planification
├── globals.css             ← design system (tokens + primitives)
└── layout.tsx              polices, ThemeProvider, Toaster
components/
├── agent/ agents/ ai-elements/ chat/ common/ onboarding/ planning/ settings/ tools/
├── vibe/                   Vibe portée (vibe.css généré) + router.tsx
└── ui/                     24 primitives Radix (exclus du lint)
lib/
├── agent/ (35 f.) ai/ auth/ chat/ commands/ db/ editor/ mcp/ plans/ plugins/
├── projects/ prompts/ security/ skill-templates/ notifications/
├── vibe/                   services, hooks et contextes de Vibe (api, theme)
├── wakies/                 données, quotas et utilitaires de /wakies
└── constants.ts errors.ts ratelimit.ts types.ts utils.ts
hooks/                      21 hooks, dont use-tier, use-notifications
tests/                      unit/ e2e/ pages/ prompts/
docs/                       README.md, 1-web/, 2-vibe/, 3-wakies/, 4-coder/
apps/vibe/                  source Vite d'origine (référence, hors build Next)

apps/wakies/                source OpenMuse (Expo/Hono), référence hors build Next
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

node scripts/build-vibe-css.mjs      # régénère components/vibe/vibe.css
node scripts/build-vibe-routes.mjs   # régénère les 15 pages app/(chat)/vibe/**
node scripts/build-wakies-css.mjs    # régénère les 2 feuilles de Wakies
```

> ⚠️ `pnpm fix` formate **tout** le dépôt, y compris `*.sql` et `*.md`. En cas
> de travail parallèle dans l'arbre, préférer :
> `node node_modules/@biomejs/biome/bin/biome check --write <fichiers>`

## 8.1 Intégration Vibe (`/vibe`)

Vibe, l'application sociale, est **portée** depuis `apps/vibe/` (app Vite
conservée en référence, non compilée par Next) sous `/vibe`. Guide complet :
`docs/2-vibe/INTEGRATION.md` ; portage des composants : `components/vibe/README.md`.
Règles dédiées pour agents : `docs/2-vibe/AGENTS.md`.

Quatre règles à ne pas contourner :

- **`components/vibe/vibe.css` et les pages `app/(chat)/vibe/**/page.tsx` sont
  générés** (`scripts/build-vibe-css.mjs`, `scripts/build-vibe-routes.mjs`).
  Corriger la source, jamais la sortie.
- **Tout Vibe vit sous `.vibe-root`** (thème, `data-theme`, `data-animations`),
  donc les classes dépendant du thème s'écrivent `vibe-dark:` — jamais `dark:`,
  qui suit `<html>` (la variante est déclarée dans `app/globals.css`).
- **Les URL passent par `components/vibe/router.tsx`** : `toVibePath`,
  `stripVibeBasePath`, `toVibeAbsoluteUrl`. Un chemin écrit à la main mène hors
  de `/vibe` (404 chez le destinataire). `/vibe/@pseudo` est réécrit vers
  `/vibe/u/[username]` par `next.config.ts`.
- **`lib/vibe/context/ThemeContext.tsx` : l'ordre des clés de cinq tables de
  réglages est l'ordre d'affichage** (protégé par un override `useSortedKeys`).

`components/vibe/vibe.css` et `apps/vibe/**` sont exclus de Biome ; le code
porté contient deux overrides documentés dans `biome.jsonc`.

## 8.2 Intégration Wakies (`/wakies`)

Wakies, l'espace de travail personnel, est **porté** depuis `apps/wakies/` (source OpenMuse conservée en référence) sous `/wakies`. Guide complet :
`docs/3-wakies/INTEGRATION.md` ; règles du port : `components/wakies/README.md`.
Règles dédiées pour agents : `docs/3-wakies/AGENTS.md`.

Contrairement à Vibe, ce port remplace des **services** par l'hôte, pas
seulement des fichiers :

- **Comptes** : plus d'`OWNER_TOKEN`. Le client (`components/wakies/api.ts`)
  n'envoie rien ; c'est le cookie de session mAI, et `proxy.ts` protège
  `/wakies` comme `/api/wakies/**`.
- **Données** : les deux SQLite du gabarit deviennent les seize tables
  `Wakies*` (migration `0037_wakies.sql`). Toute ligne porte `userId`, et
  `lib/wakies/queries.ts` l'exige en premier paramètre : une fonction sans
  `userId` n'a pas d'existence.
- **IA** : le chat passe par `/api/wakies/chat` (pipeline de l'hôte), plus par
  CopilotKit Intelligence. Les messages sont des `UIMessage` stockés dans
  `WakiesMessage`, et un message Wakie consomme le quota hebdomadaire du compte
  — il n'existe pas de quota séparé.
- **Web** : l'outil `webSearch` de l'hôte, donc `/v1/web/search`.
- **Tâches planifiées** : plus de `setInterval` ; tick par
  `app/api/cron/wakies` (à planifier, `CRON_SECRET`), bail transactionnel.

Cinq règles à ne pas contourner :

- **Tout Wakies vit sous `.wakies-root`**, et `/wakies` vit dans son PROPRE
  groupe de routes (`app/(wakies)/wakies`) : son rail est en `position: fixed`,
  et le layout `(chat)` lui superposerait une seconde navigation.
- **`components/wakies/wakies.css` et `wakies-editor.css` sont générés**
  (`scripts/build-wakies-css.mjs`). Corriger la source dans
  `apps/wakies/integration/web/`, jamais la sortie.
- **Pas de variante `wakies-dark`** : Wakies est son propre thème clair, sans
  Tailwind. Ne pas introduire de `dark:`.
- **Pas de CopilotKit, pas de `react-markdown`** : `useChat` (AI SDK) et
  `components/wakies/markdown.tsx` (Streamdown, le moteur de l'hôte).
- **Le vocabulaire est « conversation », pas « thread »** : `conversationId`.
  Et l'agent s'appelle un **Wakie**, l'application **Wakies** — plus aucun
  `Dot`/`OpenDots`, sauf cinq classes CSS qui décrivent un point graphique.

Voix temps réel, ordinateurs persistants (OpenBot), Slack et la carte
« Approuver et enregistrer » ne sont pas encore branchées : leur code est
porté, `lib/wakies/setup.ts` déclare honnêtement l'absence, et `docs/3-wakies/INTEGRATION.md`
§ 6 liste ce qu'il reste.

## 8.3 Intégration Site Officiel (`/site`)

Le site officiel mAI (`apps/site`) est **porté** au sein de l'application hôte
sous `/site`. Guide complet : `docs/5-site/INTEGRATION.md` ; règles dédiées :
`docs/5-site/AGENTS.md`.

Cinq règles à ne pas contourner :

- **`components/site/site.css` est généré** (`scripts/build-site-css.mjs`). Ne
  jamais modifier ce fichier directement.
- **Tout le site vit sous `.site-root`**, préservant le thème sombre et le
  design achromatique du chat mAI principal.
- **Les liens et la navigation passent par `components/site/router.tsx`** :
  `<Link>`, `toSitePath`, `stripSiteBasePath`, `useSiteRouter`.
- **SSO transparent** : l'utilisateur authentifié sur mAI est automatiquement
  authentifié sur `/site` via `AuthProvider` (`initialToken`, `initialUser`).
- **Deux runtimes** : ne jamais importer `@/email` (runtime Deno) dans les
  modules du site, utiliser `@/lib/site/email`.

## 9. Points d'attention historiques

Des pièges déjà payés, à ne pas réintroduire :

- **`loader: null` de Next 16** : tout handler de page doit être `async`.
- **Un cookie de session n'est pas une session.** `getMaiUser`
  (`lib/auth/session.ts`) est l'unique juge : la signature HS256 locale est un
  chemin **rapide**, pas une autorité — un refus local ne clôt rien, l'API qui a
  émis le jeton tranche, et elle est la seule source d'identité dès lors que le
  payload n'est pas vérifié. Rendre le refus local définitif enferme
  l'utilisateur dans l'application (cookie présent → middleware satisfait,
  `getMaiUser` → `null` → ni historique, ni API, ni menu utilisateur, ni
  `/login`). C'est exactement ce qu'un `MAI_JWT_SECRET` local divergent produit
  en dev. Le middleware ne lit que l'`exp` (`lib/auth/token-liveness.ts`), et
  `components/chat/session-recovery.tsx` garantit une sortie visible.
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
