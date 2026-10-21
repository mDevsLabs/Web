# Applications BLACKLINE natives — retirées

## Why

Le jeu est aujourd'hui **monté par l'hôte mAI** : `scripts/build-blackline.mjs`
compile `src/` en Vite et dépose le résultat dans `public/blackline/`, que la page
`/blackline` charge par un script à chemin fixe
(`/blackline/assets/blackline.js`).

Le conditionnement Electron et Capacitor décrit ci-dessous appartenait à une
distribution **autonome** du jeu. Il a été retiré du dépôt : rien ne le
construisait.

- Le seul workflow qui le construisait (`apps/blackline/.github/workflows/build.yml`)
  était **imbriqué** : GitHub Actions n'exécute que les workflows situés à la
  racine du dépôt. Il ne jouait donc aucun rôle.
- La CI de l'hôte (`.github/workflows/build.yml`) ne possède aucun job Blackline
  natif : elle construit le jeu par `pnpm build`, au même titre que Vibe, Wakies
  et Site.
- Aucun script de l'hôte, aucun composant et aucune page de l'hôte ne référence
  `apps/blackline/apps/`.

Les répertoires retirés sont consignés dans
[`docs/CLEANUP_INVENTORY.json`](../../../docs/CLEANUP_INVENTORY.json) : leur
absence est vérifiée par `node scripts/check-cleanup.mjs`.

## Ce qui remplace

| Besoin | Chemin |
| --- | --- |
| Jouer dans un navigateur | `/blackline` de l'hôte mAI |
| Jouer hors ligne | Export web du jeu (`npm run build` dans `apps/blackline`, puis `public/blackline/`) |
| Contrat d'intégration | `src/mount.ts` et `src/entry.ts` — inchangés |

## Ce qui reste en place

- `src/**` : la source du jeu, compilée par Vite.
- `lib/game/**` : le modèle de données (carrière, catalogue, progression), importé
  par `src/**`.
- `api/**`, `lib/db/**`, `lib/server/**` : les services retirés (comptes,
  synchronisation en ligne). Ils répondent **410 Gone** et restent couverts par
  la suite de tests du jeu (`npm test` dans `apps/blackline`). `docs/DEPLOYMENT.md`
  explique pourquoi ils sont conservés.
- `tests/**` : la suite de tests du jeu, exécutée par
  `npm test` dans `apps/blackline`.

Références : https://capacitorjs.com/docs/updating/8-0 ; https://capacitorjs.com/docs/apis/share ; https://capacitorjs.com/docs/apis/filesystem ; https://www.electronjs.org/docs/latest/tutorial/security ; https://www.electron.build/v26/docs/cli/
