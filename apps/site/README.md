# Site officiel mAI — application source

Ce dossier contient la version **autonome** du Site officiel : une application
Next.js qui présente les modèles, les produits, la documentation, les tarifs et
les points d'entrée développeur de l'écosystème (44 pages, 24 routes d'API).

Le même site est intégré à l'application hôte sous `/site`, via
`components/site/`, `lib/site/` et les pages du groupe `(chat)`. Les deux formes
partagent le contenu, **pas** leurs builds.

## Avertissement : cet arbre n'est pas l'application qui tourne

| Contrôle | `apps/site` |
| --- | --- |
| `pnpm typecheck` (racine) | non — `tsconfig.json` déclare `exclude: ["apps"]` |
| `pnpm build` (racine) | non — le build racine ne compile jamais `apps/site` |
| CI | non |

Un défaut qui s'y glisse ne lève donc **aucun** signal. C'est arrivé, et c'est ce
qui rend cet avertissement opérationnel plutôt que décoratif. Deux divergences
connues ne sont corrigées que dans l'hôte :

1. **Session** — ici, `authenticateSession` tient un échec de vérification locale
   pour définitif et rend un 401 à un utilisateur connecté. L'hôte délègue à
   `getMaiUser` quand la vérification locale est impossible, sans jamais tenir un
   jeton non vérifié pour valide (`tests/unit/site-session-auth.test.ts`).
2. **DDL au runtime** — le gestionnaire de clés d'API d'ici fait un `ALTER TABLE`
   muet en cours de requêtes. L'hôte utilise une migration versionnée, et
   `tests/unit/api-key-migration-safety.test.ts` échoue si un `ALTER TABLE` revient.

**Les chemins d'API ne sont pas les mêmes** : `apps/site` monte `/api/**` ; l'hôte
les sert sous `/api/site/**`. Un chemin copié tel quel dans un composant porté
produit un 404. Dans le port, un appel passe par `lib/site/api-routes.ts` et une
navigation par `components/site/router.tsx`.

## Ce qui reste vivant ici — et pourquoi on ne supprime pas

- `app/globals.css` est la **source** de `scripts/build-site-css.mjs`, qui produit
  `components/site/site.css`. Supprimer ce fichier rend la feuille du port
  non régénérable.
- Les contenus lus au runtime par `lib/site/changelog.ts`, `lib/site/docs.ts` et
  `lib/site/news.ts` viennent d'ici, et `next.config.ts` de l'hôte embarque ces
  chemins dans son tracing.

## Démarrer et commandes

Node.js 20 minimum. `bun.lock` et `package-lock.json` sont tous deux présents ;
`npm install` est le chemin documenté, mais plusieurs scripts appellent `bun run`.

| Commande | Action |
| --- | --- |
| `npm run dev` / `build` | Next.js indépendant |
| `npm run lint` | ESLint, via `eslint.config.js` propre — le dépôt racine, lui, est en Biome |
| `npm run typecheck` | `tsc --noEmit` local |
| `npm test` | Vitest |

Les scripts `admin`, `reset:*`, `newsletter:send` et `code:create` appellent
`scripts/admin.ts` et `scripts/newsletter-send.ts`, absents de cet arbre : des
outils équivalents vivent à la racine du dépôt (`pnpm admin`).

## Documentation

- [docs/5-site/INTEGRATION.md](../../docs/5-site/INTEGRATION.md) — le port
- [docs/5-site/AGENTS.md](../../docs/5-site/AGENTS.md) — les onze règles, dont
  `.site-root`, le routeur, l'interdiction d'importer `@/email` (runtime Deno) et
  l'absence de `runtime = "nodejs"` sous `cacheComponents`
