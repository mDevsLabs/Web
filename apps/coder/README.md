# mAI Coder

Application desktop de développement, centrée sur un agent : éditeur Monaco,
explorateur de projet, Git, terminal PTY, outils MCP, navigateur et plusieurs
fournisseurs de modèles. Elle est conçue pour que l'utilisateur examine et
contrôle chaque action de l'agent.

## Deux processus, une frontière

| | Renderer | Main |
| --- | --- | --- |
| Source | `src/` | `main-src/` |
| Rôle | Application React 19 et Monaco | Electron, système de fichiers, Git, PTY, SQLite, MCP, bots, navigateur, LSP |
| Sortie | Vite → `dist/` | `esbuild.main.mjs` → `electron/main.bundle.cjs` |

Le pont est `electron/preload.cjs` : un `contextBridge` et une liste d'autorisation
de canaux IPC. **Ne jamais** importer `fs`, `child_process`, `node-pty` ou
`better-sqlite3` dans `src/`. Une nouvelle capacité système est un handler Main
plus une entrée dans le contrat du preload — pas un import de plus dans le
Renderer.

## Démarrer

`apps/coder` n'est **pas** un membre du workspace pnpm racine (`pnpm-workspace.yaml`
du dépôt est vide) : il a son propre `pnpm-workspace.yaml` et son propre lockfile.
Prérequis : Node.js 22 ou supérieur et pnpm 10.

```sh
pnpm install
pnpm run dev
```

Depuis la racine du dépôt : `pnpm dev:coder` et `pnpm build:coder` délèguent ici
avec `pnpm --dir apps/coder`.

## Commandes

| Commande | Action |
| --- | --- |
| `pnpm run dev` | Renderer sur Vite et fenêtre Electron en développement |
| `pnpm run build` | Synchronise l'équipe intégrée, puis compile Main et Renderer |
| `pnpm run build:main` / `build:renderer` | Une seule des deux parties |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm test` | Tests Vitest (fourches, `jsdom` pour `src/**`) |
| `pnpm run release:win` / `release:mac` / `release:linux` | Installateurs par plateforme |

Types, tests et bundles sont vérifiés par le job `coder-check` de
[`.github/workflows/build.yml`](../../.github/workflows/build.yml).

## Relation avec la plateforme mAI

Coder joint le même backend Hono que l'hôte : `main-src/maiApiBase.ts` résout
`MAI_API_BASE`, puis `MAI_API_URL`, puis `https://mai.val.run`. Les bibliothèques
`@mdevs/ui` et `@mdevs/icons` viennent en dépendance `file:` de `packages/`.

Sous `/coder` du site mAI, la page est un point de **téléchargement** : elle
dirige vers les publications du dépôt et annonce ce que l'application desktop
apporte en plus. Réciproquement, `apps/desktop` peut embarquer Coder.

Les clés de fournisseurs se règlent **dans l'application** et restent locales.
Ne les ajoutez ni au dépôt, ni aux journaux, ni à une variable d'environnement
partagée.

## Pièges connus

- `vite.config.ts` fixe `css.postcss: { plugins: [] }` volontairement : hériter
  la configuration Tailwind du dépôt racine casse la compilation.
- Le port 5173 est en `strictPort`, avec un libérateur de port dédié.
- `pnpm run build` appelle `sync:builtin-team`, qui lit un dépôt externe ; sans
  lui, l'équipe intégrée reste celle déjà présente dans `resources/`.

## Documentation

- [Guides mAI Coder](../../docs/4-coder/README.md) — architecture, agent, build desktop, intégrations
- [Règles pour agents et contributeurs](../../docs/4-coder/AGENTS.md)
- [Wiki technique des modules](../../docs/4-coder/llm-wiki/README.md)
- Licence : [Apache 2.0](LICENSE)

Les versions citées dans `docs/4-coder/` peuvent diverger de `package.json` : en
cas d'écart, **`package.json` et le code font foi**.
