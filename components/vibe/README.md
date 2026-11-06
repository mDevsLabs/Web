# Port Vibe dans mAI Web

Ce dossier est l'application Vibe **telle qu'elle tourne** sous `/vibe`, adaptée
à l'hôte Next.js. La source autonome est dans
[`apps/vibe/`](../../apps/vibe/README.md) ; les règles et l'architecture du port
sont dans [`docs/2-vibe/`](../../docs/2-vibe/README.md).

## Sources et sorties générées

| Fichier | Nature | Ce qu'on corrige |
| --- | --- | --- |
| `vibe.css` | **généré** | `apps/vibe/src/index.css`, puis `node scripts/build-vibe-css.mjs` |
| `app/(chat)/vibe/**/page.tsx` | **généré** | table `ROUTES` de `scripts/build-vibe-routes.mjs` |
| `pages/vibe-routes.tsx` | source éditable | les adaptateurs entre la navigation par props de Vibe et le routeur de l'hôte |

Le générateur CSS ré-ancre l'AST PostCSS : `:root`, `html` et `body` deviennent
`.vibe-root`, `html.light|dark` deviennent `.vibe-root.light|.dark`,
`[data-theme] X` devient `.vibe-root[data-theme] X`, les `@import "tailwindcss"`,
`@theme` et `@custom-variant` sont retirés, `overflow-x: hidden` devient `clip` et
`--font-*` devient `--vibe-font-*`. Le script **sort en erreur** si un sélecteur
échappe à la racine — il ne publie pas une feuille partielle.

La table `ROUTES` est **ordonnée** et l'ordre fait foi : `books/join/[code]` doit
précéder `books/[bookId]`, sinon la première route est capturée par la seconde. Sa
clé `cle` déclenche la graine d'hydratation (`getVibeHydration()`) transitée par
`vibe-routes.tsx` en prop `hydration`.

## Contrats du port

- **Thème sous `.vibe-root`.** `lib/vibe/context/ThemeContext.tsx` pose le thème
  sur le conteneur, jamais sur `<html>`. Les classes dépendant du thème
  s'écrivent `vibe-dark:` — `dark:` suivrait le thème de l'hôte et allumerait le
  mode sombre de Vibe parce que le chat est sombre.
- **URL par `router.tsx`.** `toVibePath` pour les liens, `stripVibeBasePath` pour
  les comparaisons de chemin, `toVibeAbsoluteUrl` pour les partages et QR codes,
  `deriveVibeRouteParams` pour la lecture. Un chemin écrit à la main mène hors de
  `/vibe`.
- **`/vibe/@pseudo`** est réécrit vers `/vibe/u/[username]` par `next.config.ts`.
- **Réseau par le relais BFF** `/api/vibe/**` : le relais lit le cookie httpOnly
  et pose l'`Authorization`. Ne jamais poser d'`Authorization` côté client sur un
  appel relayé, et ajouter tout nouveau endpoint à la liste blanche de
  `lib/vibe/server/relay-policy.ts` — un chemin absent est refusé en 404, volontairement.
- **Premier écran pré-hydraté** en lecture directe Postgres (`lib/vibe/server/`),
  écritures, IA et temps réel sur l'API. Une graine `null` fait retomber sur l'API.
- **Portails dans `.vibe-root`**, pas dans `document.body` : sinon le lecteur de
  Stories et les feuilles perdent les jetons de thème.

Comportement, authentification et API intégrés :
[docs/2-vibe/INTEGRATION.md](../../docs/2-vibe/INTEGRATION.md).
