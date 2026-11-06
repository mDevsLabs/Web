# Blackline

FPS solo en TypeScript et Three.js (WebGL2, géométries et textures procédurales,
post-traitement à bloom). Quatre modes — match à mort par équipe, domination,
point à tenir, survie — sur quatre arènes, avec huit familles d'armes, vue
première ou troisième personne au choix, et progression stockée sur l'appareil.

Le jeu est **léger** : aucun service payant, aucun token d'IA, aucun compte
obligatoire. Les handlers de `api/` répondent tous **410** depuis le retrait de
la synchronisation en ligne.

## Deux formes, un seul moteur

| Forme | Comment il tourne |
| --- | --- |
| Autonome | Build Vite servant `index.html`, dans `dist/` ou sur un hébergement statique |
| Intégré à mAI | Artefact statique monté par l'hôte sous `/blackline` |

Le point de montage unique est `src/entry.ts` (`mountBlackline`). Il est exposé
par `src/mount.ts` sous forme d'**objet posé sur `window`** — jamais d'export
nommé, que Rollup renommerait ou élague :

```ts
window.blackline.mount({ container, root, settings });
window.blackline.unmount();
```

Le moteur reste **paresseux** : `import('./game.ts')` est dynamique et
`scripts/check-bundle.mjs` échoue si le moteur est préchargé avec l'interface.

## Démarrer

`apps/blackline` n'est pas membre du workspace pnpm racine : il a son propre
`package-lock.json`. Node.js **24** (`engines: >=24 <25`, alors que le dépôt vise
`>=22`).

```sh
cd apps/blackline
npm ci
npm run dev
```

La CI, elle, installe depuis la racine avec `npm ci --prefix apps/blackline`.

## Commandes

| Commande (depuis ce dossier) | Action |
| --- | --- |
| `npm run dev` / `preview` | Serveur Vite sur `0.0.0.0` |
| `npm run build` | Bundle vers `dist/` |
| `npm run typecheck` | `tsc --noEmit` (le `tsconfig` n'inclut que `src`) |
| `npm test` | Tests du moteur avec le runner Node, pas Vitest (pas de GPU) |
| `npm run check:bundle` | Nombre de chunks, taille maximale, absence de secret, contrat `window.blackline` |
| `npm run export` | Archive ZIP du projet |

## Intégration dans mAI Web

- **Artéfact non versionné** : `public/blackline/` est ignoré par Git. Avant de
  tester `/blackline` en local, lancer `pnpm run build:blackline` à la racine
  (build du jeu **puis** re-ancrage de la feuille).
- **`.blackline-root`** : le jeu écrivait pour posséder le document (`:root`,
  `html`, `body`, sélecteurs nus). `scripts/build-blackline-css.mjs` ré-ancre
  chaque sélecteur, convertit `position: fixed` en `absolute` et préfixe les
  `@keyframes`. `components/blackline/blackline.css` est **généré**.
- **Le jeu ne touche jamais `<html>`** : classes d'état et variables CSS passent
  par `src/root.ts`. Un `document.documentElement` dans le jeu est une régression.
- **Démontage obligatoire** : `Game.dispose()` arrête la boucle et lâche le
  contexte WebGL (`forceContextLoss`). Sans `unmount`, le navigateur refuse
  d'ouvrir un contexte suivant et le moteur tourne dans le vide.
- **Âge** : PEGI 16, redemandé à chaque lancement, **jamais** persisté.
- **Progression locale**, réglages seuls partagés par compte (`BlacklineSettings`) ;
  le serveur normalise, l'interface ne recalcule rien.

Contrats et règles détaillés : [`docs/6-blackline/`](../../docs/6-blackline/README.md)
et les tests hôte `tests/unit/blackline-*.test.ts`.
