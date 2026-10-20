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
| Racine | `app/`, `components/`, `lib/`, `hooks/` | 52 modules du graphe `main.ts` **à la racine du dépôt** |
| Point d'entrée | `app/layout.tsx` | `main.ts` |
| Build | `next build` | Aucun — déployé sur `https://mai.val.run` |
| Base | PostgreSQL (Drizzle) | Neon **et** SQLite (`esm.town/v/std/sqlite`) |
| Auth | `MAI_SESSION_COOKIE` + NextAuth v5 | JWT `jose` + clé API `mai-<tier>-…` |
| Typecheck | Oui (`tsconfig.json`) | **Non** — exclu du `include` |

Conséquences pratiques :

- `main.ts`, `config.ts`, `vibe-*.ts`, `models.ts`, `email.ts`, `realtime.ts`…
  sont **hors du build Next**. Les modifier ne déclenche ni typecheck ni build.
  Ils sont déployés indépendamment sur Val Town.
- L'application Next est un **BFF** : ses routes `app/(chat)/api/**/route.ts`
  appellent le backend via `MAI_API_URL` (`lib/constants.ts`, défaut
  `https://mai.val.run`) et normalisent les erreurs amont avec
  `lib/api/error-response.ts`.
- `cron.ts`, **à la racine hors du graphe de `main.ts`**, est le seul
  ordonnanceur des quatre ticks `app/api/cron/**` (Agent · planning · Wakies ·
  Vibe) : c'est un val CRON Val Town, cadence 5 min, authentifié par
  `CRON_SECRET`, qui les appelle **en parallèle** pour tenir dans le plafond
  d'exécution d'un val. Il remplace le workflow GitHub supprimé : ne
  réintroduire aucun second ordonnanceur.
- **`APP_URL` du val pointe vers l'application Next, jamais vers le backend.**
  Le backend Val Town répond « 404 Not Found » sur **toutes** ses routes : les
  ticks y sont muets, et le journal ne dit pas pourquoi. Le val refuse de
  partir vers un hôte `*.val.run` et interroge `/api/app-version` — route
  présente dans tous les déploiements, sans effet de bord — avant de lancer les
  ticks. Un 404 sur un tick signifie « cette route n'existe pas sur cette
  cible » (déploiement trop ancien, ou `APP_URL` erroné), jamais « la route a
  échoué ».
- Le détail du backend est documenté dans **`docs/1-web/BACKEND_API.md`** (les 52
  fichiers du graphe d'imports transitif de `main.ts`).
- Le détail de l'Agent est dans **`docs/1-web/AGENT_ENGINE.md`**.
- Les connexions OAuth aux applications externes (Google, GitHub), leurs
  portées, leurs jetons et l'ajout d'un connecteur sont dans
  **`docs/1-web/INTEGRATIONS.md`**.
- L'API publique pour agents externes est dans **`docs/1-web/AI_AGENTS_API.md`**.
- Les règles spécifiques par domaine sont réparties dans **`docs/1-web/AGENTS.md`**,
  **`docs/2-vibe/AGENTS.md`**, **`docs/3-wakies/AGENTS.md`**, **`docs/4-coder/AGENTS.md`**
  et **`docs/5-site/AGENTS.md`**.


## 2. Stack

| Domaine | Choix |
|---|---|
| Framework | Next **16.3.8** (App Router, `cacheComponents`, `reactCompiler`), React 19.3 |
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
│   ├── api/                Routes BFF et API locales
│   ├── agents/ archived/ audio/ chat/[id]/ images/ library/
│   ├── mcp/ planning/ projects/ skills/ tools/
│   ├── settings/           page.tsx + agent/page.tsx
│   └── vibe/               app sociale portée sous /vibe (pages générées)
├── api/cron/               ticks Agent et planification
├── globals.css             ← design system (tokens + primitives)
└── layout.tsx              polices, ThemeProvider, Toaster
components/
├── agent/ agents/ ai-elements/ chat/ common/ onboarding/ planning/ settings/ tools/
├── vibe/                   Vibe portée (vibe.css généré) + router.tsx
│   └── stories/            rail, anneau, lecteur et compositeur de stories
└── ui/                     primitives Radix (exclus du lint)
lib/
├── agent/ ai/ auth/ chat/ commands/ db/ editor/ integrations/ mcp/ plans/ plugins/
├── projects/ prompts/ security/ skill-templates/ notifications/
├── vibe/                   services, hooks et contextes de Vibe (api, theme)
├── wakies/                 données, quotas et utilitaires de /wakies
└── constants.ts errors.ts ratelimit.ts types.ts utils.ts
hooks/                      dont use-tier, use-notifications
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

Vocabulaire canonique : `free | plus | pro | max`, rang 0→3.
`normalizeTierKey` (dans `lib/plans/tier-limits.ts`, **pas** dans `plan.ts`) mappe
l'alias backend `gratuit` → `free`, et **retombe sur `free`** pour toute valeur
inconnue — fail-safe obligatoire : un tier illisible ne doit jamais accorder de
privilège. `lib/auth/plan.ts` expose le vocabulaire et les gardes de comparaison
(`isPaidTier`, `tierAtLeast`, `tierMeetsMinimum`) ; `tierAtLeast` est typé
`PaidTier` et **ne peut pas** exprimer un seuil « free » — pour autoriser tous les
forfaits en exigeant la connexion, utiliser `requireAuthenticatedTier()`
(`lib/auth/plan-guard.ts`).

| Source de vérité | Fichier |
|---|---|
| Vocabulaire, rangs, gardes | `lib/auth/plan.ts` |
| Quotas et plafonds (Next) | `lib/plans/tier-limits.ts` |
| Durées de run Agent, timeouts techniques | `lib/plans/tier-capabilities.ts` |
| Miroir backend | `config.ts` (Val Town) |
| Limites appliquées à Vibe côté client | `lib/vibe/services/tierLimits.ts` |

`lib/plans/tier-limits.ts` est le **point d'entrée** de toute limite produit.
Les constantes de quotas y sont ajoutées **avec** leurs getters, et le client
ne recalcule jamais : il lit ce que le serveur applique.

### 5.1 Ce qui est payant, ce qui est borné

Deux régimes différents, à ne pas confondre : une **interdiction** (paywall) ou un
**quota** (tous les forfaits y ont droit, à des degrés divers).

| Fonctionnalité | Free | Régime |
|---|---|---|
| **Bots** (`/agents`, `app/(chat)/api/agents/**`) | 8 bots | quota — ouvert à tous les forfaits |
| **Mode Agent** du chat (`lib/agent/gate.ts`) | refusé | paywall |
| **Wakies** (`isWakiesEligible`) | refusé | paywall |
| **Commandes personnalisées** (`app/(chat)/api/commands/**`) | refusé | paywall |
| **Stories Vibe** (`vibe-stories.ts`) | 1 par jour | quota |

La limite de bots est portée par `TIER_LIMITS.free.agents` et appliquée par
`getTierAgentLimit` : aucun nombre ne doit être écrit en dur dans une route, et le
miroir backend n'existe pas pour cette grandeur (les bots vivent dans la base
Next). Les trois derniers points sont verrouillés par
`tests/unit/agents-quota-models.test.ts`.

### 5.2 Deux plafonds média distincts

Ils sont différents **en direction contraire**, et un agent qui les « unifie »
casse l'un des deux contrats :

| Plafond | Valeur | Autorité |
|---|---|---|
| Envoi d'un média (`POST /v1/upload-file`, posts, bannières) | 50 Mo en Free, **1 Go** en Plus/Pro/Max | `MEDIA_UPLOAD_LIMITS_BYTES` (`config.ts`), appliqué par `handleUploadFile` |
| Média d'une **story** (photo ou vidéo) | **50 Mo, tous forfaits** | `STORY_MEDIA_MAX_BYTES` (`vibe-stories.ts`), recontrôlé serveur par un `HEAD` sur l'objet |

Puisque l'upload accepte 1 Go pour les payants, le passage par `upload-file` ne
garantit plus la borne de la story : `POST /v1/stories` relit donc la taille réelle
de l'objet (`file_size_bytes` envoyé par le navigateur étant falsifiable).

### 5.3 Le coffre de secrets est une variable d'environnement, pas une option

`MCP_ENCRYPTION_KEY` chiffre **trois** choses : les jetons des intégrations
externes (Google, GitHub), l'« état » OAuth scellé — qui porte l'identité du
compte qui se connecte — et les secrets des serveurs MCP. Elle est lue par
`lib/mcp/encryption.ts` et **aucun repli n'existe** : une clé dérivée de
`DATABASE_URL` serait devinable par quiconque connaît l'URL de la base.

| Symptôme | Cause |
|---|---|
| « Le coffre de secrets n'est pas configuré sur cette instance » | `MCP_ENCRYPTION_KEY` absente de l'environnement |
| « Service Unavailable. API Key missing. » | requête sans `Authorization` vers une route privée du backend |

Le premier est un **problème de déploiement**, pas de code : la variable doit
être posée dans le **même environnement Vercel** que l'application Next — les
seules `*_CLIENT_ID` ne suffisent pas. `GET /api/integration` expose
`vaultConfigured` par connecteur, et la fiche du plugin affiche un encart
explicite au lieu d'un échec opaque au clic.

Conséquence d'une rotation : les jetons déjà chiffrés deviennent **illisibles**.
Les lignes `IntegrationConnection` survivent (l'interface affiche encore
« Connecté »), mais le porteur est muet — l'utilisateur doit reconnecter.

## 6. Base de données

- Schéma : `lib/db/schema.ts` (un seul fichier, lu par `drizzle-kit`)
- Requêtes : `lib/db/queries.ts` et les `lib/agent/*-queries.ts`
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
- **Le runner épingle son schéma** (`lib/db/working-schema.ts`) : le
  `search_path` est un paramètre de **connexion**, pas une propriété de la
  base. Une URL qui transporte `options=-c search_path=`, un rôle configuré
  ainsi, ou un relais qui le réinitialise laisse la session sans schéma : les
  CREATE non qualifiés échouent alors en `3F000` et les ALTER en `42P01` —
  y compris sur des tables qui existent. Le runner détermine donc le schéma
  qui porte les tables de l'application, l'y épingle, le **vérifie**, et
  journalise le `search_path` reçu. Ne jamais écrire une migration qui dépend
  du `search_path` de la session.
- **Un `SELECT` dans un catalogue se trompe de colonne sans bruit** :
  `pg_constraint` n'a pas de `table_name` (c'est
  `information_schema.table_constraints` qui la porte). Interroger
  `pg_constraint` avec `table_name` échoue en `42703` et fait échouer **toute
  la transaction** de migration : les migrations suivantes ne sont pas
  appliquées et le journal n'avance pas. Le nom de la table vient de
  `pg_class`, joint par `conrelid`.
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

### 7.1 Notifications : une table, trois applications

La table `Notification` (Postgres hôte) est l'**unique source de vérité** de
l'état lu/non lu. Les notifications de mAI, de Vibe et de Wakies y vivent ensemble, distinguées
par `origin` (`mai` | `vibe` | `wakies`).

| Règle | Conséquence |
|---|---|
| `origin` déduit du `type` | `lib/notifications/types.ts` fait autorité ; la base, le schéma Drizzle et la liste TypeScript doivent être **alignés** |
| La réplication est **idempotente** | Index unique partiel `(origin, sourceId)` ; un rejeu de tick ne duplique rien |
| Le tick est le seul réplicateur | `app/api/cron/notifications`, appelé par `cron.ts` — **ne pas créer un second ordonnanceur** |
| Le tick ne lit que les sources | Vibe et Wakies sont lus en lecture seule ; l'écriture va dans la table de l'hôte |
| Le « lu » se **propage** à la source | Marquer lu dans la cloche mAI écrit aussi dans Vibe / Wakies, sinon la page d'origine afficherait encore le point non lu |
| Le gate `enabled` ne s'applique qu'à `origin = "mai"` | Une notification Vibe a déjà été décidée par sa source ; la rejuger la ferait disparaître |
| Le pont d'identité Vibe est l'**email** | L'hôte identifie par une chaîne, Vibe par un entier : aucun identifiant commun |

Les préférences de notification sont **un seul écran** (onglet Notifications des
paramètres), groupé par application. Chaque groupe reste le seul endroit où sa
décision est prise : mAI → `user_notification_prefs`, Vibe → `user_settings`
(backend), Wakies → `WakiesSettings`. Les trois enregistrements sont
indépendants : un échec Vibe ne bloque pas mAI.

Le haptique et les animations Vibe **restent** dans les paramètres Vibe : ce sont
des réglages d'**appareil**, pas de compte.

### 7.2 mAI Search : les préférences font autorité

Les réglages de recherche (langue, nombre de résultats, sources activées,
filtre de sécurité) vivent sur `user_preferences` et sont **appliqués par le
serveur** : `POST /api/mai-search` lit les préférences du compte et impose
sources, langue, volume et filtre. Le client propose, le serveur tranche — un
appel direct ne peut pas élargir le périmètre.

La préférence des sources est un **plafond**, pas une liste figée : le client
peut **rétrécir** le périmètre (c'est ce qui rend les onglets « Actualités » et
« Images » possibles) mais jamais l'élargir. L'intersection est faite par
`resolveSources` (`app/(chat)/api/mai-search/route.ts`), qui est **testée**.

Le vocabulaire des sources est dans `lib/search/sources.ts` (client-safe) :
**ne pas le confondre** avec `lib/search/types.ts`, qui porte l'index de
recherche interne (16 clés : `chat`, `message`, `skill`…).

Wikipédia est une **source à part entière** (`lib/search/wikipedia.ts`), pas
seulement un repli : ses articles portent `origin: "wikipedia"` et sont
distingués par un badge. Le repli automatique en cas d'échec de You.com est
**conservé** en plus.

Trois règles de rapidité, à ne pas réintroduire :

- **Les clés du moteur sont essayées EN PARALLÈLE** (`raceFirst`,
  `lib/search/you-client.ts`). Elles l'étaient en séquence : trois clés ×
  trois points d'entrée, c'était jusqu'à 36 s d'attente pour un résultat
  disponible sur la clé suivante.
- **Les replis partent EN MÊME TEMPS** que les sources principales. Les
  replis n'étaient pas des replis mais des *étapes* : chaque source lente
  s'additionnait au délai total.
- **Le nombre de résultats est borné PAR SOURCE**, pas au total : borner le
  total vidait l'onglet « Actualités » dès que l'onglet « Web » était plein.

L'analyse d'une saisie (longueur minimale, jetons, détection d'adresse) est
dans `lib/search/query.ts` — pur, client-safe, **testé**. Le serveur et
l'interface l'utilisent tous les deux : deux implémentations divergeraient.

Le modèle de la synthèse est **validé** contre le catalogue et le forfait du
compte (`app/(chat)/api/mai-search/summary/route.ts`), comme le fait le mode
Agent. Un `modelId` arbitraire venu du client ne doit jamais être exécuté.

L'historique des recherches est **écrit** à chaque recherche
(`MaiSearchQuery`) et se lit par `GET /api/mai-search/recent`. Il est filtré
par compte côté serveur : la ligne d'un autre compte ne matche jamais.

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
node scripts/build-blackline.mjs     # compile le jeu vers public/blackline/
node scripts/build-blackline-css.mjs # régénère components/blackline/blackline.css
```

> ⚠️ `pnpm fix` formate **tout** le dépôt, y compris `*.sql` et `*.md`. En cas
> de travail parallèle dans l'arbre, préférer :
> `node node_modules/@biomejs/biome/bin/biome check --write <fichiers>`

## 8.1 Intégration Vibe (`/vibe`)

Vibe, l'application sociale, est **portée** depuis `apps/vibe/` (app Vite
conservée en référence, non compilée par Next) sous `/vibe`. Guide complet :
`docs/2-vibe/INTEGRATION.md` ; portage des composants : `components/vibe/README.md`.
Règles dédiées pour agents : `docs/2-vibe/AGENTS.md`. Fonctionnalité à règles
propres : les **Stories** (`docs/2-vibe/STORIES.md`) — cycle de 24 h, archive,
quota journalier par forfait, et deux plafonds média qui ne doivent pas être
unifiés.

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
- **Données** : les deux SQLite du gabarit deviennent les tables
  `Wakies*` (migration `0037_wakies.sql`, puis migrations des fonctions sociales). Toute ligne porte `userId`, et
  `lib/wakies/queries.ts` l'exige en premier paramètre : une fonction sans
  `userId` n'a pas d'existence.
- **IA** : le chat passe par `/api/wakies/chat` (pipeline de l'hôte), plus par
  CopilotKit Intelligence. Les messages sont des `UIMessage` stockés dans
  `WakiesMessage`, et un message Wakie consomme le quota hebdomadaire du compte
  — il n'existe pas de quota séparé.
- **Web** : l'outil `webSearch` de l'hôte, donc `/v1/web/search`.
- **Tâches planifiées** : plus de `setInterval` ; tick par
  `app/api/cron/wakies`, appelé toutes les 5 min par le val CRON Val Town
  `cron.ts` (`CRON_SECRET`), bail transactionnel.

Cinq règles à ne pas contourner :

- **Tout Wakies vit sous `.wakies-root`**, et `/wakies` vit dans son PROPRE
  groupe de routes (`app/(wakies)/wakies`) : son rail est en `position: fixed`,
  et le layout `(chat)` lui superposerait une seconde navigation.
- **`components/wakies/wakies.css` et `wakies-editor.css` sont générés**
  (`scripts/build-wakies-css.mjs`). Corriger la source dans
  `apps/wakies/integration/web/`, jamais la sortie.
- **Pas de variante `dark:` Tailwind (pas de Tailwind ici)** : Wakies a son propre design system clair natif. Le mode sombre suit l'hôte via `components/wakies/ThemeProvider.tsx` (`resolvedTheme` de next-themes) et la couche `html.dark .wakies-root …` de `wakies-host.css` ; les feuilles générées restent claires natives. Ne jamais introduire d'état de thème parallèle.
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

## 8.4 Intégration Blackline (`/blackline`)

Blackline (`apps/blackline`) est un FPS 3D Three.js **monté** par l'hôte sous
`/blackline` — ce n'est ni un portage React, ni un iframe, ni une application
de bureau. Guide complet : `docs/6-blackline/INTEGRATION.md` ; règles
dédiées : `docs/6-blackline/AGENTS.md`.

Cinq règles à ne pas contourner :

- **`components/blackline/blackline.css` est généré**
  (`scripts/build-blackline-css.mjs`). Ne jamais modifier ce fichier
  directement.
- **Tout Blackline vit sous `.blackline-root`**, élément posé par
  `app/(chat)/blackline/layout.tsx`. Le jeu est écrit pour posséder le
  document : sa feuille déclarait `:root`, `html` et `body`, et ses
  composants étaient sur des sélecteurs nus.
- **Le jeu ne touche jamais `<html>`** : ses classes et ses variables CSS
  passent par `apps/blackline/src/root.ts`, qui pointe sur la racine du jeu.
- **L'âge n'est jamais persisté** : la confirmation PEGI 16 est demandée à
  chaque lancement et vit dans l'état du composant. Ni base, ni
  `localStorage`, ni cookie.
- **La progression reste locale** : seuls les *réglages* sont partagés par
  compte (`BlacklineSettings`, migration 0064). Blackline a volontairement
  retiré la synchronisation en ligne.

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

## 10. Messagerie Wakies et inventaires

Les règles locales sont aussi dans `components/wakies/AGENTS.md`, `lib/wakies/AGENTS.md` et `app/(chat)/api/wakies/AGENTS.md`. Le dossier `.agents` est absent de cette version du dépôt.

- Les amis sont des agents publics suivis ; un clone privé est nécessaire pour discuter. Aucun échange entre utilisateurs humains n’est ajouté.
- Favoris et sourdine sont persistés en base (migration 0049). Les alertes de réponses terminées et la clé des réactions humaines demandent la migration 0050.
- SWR relève la messagerie à cinq secondes ; aucune synchronisation ne remplace un streaming actif ou un brouillon. Les notifications navigateur ne fonctionnent que lorsque l’application reste ouverte.
- Le catalogue MCP GitHub et son modèle de skill dédié sont retirés. Le plugin `github-public` (lecture de dépôts publics avec une clé globale) est retiré à son tour et remplacé par le connecteur OAuth `github`, qui lit les dépôts du compte connecté et peut y écrire avec approbation. Les serveurs MCP déjà enregistrés et les usages Git de Coder restent disponibles.
- `node scripts/audit-backend.mjs` régénère l’inventaire des 52 modules backend et des routes Next ; ces dernières ne sont pas toutes des proxys.
- Le nettoyage des services autonomes OpenMuse est tracé dans `docs/CLEANUP_INVENTORY.json`. Les images, la licence, les sources CSS et les références mobiles localement adaptées restent protégées ; le contrôle de provenance distingue les sources conservées des retraits.

### 10.1 La recherche Wakies est côté serveur

La recherche du rail est **une requête**, pas une reconstruction côté navigateur.

- `GET /api/wakies/search?q=` renvoie la recherche **unifiée** : conversations,
  messages, pages, Espaces, Wakies, mémoires et tâches. Elle est implémentée
  dans `lib/wakies/queries/search.ts` et lue en **parallèle** : le délai est
  celui de la source la plus lente, pas leur somme.
- `GET /api/wakies/search?q=&messages=1` renvoie l’**historique seul**, au
  format historique `{ conversations, messages }`. Ce contrat a ses appelants :
  il est conservé, mais son filtre des messages passe désormais **en base**.
- `?q=&messages=1` **sans le paramètre** ne renvoie PAS l’historique : les
  deux contrats sont distincts et ne doivent pas se recouvrir.

Trois erreurs à ne pas réintroduire :

- **Le filtre des messages se fait en SQL**, sur `parts::text`. Il se faisait
  en JavaScript, sur un aperçu tronqué : « I love » ne trouvait pas
  « I love this », et l’historique au-delà des cent derniers messages d’un
  fil était invisible alors qu’il existait.
- **La borne porte sur les RÉSULTATS**, pas sur les lignes candidates. C’est
  la différence entre une recherche qui balaie un historique et une recherche
  qui le parcourt.
- **Le rail n’a plus de requête par Espace.** Le rail affichait les pages en
  appelant `/spaces/<id>/pages` pour chaque Espace, à chaque frappe : huit
  Espaces, huit requêtes pour un mot tapé. Le coût ne dépend plus du nombre
  d’Espaces du compte.

Les fils de groupe sont exclus de la recherche : ils sont retirés du produit,
et les chercher afficherait des conversations fantômes, absentes du rail.


