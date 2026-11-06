# Vibe

Vibe est la partie sociale de mAI : profils, fil d'actualité, publications et
commentaires, messagerie privée, Stories, livres collaboratifs, fonctions IA. La
source autonome React/Vite vit dans [`apps/vibe/`](../../apps/vibe/README.md) ;
le port est servi sous `/vibe` par l'application hôte.

## Guides

- [INTEGRATION.md](INTEGRATION.md) — routage, session, relais BFF `/api/vibe/**`,
  pré-hydratation, sorties générées
- [ARCHITECTURE.md](ARCHITECTURE.md) — frontend, backend, flux de données
- [STORIES.md](STORIES.md) — cycle de 24 h, archive, quota journalier par forfait,
  deux plafonds média distincts
- [STYLING_ROUTING.md](STYLING_ROUTING.md) — isolement du thème et URL
- [MOBILE_CAPACITOR.md](MOBILE_CAPACITOR.md) — client Capacitor propre à Vibe
- [AGENTS.md](AGENTS.md) — règles impératives du portage

## Ce qu'un portage change aux habitudes

Le build Next racine ne compile **pas** `apps/vibe/` : il en **génère** deux
choses, qu'il est interdit d'éditer à la main.

| Sortie | Source à corriger | Script |
| --- | --- | --- |
| `components/vibe/vibe.css` | `apps/vibe/src/index.css` | `node scripts/build-vibe-css.mjs` |
| `app/(chat)/vibe/**/page.tsx` | table `ROUTES` du script | `node scripts/build-vibe-routes.mjs` |

Tout Vibe vit sous `.vibe-root` ; les classes dépendant du thème s'écrivent
`vibe-dark:`, jamais `dark:` ; les URL passent par `components/vibe/router.tsx`.
Le détail et les raisons sont dans les guides ci-dessus.

Les données sont lues en **lecture seule** directement en Postgres par
`lib/vibe/server/` pour la première couche d'écran, tandis que les écritures,
l'IA et le temps réel restent sur le backend. Une erreur de lecture rend la
graine `null` et l'appel API reprend la main : la réplication n'est jamais un
point de défaillance unique.
