# mAI Web

Plateforme d'IA multi-fonction en français : chat, Agent autonome, bots, Skills,
serveurs MCP, mémoire, projets, recherche, génération d'images et de voix, tâches
planifiées — plus quatre applications portées sous son propre domaine
(`/vibe`, `/wakies`, `/site`, `/blackline`) et une application de révision
(`/quizzly`).

Version : **0.9.3**.

## Deux runtimes, puis des applications à côté

Le point le plus important à comprendre avant de modifier quoi que ce soit :
**le dépôt n'est pas un workspace pnpm** (`pnpm-workspace.yaml` contient
`packages: []`). Chaque dossier de `apps/` s'installe et se compile pour son
compte, avec son propre gestionnaire de paquets.

| Partie | Ce que c'est | Comment elle tourne |
| --- | --- | --- |
| Application Web | Next 16 (App Router), React 19, BFF | `app/`, `components/`, `lib/`, `hooks/` — `pnpm build` |
| API mAI | Backend Hono, ~64 modules racine (`main.ts`, `vibe-*.ts`, `config.ts`…) | Déployé sur Val Town, **hors** du build et du typecheck Next |
| Ordonnanceur | `cron.ts` (val CRON Val Town) | Réveille les quatre ticks `app/api/cron/**` toutes les 5 min |
| Vibe · Wakies · Site · Blackline | Sources autonomes portées dans l'hôte | `apps/vibe/`, `apps/wakies/`, `apps/site/`, `apps/blackline/` |
| Quizzly | Application de révision | `app/(quizzly)/`, `lib/quizzly/` — dans le build Next |
| mAI Coder | Agent de développement Electron | `apps/coder/` (pnpm, install propre) |
| Desktop · Mobile | Conteneurs ouvrant le site | `apps/desktop/` (Electron), `apps/mobile/` (Capacitor) |
| Bibliothèques | `@mdevs/ui`, `@mdevs/icons` | `packages/`, consommés en dépendance `file:` |

`tsconfig.json` exclut `apps/` : modifier une source autonome ne déclenche ni
typecheck ni build racine.

## Démarrer

Prérequis : Node.js **22 ou supérieur** et pnpm **10** (`packageManager:
pnpm@10.32.1`).

```sh
pnpm install
cp .env.example .env.local   # Windows : Copy-Item .env.example .env.local
pnpm db:migrate
pnpm dev
```

L'application est servie sur `http://localhost:3000`. Les variables
indispensables sont `DATABASE_URL`, `MAI_JWT_SECRET`, `MAI_API_URL` (défaut
`https://mai.val.run`) et `MCP_ENCRYPTION_KEY` — sans cette dernière, le coffre
de secrets des intégrations et des serveurs MCP est inutilisable. `.env.example`
fait foi pour la liste complète.

## Commandes racine

| Commande | Action |
| --- | --- |
| `pnpm dev` | `next dev` (via `scripts/dev.mjs`, qui accepte `--host`) |
| `pnpm build` | Valide les news du Site, régénère les quatre feuilles CSS et le jeu, puis `next build` |
| `pnpm check` / `pnpm fix` | Biome via ultracite — il n'y a ni ESLint ni Prettier |
| `pnpm typecheck` | `tsc --noEmit` (l'application Next uniquement) |
| `pnpm test:unit` / `pnpm test` | Vitest / Playwright |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Drizzle |
| `pnpm build:blackline` | Compile le jeu et re-ancre sa feuille vers `public/blackline/` |
| `pnpm dev:coder` / `build:coder` / `desktop:dev` | Délégations vers `apps/` |
| `pnpm plugins:gen` / `plugins:check` | Catalogue des plugins |

## Où lire quoi

- [AGENTS.md](AGENTS.md) — règles transversales, pièges payés, conventions
- [docs/README.md](docs/README.md) — index de toute la documentation
- [docs/1-web/](docs/1-web/README.md) — architecture, Agent, backend, base, sécurité
- [docs/2-vibe/](docs/2-vibe/README.md) · [docs/3-wakies/](docs/3-wakies/README.md) ·
  [docs/5-site/](docs/5-site/README.md) · [docs/6-blackline/](docs/6-blackline/README.md)
- [docs/4-coder/](docs/4-coder/README.md) — mAI Coder
- Intégration continue : [`.github/workflows/build.yml`](.github/workflows/build.yml)

N'exécutez jamais `pnpm fix` à l'aveugle sur un arbre partagé : il réécrit tout
le dépôt, y compris les `*.sql` et les `*.md`.
