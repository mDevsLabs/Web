# Directives & Règles pour Agents IA — mAI Web (`1-web`)

Ce document contient les règles fondamentales et les consignes d'architecture à respecter impérativement lors du développement sur l'application principale **mAI Web** (`app/`, `components/`, `lib/`, `hooks/`).

---

## 1. Architecture du double runtime

Le dépôt abrite deux mondes qui partagent le `package.json` mais ont des runtimes distincts:
- **L'application Next.js 16** (BFF sous `app/`, `components/`, `lib/`, `hooks/`):
  - Compilée par `next build`.
  - Typecheckée strictement par `tsconfig.json`.
  - Se connecte à PostgreSQL (Neon) via Drizzle ORM.
- **Le backend Hono** (modules TS à la racine du dépôt: `main.ts`, `config.ts`, `models.ts`… — l'inventaire fait foi, voir §7):
  - Déployé indépendamment sur Val Town (`https://mai.val.run`).
  - Hors du build Next et hors du `tsconfig.json`.

> [!IMPORTANT]
> Les routes proxys sous `app/(chat)/api/**/route.ts` forment le **BFF**: elles appellent le backend distant via `MAI_API_URL` (défaut: `https://mai.val.run`) et normalisent les erreurs amont avec `lib/api/error-response.ts`. Certaines routes sont locales, notamment Wakies, et lisent PostgreSQL directement.

---

## 2. Stack technique & Conventions

| Composant | Technologie retenue | Règles impératives |
|---|---|---|
| **Framework** | Next **16.3.8** (App Router, React 19.3) | `params` et `searchParams` sont des **Promises** (`await params`). Tout handler de page doit être `async`. |
| **Interception** | `proxy.ts` | **Pas** de `middleware.ts` (renommé en `proxy.ts` sous Next 16). |
| **Styles** | Tailwind CSS **v4 CSS-first** | **Aucun** `tailwind.config.js`. Variables CSS dans `:root` et `.dark`, exposées via `@theme inline` dans `app/globals.css`. |
| **Design** | Système achromatique | Seuls 4 accents autorisés: `text-success`, `bg-warning/10`, `ring-info/20`, `text-destructive`. **Jamais** de couleurs arbitraires (`emerald-500`, `amber-600`...). |
| **Primitives** | `@utility` dans `globals.css` | Utiliser `surface-card`, `surface-muted`, `chip` (état actif via `data-active`), `field-input`. |
| **Base de données**| Drizzle ORM + PostgreSQL (Neon) | Schéma unique `lib/db/schema.ts`. Migrations strictes et idempotentes dans `lib/db/migrations/`. |
| **Lint / Format** | **Biome** (via `ultracite`) | **Ni ESLint ni Prettier**. Ne pas toucher aux dossiers exclus (`components/ui`, `components/vibe/vibe.css`...). |
| **Tests** | Vitest (unit) + Playwright (e2e) | `pnpm test:unit` doit passer avant toute finalisation. |

---

## 3. Base de données & Migrations

- **Zéro DDL au runtime**: `DB_RUNTIME_DDL_REPAIR="false"` par défaut. Toute colonne ajoutée à `lib/db/schema.ts` exige impérativement une migration SQL.
- **Règle du commit atomique**: Un nouveau fichier `lib/db/migrations/NNNN_nom.sql` doit **toujours** être accompagné de sa mise à jour dans `lib/db/migrations/meta/_journal.json` dans le même commit.
- **Idempotence obligatoire**: Toujours utiliser `IF NOT EXISTS`, `IF EXISTS`, `ON CONFLICT DO NOTHING`.
- **Pas de `DROP COLUMN`**: Les migrations sont additives uniquement.

---

## 4. Session & Authentification

- **Le cookie n'est pas la session**: `getMaiUser` (`lib/auth/session.ts`) est la seule autorité. La signature HS256 locale est un chemin rapide de validation; en cas de refus local, l’API émettrice tranche. Le proxy ne contrôle que l’expiration via `lib/auth/token-liveness.ts`.
- **Secret et repli**: une divergence de `MAI_JWT_SECRET` déclenche une validation distante; elle ne doit jamais rendre définitif le refus local ni verrouiller la reconnexion.

---

## 5. Forfaits et Quotas

Règles complètes et tableau des forfaits: **AGENTS.md §5** (racine). Ce qui est
spécifique au domaine `1-web`:

- Quatre forfaits canoniques: `free` (0) < `plus` (1) < `pro` (2) < `max` (3). Le vocabulaire et les gardes de comparaison vivent dans `lib/auth/plan.ts`.
- Un tier inconnu retombe toujours par sécurité sur `free`. Le mapper est `normalizeTierKey`, qui vit dans **`lib/plans/tier-limits.ts`** et non dans `plan.ts`.
- Les quotas sont décidés par le serveur (`lib/plans/tier-limits.ts`, et `config.ts` côté Val Town). L'interface ne fait que refléter les limites renvoyées par l'API.
- **Deux régimes distincts, à ne pas confondre**:
  - **Paywall** (interdiction au Free): mode Agent du chat (`lib/agent/gate.ts`), Wakies (`isWakiesEligible`), commandes personnalisées (`app/(chat)/api/commands/**`).
  - **Quota** (ouvert à tous, borné par forfait): **bots** `/agents` — 8 en Free, 15 Plus, 25 Pro, illimité Max.
- « Espace Agent» est une expression ambiguë: elle désignait à la fois le mode Agent du chat et la page des bots. Écrire le nom de la route ou du module, jamais l'expression.
- Pour une fonction ouverte à tous les forfaits mais bornée par quota, la garde est `requireAuthenticatedTier()` (`lib/auth/plan-guard.ts`): `tierAtLeast` est typé `PaidTier` et ne peut pas exprimer un seuil « free».

---

## 6. Commandes usuelles

```bash
pnpm dev # Démarre le serveur Next.js en développement
pnpm build # Lance la compilation de production Next.js
pnpm check # Vérification de lint et formatage (Biome / ultracite)
pnpm typecheck # Vérification des types TypeScript (tsc --noEmit)
pnpm test:unit # Exécution des tests unitaires Vitest
pnpm db:generate # Génère les fichiers de migration Drizzle
pnpm db:migrate # Applique les migrations en base
```

## 7. Inventaire du backend

Lire [BACKEND_AUDIT.md](BACKEND_AUDIT.md). Régénérer `API_INVENTORY.json` avec `node scripts/audit-backend.mjs` après toute évolution de routes ou imports. Les handlers Hono restent hors du typecheck Next; ne pas assimiler un build Next réussi à une validation de Val Town. Les copies CLI de `scripts/` ont leurs propres imports et ne se suppriment pas sur la seule base du graphe `main.ts`.
