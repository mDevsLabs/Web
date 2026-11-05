# Site officiel mAI

Cette section documente le **port** du Site officiel dans l'application hôte,
sous `/site` : vitrine des modèles et des produits, documentation, actualités,
tarifs, compte développeur et terrain de jeu API. La source autonome correspond,
avec son propre paquet et son propre cycle de build, est dans
[`apps/site/`](../../apps/site/README.md).

## Guides

- [INTEGRATION.md](INTEGRATION.md) — architecture du port, montage des pages, SSO,
  routes d'API
- [AGENTS.md](AGENTS.md) — les onze règles impératives du port

## Ce que le port impose

| Contrainte | Conséquence |
| --- | --- |
| `components/site/site.css` est **généré** par `node scripts/build-site-css.mjs` | Corriger `apps/site/app/globals.css`, jamais la sortie |
| Tout le site vit sous `.site-root` | Aucune règle ne déborde sur le thème achromatique du chat |
| Les liens passent par `components/site/router.tsx` | Un chemin écrit à la main sort de `/site` |
| Les API vivent sous `/api/site/**` | Un composant portant `/api/**` de la source fait un 404 |
| SSO par `AuthProvider` | Une session mAI ouverte l'est aussi sur `/site`, sans reconnexion |

Deux règles qui n'ont l'air de rien et coûtent cher : **ne jamais** importer
`@/email` (runtime Deno de la racine) dans un module du site — utiliser
`@/lib/site/email` ; et ne jamais poser `export const runtime = "nodejs"` ni
`dynamic = "force-dynamic"`, que `cacheComponents` refuse.

`apps/site` n'est compilé ni par `pnpm build`, ni par `pnpm typecheck` à la
racine : `tsconfig.json` exclut `apps/`. Le détail des divergences connues entre
la source et le port est en tête de
[apps/site/README.md](../../apps/site/README.md).
