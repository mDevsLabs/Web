# Blackline (`6-blackline`)

Blackline est un FPS 3D solo (Three.js, WebGL2) intégré à mAI Web sous
`/blackline`. C'est une application **légère** : pas de compte obligatoire, pas
de service payant, aucun token d'IA consommé, pas de synchronisation de
progression. Elle occupe le temps d'attente.

| Document | Contenu |
| --- | --- |
| [INTEGRATION.md](INTEGRATION.md) | Architecture, montage, feuille de style, réglages, build |
| [AGENTS.md](AGENTS.md) | Règles impératives pour agents et contributeurs |

La source autonome du jeu est dans
[`apps/blackline/`](../../apps/blackline/README.md).

## En une phrase

Le jeu est un artefact statique produit par Vite, monté par l'hôte dans une page
`/blackline` sous `.blackline-root`, dont les réglages seuls sont partagés par
compte, et dont l'accès est conditionné à une confirmation d'âge PEGI 16
redemandée à chaque lancement et jamais persistée.

## Les quatre invariants

1. **`components/blackline/blackline.css` est généré**
   (`node scripts/build-blackline-css.mjs`) : ré-ancrage sous `.blackline-root`,
   `position: fixed` → `absolute`, `@keyframes` préfixés.
2. **Le jeu ne touche jamais `<html>`** : classes d'état et variables CSS passent
   par `apps/blackline/src/root.ts`.
3. **Le contrat d'intégration est un objet sur `window`**
   (`window.blackline.mount()` / `.unmount()`) — jamais un export nommé, que
   Rollup renommerait ou élaguerait.
4. **Le moteur se démonte** : `Game.dispose()` arrête la boucle et lâche le
   contexte WebGL ; sans quoi il tourne dans le vide et le navigateur refuse un
   contexte suivant.

`public/blackline/` est un artefact **non versionné** : `/blackline` ne fonctionne
en local qu'après `pnpm run build:blackline`.
