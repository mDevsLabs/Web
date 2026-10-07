# Livraison, versions et archives

Les packages 0.2.0 sont livrés avec sources et sorties compilées. Aucun script ne publie sur npm, ne crée de dépôt distant ni n'embarque de jeton npm. Les commandes suivantes appartiennent au monorepo ; une copie de ce guide dans `catalog/docs/` ne contient pas ses scripts.

## Définir le contrat public

Le contrat comprend noms d'exports, sous-chemins, props/callbacks, modèles et unions de statuts, identifiants de métriques/réglages, comportements contrôlés, tokens CSS documentés, grille/accessibilité des icônes et métadonnées nécessaires à l'installation.

| Évolution | Critère de compatibilité |
| --- | --- |
| Ajouter une entrée | Absence de collision globale, sous-chemin stable et contrat autonome ; une taille/couleur n'est pas un nouveau composant compté |
| Renommer/supprimer un export ou sous-chemin | Rupture pour les consommateurs ; documenter une migration et retirer les anciens fichiers générés |
| Ajouter une prop requise ou supprimer un callback | Rupture de type/comportement ; ne pas la présenter comme une correction visuelle |
| Changer champ, statut ou clé de réglage | Examiner construction des objets, filtres et persistance ; fournir l'ancien et le nouveau contrat |
| Changer valeurs par défaut, formulaire ou focus | Vérifier les flux existants même si TypeScript compile encore |
| Modifier tokens, classes ou contraste documentés | Contrôler clair/sombre, portails, verre désactivé, petits écrans et surcharges CSS |
| Modifier une icône | Préserver nom/import si compatible, grille 24 px, taille/title et attribution ; signaler un changement visible |
| Changer peers, Node ou formats de modules | Rupture possible d'installation/build ; vérifier consommateurs externes et `types`/`import`/`require` |

Pendant 0.x, le contrat peut évoluer, mais chaque rupture doit être explicite dans les `CHANGELOG.md` et guides concernés. Aucun outil de versionnement automatique n'est fourni. Ne pas annoncer une garantie de stabilité supérieure à celle publiée.

## Aligner les versions

Pour une nouvelle livraison, examiner ensemble :

- `package.json` racine : sa version donne les noms ZIP à `scripts/archive.py` ;
- `packages/ui/package.json` et `packages/icons/package.json` : versions des tarballs ;
- `apps/catalog/package.json` : sa version et les deux dépendances internes ;
- les manifests, qui lisent désormais la version de chaque package lors de la génération ;
- les versions de `catalog/documentation.json`, reconstruites depuis chaque `package.json` par `docs:build` ;
- le lockfile, les changelogs et les exemples contenant une version ;
- les noms ZIP, lus depuis la version racine par les scripts d’archivage et contrôle ;
- les constantes Lucide/Tabler si le snapshot change.

Les manifests déduisent leur version de chaque package.json et le contrôle ZIP déduit ses noms depuis la racine. Régénérer et empaqueter après alignement des métadonnées ; un ancien build ou tarball ne devient pas courant par un changement de nom.

Ne pas modifier le lockfile à la main sans vérifier sa cohérence avec les workspaces. Une évolution de dépendance demande une installation mise à jour puis une installation propre contrôlée.

## Préparer sources et distributions

Si une source de génération a changé :

```sh
npm ci
npm run generate
npm run verify
```

`generate` inclut mise en forme et production documentaire. `verify` construit d’abord les distributions, puis lance `docs:check`, typecheck, tests et contrôle de distribution. Il ne lance pas génération, navigateur ou archivage. Ajouter le navigateur si l'interaction ou le design change ; voir [TESTING.md](TESTING.md).

Après retrait/renommage, comparer le manifeste aux anciens fichiers dans `src`, `catalog` et `svg` et retirer les sorties obsolètes identifiées. Le générateur ne nettoie pas ces dossiers. Le build nettoie `dist`, mais recompile tous les modules restant dans `src`, y compris les anciens.

Avant livraison de code, vérifier les deux `dist/index.js`, `index.cjs` et `index.d.ts`, les sous-chemins et le CSS `packages/ui/dist/styles.css`, `dist/fonts/inter-variable.woff2`, `LICENSE-INTER.txt` et `STYLE.md`. Une modification manuelle de `dist` ne remplace pas un rebuild depuis les sources.

## Préparer les documents distribués

Les guides communs ont pour source `docs/`. La production documentaire construit les fiches, guides de domaines/catégories, index IA et copies `packages/*/catalog/docs/` :

```sh
npm run docs:build
npm run docs:check
```

Ce cycle suffit pour un changement de texte lorsque code/CSS et `dist` sont présents et inchangés ; aucun rebuild runtime n’est nécessaire. Sur un checkout sans `dist`, lancer d’abord `npm run build` : les contrôles d’imports et exemples complets lisent les déclarations distribuées. Il faut en revanche refaire les tarballs et ZIP pour embarquer les nouveaux documents. `docs:check` contrôle la documentation ; les exemples TSX du dépôt restent vérifiés par `npm run typecheck`.

Relire les `README.md`, `AGENTS.md`, `llms.txt`, `llms-full.txt` et `CHANGELOG.md` distribués. Modifier les règles de génération pour les documents dérivés, plutôt que leur seule sortie. Garder les liens entre guides voisins relatifs (`TESTING.md`) ; citer les chemins du dépôt en code s'ils ne sont pas inclus dans un package isolé.

La production documentaire ne supprime pas les anciens guides. Lors d'un retrait/renommage, examiner aussi les copies `catalog/docs/` et l'index `catalog/documentation.json`, qui peut inclure des Markdown restant sur disque.

Une ancienne livraison sans outillage documentaire pouvait utiliser une copie manuelle de `docs/*.md` vers les deux `catalog/docs/`. Cette copie seule n'enrichit pas les fiches, ne reconstruit pas les index IA et ne contrôle pas la cohérence : utiliser le cycle documentaire du dépôt courant.

## Examiner les tarballs npm

Après la préparation des documents :

```sh
npm pack --workspace @mdevs/ui --dry-run
npm pack --workspace @mdevs/icons --dry-run
npm run pack:packages
```

`npm pack` respecte la liste `files` et les règles npm. Il ne compile ni ne valide les comportements. Vérifier `src`, `dist`, `catalog`, les guides/index IA et les licences. `scripts/verify.mjs` produit lui aussi des tarballs ; les reconstruire après un changement documentaire embarque le texte final.

En 0.2.0, les sorties sont `artifacts/mdevs-ui-0.2.0.tgz` et `artifacts/mdevs-icons-0.2.0.tgz`. Dans une application existante, adapter les chemins :

```sh
npm install /chemin/mdevs-ui-0.2.0.tgz /chemin/mdevs-icons-0.2.0.tgz
```

L'application fournit React compatible ; npm résout les dépendances telles que Radix. Les contrôles automatisés de consommateurs React 18.3.1/19.2.0 sont décrits dans [TESTING.md](TESTING.md).

## Créer les ZIP et contrôler leur installation

```sh
npm run release:zip
node scripts/check-zips.mjs
```

| Archive 0.2.0 | Racine dans le ZIP | Usage |
| --- | --- | --- |
| `mdevs-ui-0.2.0.zip` | `mdevs-ui/` | Dépendance UI complète, installable depuis son dossier extrait |
| `mdevs-icons-0.2.0.zip` | `mdevs-icons/` | Dépendance Icons complète avec SVG et attributions |
| `mdevs-monorepo-0.2.0.zip` | `mdevs/` | Dépôt complet, génération/test, guides et catalogue |

`archive.py` lit la version racine. Il exclut `node_modules`, `.git`, `.types`, caches et rapports temporaires Playwright, ainsi que `.log`, `.zip` et liens symboliques. Dans les `artifacts` du monorepo, seuls `.png`, `.json` et `.tgz` sont embarqués ; l'ancien `release-manifest.json` est exclu.

Les ZIP de packages archivent les fichiers de leurs dossiers, pas la liste npm `files` : inspecter les deux formats. Le script trie les entrées, fixe leur date au 4 octobre 2026 et normalise le mode de fichier. Il vérifie CRC et absence de chemins absolus/segments `..`. Il ne prouve ni la fraîcheur du build ni la validité des documents.

Les empreintes et tailles sont écrites après archivage dans `artifacts/SHA256SUMS.txt` et `artifacts/release-manifest.json`. La date fixe des entrées ne constitue pas la date du dernier contrôle. Toute modification livrée exige de refaire ZIP et empreintes.

`check-zips.mjs` extrait les deux ZIP 0.2.0, installe leurs dossiers avec `--install-links` dans un consommateur React/ReactDOM 19.2.0, contrôle SSR Dialog/Button/icône et résolution CSS/fonte, présence de STYLE.md/AGENTS.md et licence Inter, puis écrit `artifacts/zip-install-results.json`. Il ne type pas tous les exemples et ne lance pas le navigateur.

Dans une application existante, extraire les ZIP puis installer les dossiers :

```sh
npm install --install-links /chemin/mdevs-ui /chemin/mdevs-icons
```

`--install-links` traite ces dépendances locales hors workspace comme des packages copiés/installés plutôt que de simples liens vers leurs sources. React et Radix sont alors résolus dans l'installation consommatrice. Ne pas déplacer manuellement les ZIP dans `node_modules` ni demander à npm d'installer directement ces fichiers ZIP.

Si le nouveau rapport ZIP doit figurer dans le ZIP monorepo, refaire ensuite `npm run release:zip`. Le contrôle porte sur les deux ZIP de packages ; s'ils restent identiques, une répétition d'installation n'est pas nécessaire pour ajouter uniquement un rapport au dépôt. Vérifier leur identité et les empreintes finales.

Toute copie de téléchargement située hors `artifacts/` doit être remplacée depuis les archives finales et son empreinte vérifiée. Le script ne rafraîchit pas ces copies et ne crée pas d'alias nommé « complet ».

## Licences et provenance

Les sources Mdevs portent la licence MIT incluse. Les géométries d'icônes viennent de Lucide et Tabler. Conserver dans Icons `LICENSE`, `LICENSE-LUCIDE`, `LICENSE-TABLER` et `NOTICE.md`. Lucide utilise ISC avec une notice MIT pour les géométries issues de Feather ; Tabler fournit une licence MIT.

Manifeste et snapshot indiquent source/versions ; modules et SVG référencent les attributions. Ne pas supprimer ces notices lorsqu'un SVG est sélectionné ou redistribué. Des géométries distinctes ne deviennent pas des créations originales Mdevs. Une nouvelle source amont demande de vérifier ses droits et d'inclure sa licence exacte.

## Publication npm, si elle est demandée

Avant publication, disposer du scope `@mdevs`, vérifier noms/version sur le registre, inspecter le tarball final et appliquer les règles de compte/signature du projet. `publishConfig.access: public` ne publie rien à lui seul.

Depuis un poste connecté au compte approprié, pour une publication explicitement souhaitée :

```sh
npm publish artifacts/mdevs-ui-0.2.0.tgz --access public
npm publish artifacts/mdevs-icons-0.2.0.tgz --access public
```

Adapter les noms à la version finale. Une demande de ZIP autorise leur fabrication/livraison, sans constituer une publication npm. Le compte rendu doit donner version, archives, changements de contrat, contrôles réellement exécutés et limites.
