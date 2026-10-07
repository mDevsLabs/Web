# Architecture et sources de vérité

Ce guide décrit le monorepo et accompagne aussi chaque package dans `catalog/docs/`. Dans cette copie, les chemins `scripts/`, `tests/`, `apps/` et `packages/` désignent le dépôt complet : un ZIP de dépendance isolée ne contient pas son outillage. Pour intégrer les packages, lire [GETTING_STARTED.md](GETTING_STARTED.md) et [AI_AGENTS.md](AI_AGENTS.md).

## Dépendances et responsabilités

Le dépôt utilise les workspaces npm `packages/*` et `apps/*`.

| Partie | Dépendances et responsabilité |
| --- | --- |
| `@mdevs/ui` | React/ReactDOM sont des peers ; `radix-ui` est installé comme dépendance. Le package fournit CSS, primitives et composants métier. |
| `@mdevs/icons` | React est un peer. Le package fournit les composants SVG, leur fabrique commune et les SVG bruts. |
| `@mdevs/catalog` | Application Vite privée dépendant des deux packages et de React/ReactDOM. Elle présente des démonstrations. |
| Dépôt racine | Génération Python, documentation/build Node, TypeScript, Vitest et contrôles de distribution/navigateur. |

UI et Icons ne dépendent pas l'un de l'autre. Une application peut installer un seul package. React reste fourni par l'application hôte ; il ne doit pas devenir une copie privée embarquée par les bibliothèques.

## Carte des dossiers

| Chemin dans le dépôt | Contenu | Point d'édition durable |
| --- | --- | --- |
| `scripts/foundations.py` et `scripts/extensions.py` | Corps, imports, descriptions, comportements et fixtures des 132 primitives | Oui ; source des modules `src/primitives/` |
| `scripts/data/domains.txt` | Descriptions des 108 modèles métier | Oui ; source des domaines, types et exemples générés |
| `scripts/generate.py` | Émission des modules, noms, catégories, exports et manifests | Oui ; portée potentielle sur les deux packages |
| `scripts/data/icons.json` | Snapshot des géométries, tags, sources et versions amont | Oui ; préserver provenance et empreintes |
| `scripts/documentation.mjs` | Enrichissement documentaire, copies de guides et index IA | Oui ; règles de production des documents dérivés |
| `packages/ui/src/primitives/` | Primitives React et index | Généré, même sans avertissement dans chaque fichier |
| `packages/ui/src/components/<domaine>/` | Types, configuration, dix composants et index d'un domaine | Généré |
| `packages/ui/src/internal/domain.tsx` | Dix rendus métier partagés | Oui ; utilisé par les 1 080 composants métier |
| `packages/ui/src/fonts/` et `LICENSE-INTER.txt` | Police Inter 4.1 locale, métadonnées/SHA256 et licence SIL OFL | Oui ; asset versionné, conserver attributions |
| `packages/ui/src/extensions.css` | Styles des 60 primitives ajoutées, concaténés au CSS public | Oui |
| `STYLE.md` | Règles de création/style choisies, copiées dans les packages | Oui ; source canonique |
| `packages/ui/src/internal/theme.tsx` et `utils.ts` | Contexte, portails et utilitaires | Oui |
| `packages/ui/src/styles.css` | Tokens, verre, thèmes, états et adaptation UI | Oui |
| `packages/icons/src/create-icon.tsx` | Taille, trait, contrat et accessibilité des icônes | Oui |
| `packages/icons/src/icons/` et `packages/icons/svg/` | Modules React, index et SVG bruts | Généré |
| `packages/*/src/index.ts` | Exports globaux | Généré |
| `packages/*/package.json` | Métadonnées npm et contrat d'export | Mixte : `exports` est reconstruit ; les autres métadonnées sont conservées, avec ajout de `LICENSE-TABLER` aux fichiers Icons |
| `packages/*/catalog/manifest.json` | Inventaire machine, imports et contrats | Généré |
| `packages/*/catalog/documentation.json` | Index des documents, chemins relatifs au package et imports associés | Généré par la phase documentaire |
| `packages/ui/catalog/<domaine>/`, `catalog/components/` et `packages/icons/catalog/<catégorie>/` | Configurations, exemples et fiches du catalogue | Documents dérivés ; modifier les sources ou règles de documentation |
| `docs/` | Guides communs de référence | Oui |
| `packages/*/catalog/docs/` | Guides communs distribués | Copies reconstruites par `docs:build` |
| `packages/*/README.md`, `AGENTS.md`, `llms.txt`, `CHANGELOG.md` | Entrées propres à chaque package | Éditer la source appropriée ; distinguer les fichiers générés de ceux écrits à la main |
| `llms-full.txt` et `packages/*/llms-full.txt` | Documentation agrégée pour agents IA | Produite par le générateur documentaire |
| `tests/` et `examples/` | Vérifications et intégrations typées | Oui |
| `apps/catalog/src/` | Interface et styles de démonstration | Oui |
| `packages/*/dist/` et `apps/catalog/dist/` | Sorties compilées | Build ; ne pas corriger les livrables manuellement |
| `artifacts/` | Tarballs, ZIP, empreintes, JSON et captures | Résultats ; un fichier présent peut appartenir à une exécution antérieure |

`generate` reformate aussi les TS/TSX écrits à la main dans `packages/*/src/`, via `scripts/format.mjs`. Leur logique est conservée, mais leur présentation peut changer. Examiner le diff après génération.

## Contrats métier et indépendance des modules

Une ligne de `scripts/data/domains.txt` suit cette structure :

```text
NomType|Libellé|clé:Libellé:type;autreClé:Libellé:type|statut1,statut2|Valeur de démonstration
```

Les types actuellement exploités sont `text`, `number`, `date`, `email` et `url`. Le générateur ajoute `status` requis, `id` optionnel, des types d'activité/métrique et trois clés de réglages propres au domaine. Les séparateurs `|`, `;`, `:` et `,` ne disposent pas d'échappement. Le fichier ne prend pas en charge des commentaires ni une validation complète avant émission : préserver la grammaire de chaque ligne et éviter les clés réservées `id`/`status` dans les champs déclarés.

Chaque domaine expose `Overview`, `Card`, `List`, `Table`, `Form`, `Filters`, `Timeline`, `Stats`, `EmptyState` et `Settings`. Chaque composant possède son module public et son contrat. Les dix familles partagent les fonctions `Domain*` de `internal/domain.tsx`, avec une configuration propre au domaine. Les 1 212 exports, dont 1 080 métier, ne constituent donc pas 1 212 moteurs de rendu différents.

Un import `@mdevs/ui/invoice/invoice-form` ne dépend pas des composants des 103 autres domaines. Il charge cependant les dépendances communes nécessaires au rendu métier et la configuration de facture. Les fichiers `schema.json` du catalogue contiennent une configuration et un exemple, pas un validateur JSON Schema exécutable.

Les fichiers internes restent des détails d'implémentation. Dans une application, utiliser les entrées déclarées dans `package.json`, jamais `@mdevs/ui/src/internal/...` ou `@mdevs/icons/src/...`. Voir [API.md](API.md).

## Chaîne effective de fabrication

Depuis la racine du monorepo, avec Node ≥ 22.12.0, npm et Python 3 :

```sh
npm ci
npm run generate
npm run typecheck
npm test
npm run build
node scripts/verify.mjs
npm run docs:check
```

1. **Génération** : `python3 scripts/generate.py` écrit modules/catalogues/exports, lance automatiquement `node scripts/format.mjs`, puis la production documentaire. `generate` ne reconstruit pas `dist`.
2. **Documentation** : `npm run docs:build` permet de reconstruire les fiches, guides distribués et index IA sans régénérer les composants. `npm run docs:check` compare les sorties attendues, vérifie liens/imports nommés et compile les exemples complets des fiches UI contre les déclarations distribuées ; il exige donc un build présent et cohérent.
3. **Sources** : `tsc --noEmit` examine packages, application, tests et exemples. Vitest lit les sources et manifests ; il ne valide pas à lui seul les fichiers compilés.
4. **Build** : `scripts/build.mjs` supprime les deux `dist` et `.types`, émet les déclarations TypeScript, transpile chaque module ESM/CJS, ajuste les références CJS de `.js` vers `.cjs`, copie le CSS UI et compile le catalogue Vite. Il supprime ensuite `.types`.
5. **Distribution** : `scripts/verify.mjs` examine les sorties, crée des tarballs npm et les installe dans des consommateurs React 19.2.0/18.3.1. Voir [TESTING.md](TESTING.md).
6. **Archives** : inspecter les fichiers distribués, fabriquer les ZIP et contrôler leur installation. Voir [RELEASING.md](RELEASING.md).

`npm run verify` enchaîne build, `docs:check`, typecheck, tests et `scripts/verify.mjs`. Le build initial garantit les déclarations nécessaires aux imports ciblés, même sur un checkout sans `dist`. Il ne lance pas la génération, le navigateur, l’archivage ou `scripts/check-zips.mjs`.

## Formats et effets de bord

ESM utilise `.js` dans un package `type: module` ; CommonJS utilise `.cjs` ; les types utilisent `.d.ts`. Les conditions `types`, `import` et `require` d'`exports` pointent vers ces sorties. Les champs `main`, `module` et `types` existent également.

Le build transpile par module avec `bundle: false` : React, ReactDOM et Radix restent résolus par le consommateur. Chaque module JavaScript compilé reçoit `"use client"`. Cette frontière facilite les frameworks React à composants serveur, sans remplacer un essai dans la version du framework hôte.

UI déclare `**/*.css` dans `sideEffects`. Importer `@mdevs/ui/styles.css` une fois dans un environnement traitant le CSS. Icons déclare `sideEffects: false`, et ses appels `createIcon` sont annotés purs. L'élimination des exports inutilisés dépend du bundler et des imports ; le contrôle fourni couvre un cas ciblé ESM.

## Snapshot, provenance et limites de génération

La génération standard utilise le snapshot local sans téléchargement. Pour reconstruire une sélection depuis des dossiers amont déjà acquis :

```sh
npm run generate -- --lucide /chemin/lucide --tabler /chemin/tabler
```

Fournir les deux options ensemble : avec une seule option, le code actuel utilise le snapshot local. Lucide doit fournir `icons/*.svg`, `tags.json` et `LICENSE` ; Tabler, `icons.json`, `tabler-nodes-outline.json` et `LICENSE`. Le générateur copie alors les licences et réécrit le snapshot.

Les versions amont `1.52.0` et `3.48.0` sont codées dans `snapshot_icons`, pas déduites des dossiers. Les versions des manifests sont lues depuis le package.json de leur package. Le script documentaire lit en revanche la version des index `documentation.json` depuis le `package.json` de chaque package. Une nouvelle livraison doit aussi régénérer les données, aligner les dépendances workspace/lockfile et reconstruire les sorties.

L'empreinte des icônes porte sur les nœuds SVG sérialisés, sans métadonnées de fichier. La sélection amont élimine les géométries sérialisées identiques ; elle ne compare pas leur apparence et ne prouve pas leur originalité. `generate_icons` détecte les collisions PascalCase, mais ne revalide pas toutes les géométries d'un snapshot édité manuellement. Les tests complètent cette vérification. La catégorie est choisie par préfixes de nom, sans garantie de taxonomie fondée sur les tags.

Le générateur **ne supprime pas les anciens fichiers** après retrait ou renommage. Des modules, SVG ou guides obsolètes peuvent subsister dans `src`, `svg` ou `catalog`, puis être compilés/archivés. Comparer l'inventaire au manifeste et retirer seulement les anciens fichiers identifiés. Ne pas supprimer globalement `src`, qui contient les moteurs écrits à la main.

La production documentaire reconstruit les fichiers attendus sans nettoyer automatiquement les documents retirés. Son index lit aussi les Markdown déjà présents dans le catalogue : un ancien guide peut donc rester indexé. Lors d'un retrait, examiner les copies et index en plus du manifeste de composants/icônes.

Les collisions de noms, chemins produits par `slug`, types ou clés métier UI ne sont pas toutes détectées avant écriture. Une erreur peut laisser des écritures partielles. Vérifier les noms avant génération et inspecter le diff après. Un alias ou une variation de taille/couleur n'augmente pas le nombre d'entrées indépendantes.

## Responsabilités applicatives

Les packages gèrent affichage et interactions locales. L'application fournit données, identifiants, callbacks, stockage, droits, validation métier, réseau, pagination serveur et stratégie de traduction. Les démonstrations ne constituent ni paiement, ni authentification, ni diagnostic médical.

Un changement de rendu partagé, thème ou tokens peut toucher des centaines d'exports. Remonter à la source durable avant de livrer, puis utiliser la matrice de [TESTING.md](TESTING.md) et les critères de [RELEASING.md](RELEASING.md).
