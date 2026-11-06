# Vibe — source autonome

Vibe est l'application sociale de mAI : fil d'actualité (Pour Vous, Abonnements,
Tendances), publications et commentaires, exploration, profils, messagerie privée
et de groupe, notifications, Stories, livres collaboratifs, statistiques et le
studio IA. Ce dossier en contient la **version autonome** : une SPA React/Vite,
son backend Deno/Hono et ses migrations.

Elle est aussi portée dans mAI Web sous `/vibe`. Ce dossier n'est **pas** compilé
par `pnpm build` à la racine — et une modification ici n'actualise pas le port :
le port est **généré** depuis certaines de ces sources (voir plus bas).

## Démarrer

npm fait foi (`package-lock.json` versionné ; la CI lance `npm ci` puis
`npm run build` avec ce lockfile).

```sh
npm install
npm run dev
```

Le serveur Vite écoute sur le port **3000** en `strictPort` et **mandate** `/api`,
`/v1`, `/vibe`, `/login`, `/models`, `/chat`, `/images`, `/upload`… vers
`https://mai.val.run` : il n'y a donc pas de backend à lancer en local pour
travailler l'interface.

## Commandes

| Commande | Action |
| --- | --- |
| `npm run dev` / `preview` | SPA Vite |
| `npm run build` | `tsc -b` puis `vite build` |
| `npm run lint` | oxlint (ce dossier est exclu de Biome) |
| `npm test` | Renvoie à `test:backend` : `deno test --allow-import --allow-env tests` |
| `npm run check:backend` / `check:migrations` | `deno check` sur le backend et le migrateur |
| `npm run migrate` | Migrations SQL via `node scripts/migrate.js` |

## Organisation

```
src/        App.tsx (routeur et coque), pages/, components/, context/, hooks/,
            services/, algorithms/, data/, types/, index.css
lib/db/     migrator.ts + migrations/ (SQL sommés de contrôle)
lib/tools/  les modules d'outils IA de mAI dans Vibe
tests/      tests Deno du backend
public/     PWA (sw.js, manifeste)
```

## Backend et données

Le backend de Vibe est celui de la plateforme : les modules `vibe-*.ts` de la
**racine du dépôt**, montés par `main.ts` et déployés sur Val Town, qui servent
`/v1`, `/vibe` et `/api/vibe`. Base **Neon Postgres uniquement**.

Deux politiques de DDL coexistent, ne pas les confondre : les tables Vibe ne sont
**pas** dans Drizzle. Elles vivent d'un côté dans les migrations SQL de
`lib/db/migrations/` (contrôle de somme de contrôle : une migration appliquée se
remplace, elle ne se retouche pas), de l'autre dans les `ensure*()` exécutés au
chargement par le backend.

## Le port, côté hôte

| Sortie générée — ne jamais éditer | Source | Script |
| --- | --- | --- |
| `components/vibe/vibe.css` | `src/index.css` | `node scripts/build-vibe-css.mjs` |
| `app/(chat)/vibe/**/page.tsx` | table `ROUTES` du script | `node scripts/build-vibe-routes.mjs` |

`src/services/api.ts` garde l'accès direct à `mai.val.run` : c'est la référence
Vite. Le port, lui, passe par le relais BFF `/api/vibe/**` de l'hôte.

Guides : [docs/2-vibe/](../../docs/2-vibe/README.md) et
[le contrat du port](../../components/vibe/README.md).
