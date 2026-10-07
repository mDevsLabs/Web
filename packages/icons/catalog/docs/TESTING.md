# Validation : commandes, couverture et preuves

Ce guide accompagne le dépôt et ses copies `catalog/docs/`. Les commandes de maintenance se lancent à la racine du **monorepo complet**, où existent `scripts/`, `tests/`, le lockfile et les workspaces. Un ZIP de dépendance permet l'installation et la lecture des sources, mais ne contient pas cet outillage. Dans une application consommatrice, utiliser aussi ses propres contrôles.

## Préparer l'environnement

Le dépôt demande Node ≥ 22.12.0, npm et Python 3. Le minimum Node ≥ 18 des packages installables ne correspond pas au minimum de l'outillage du monorepo. Les versions React contrôlées par le script de distribution sont 19.2.0 et 18.3.1.

```sh
npm ci
```

`npm ci` et les installations de consommateurs peuvent nécessiter le registre npm, un cache ou un proxy. La génération depuis le snapshot local ne télécharge pas les géométries. Voir [TROUBLESHOOTING.md](TROUBLESHOOTING.md) pour isoler un échec d'environnement.

## Commandes disponibles

| Commande depuis la racine | Effet |
| --- | --- |
| `npm run generate` | Reconstruit sources/catalogues/exports, reformate les TS/TSX des packages puis reconstruit leur documentation |
| `node scripts/format.mjs` | Reformate les TS/TSX des packages ; aucun script npm `format` n'est déclaré |
| `npm run docs:build` | Reconstruit les fiches, guides distribués et index IA à partir des sources documentaires et manifests |
| `npm run docs:check` | Contrôle la cohérence documentaire, les fichiers/liens/imports et les copies distribuées |
| `npm run typecheck` | TypeScript strict sans émission : sources, application, exemples et tests |
| `npm test` | Tous les tests Vitest configurés dans `tests/` |
| `npm test -- tests/behaviors.test.tsx` | Tests de comportements et formulaires |
| `npm test -- tests/catalog.test.tsx` | Intégrité des inventaires, rendu SSR et icônes |
| `npm run build` | Reconstruit ESM/CJS, déclarations, CSS et catalogue |
| `node scripts/verify.mjs` | Contrôle les distributions construites, produit/installe les tarballs et écrit un rapport |
| `npm run verify` | Build, contrôle documentaire, typecheck, tests puis contrôle de distribution ; ne génère pas les composants |
| `npm run test:browser` | Contrôle Chromium d'un catalogue déjà servi |
| `npm run test:style` | Inter local, monochrome, 60 nouveaux aperçus et trois largeurs dans Chromium |
| `npm run pack:packages` | Crée les deux tarballs dans `artifacts/`, sans reconstruction |
| `npm run release:zip` | Archive les fichiers présents, contrôle CRC/chemins et écrit les empreintes |
| `node scripts/check-zips.mjs` | Extrait/installe les deux ZIP 0.2.0 dans un consommateur React 19.2.0 |

Le séparateur `--` transmet les arguments au script npm. Par exemple, `npm test -- tests/catalog.test.tsx` cible un fichier ; `npm run generate -- --lucide /chemin/lucide --tabler /chemin/tabler` transmet les deux options au générateur. Ne pas supposer de commandes `lint`, `format` ou `test:zip` dans `package.json`.

## Chaîne adaptée à une modification

Après modification d'une source de génération :

```sh
npm run generate
npm run verify
```

La génération inclut déjà la mise en forme et la production documentaire. Pour un fichier durable comme `internal/domain.tsx`, `styles.css` ou `create-icon.tsx`, la génération des composants n'est pas nécessaire si l'inventaire reste inchangé. Reconstruire toutefois les documents si un contrat ou un exemple a évolué.

Pour une modification uniquement documentaire :

```sh
npm run docs:build
npm run docs:check
```

Vérifier les commandes, props et exemples nouveaux contre les sources. Le contrôle documentaire compile les sections complètes « Exemple d’intégration » des fiches composants ; les autres blocs Markdown peuvent être des fragments et ne sont pas compilés intégralement. Utiliser `npm run typecheck` pour les exemples TSX inclus dans le dépôt, ou le typecheck d’un consommateur pour une intégration nouvelle. `docs:check` et les exemples utilisant des sous-chemins publics demandent un `dist` présent et cohérent : sur un checkout sans sorties compilées, exécuter d’abord `npm run build`. Dans les ZIP livrés, un rebuild est inutile pour du texte si sources/CSS et distributions sont inchangés.

Pour isoler une étape de code :

```sh
npm run build
npm run docs:check
npm run typecheck
npm test
node scripts/verify.mjs
```

Ne pas lancer `scripts/verify.mjs` avant un build après un changement de code : il importe `dist`, pas les TSX. `release:zip` n'est pas une validation des sorties ; il peut archiver un build ancien. Voir [RELEASING.md](RELEASING.md).

## Couverture réelle des contrôles

### Vitest et SSR

`tests/catalog.test.tsx` parcourt le manifeste UI et rend chaque composant avec ses fixtures et des callbacks de test. Il vérifie l'existence des exports, l'unicité des noms/chemins UI et l'absence d'exception au rendu serveur. Les portails sont rendus avec leurs déclencheurs : ce parcours ne signifie pas que toutes les fenêtres et tous leurs états ouverts sont testés.

Il parcourt aussi les icônes, vérifie la grille `0 0 24 24`, la taille `1em`, le comportement décoratif et l'unicité des géométries sérialisées du snapshot. Un test dédié vérifie les titres informatifs et leurs identifiants uniques.

`tests/behaviors.test.tsx` couvre notamment : bouton en chargement/ref, modale avec Échap et restitution du focus, thème/tokens de tiroir en portail, clavier des onglets, switch/checkbox, zéro numérique et entrée vide, mot de passe sans soumission, pagination, tags, tri numérique de table, thème SSR et notifications.

Un test paramétré soumet chacun des 108 formulaires avec les fixtures, contrôle le callback, le statut, l'absence d'`id` et zéro numérique. Il utilise `fireEvent.submit` : il ne démontre pas la validation native du navigateur, les erreurs serveur ou les règles métier propres au domaine. Les callbacks de filtres/réglages sont également vérifiés sur Invoice.

Le typecheck du dépôt est strict avec `skipLibCheck: true`. Les consommateurs de distribution relisent les déclarations avec `skipLibCheck: false`.

### Distribution ESM/CJS et consommateurs externes

`scripts/verify.mjs` :

- importe les index ESM/CJS et recherche chaque nom du manifeste ;
- vérifie l'existence des cibles d'exports explicites et des sous-chemins de chaque entrée ;
- vérifie la présence de `LICENSE`, `AGENTS.md` et `llms.txt` ;
- parse tous les SVG bruts par XML, contrôle leur `viewBox` et exige le nombre de fichiers déclaré par le manifeste ;
- construit un bundle ESM `Button` + `ArrowRightIcon`, avec React/ReactDOM/Radix externes, recherche certains exports inutilisés et impose moins de 10 000 caractères ;
- crée les tarballs puis les installe dans des dossiers temporaires avec React/ReactDOM 19.2.0 et 18.3.1, leurs types et TypeScript 5.9.3 ;
- type un consommateur strict, effectue un SSR et vérifie un sous-chemin CJS ;
- écrit `artifacts/distribution-results.json` après réussite de l'ensemble.

L'existence d'une déclaration ne valide pas toutes ses props. Le consommateur strict utilise des imports et composants représentatifs ; les sous-chemins sont contrôlés par présence des fichiers, tandis que les index et un exemple ciblé sont effectivement importés. Le script ne certifie pas tous les bundlers, versions TypeScript ou modes Next.js.

Relire aussi `LICENSE-LUCIDE`, `LICENSE-TABLER` et `NOTICE.md` avant livraison : le script ne vérifie pas leur contenu juridique. Le contrôle documentaire complète la présence/cohérence des fichiers de guides ; il ne remplace pas la validation runtime.

### Documentation

`scripts/documentation.mjs --check`, appelé par `npm run docs:check`, reconstruit en mémoire les sorties attendues depuis les manifests, les types lus par le parseur TypeScript et les guides source, puis les compare aux fichiers présents sans les réécrire. Il vérifie l'existence des cibles locales des liens Markdown produits. Les copies et agrégats IA doivent correspondre au texte actuel ; une différence fait échouer le contrôle.

`scripts/check-docs.mjs` complète ce contrôle : il examine les liens locaux des Markdown racine, guides et catalogues, parse les imports nommés `@mdevs/ui`/`@mdevs/icons` dans les blocs JS/TS/JSX/TSX et compare leurs noms aux symboles exportés des déclarations publiques. Il compile en mémoire les sections complètes « Exemple d’intégration » des 1 212 fiches UI en mode strict NodeNext/JSX, sans écrire de fichiers. Les blocs proposant plusieurs imports alternatifs ne sont pas compilés comme un seul module.

Ce contrôle utilise les `dist` présents ; un changement de code exige un build frais. Il n’exécute pas les imports au runtime, ne compile pas intégralement les autres fragments Markdown, ne vérifie pas les URL distantes, ancres internes ou liens du texte agrégé `llms-full.txt`. Il utilise `skipLibCheck: true` ; les consommateurs de distribution conservent leur vérification distincte avec `skipLibCheck: false`. La justesse métier, les interactions, la relecture et les contrôles de distribution restent distincts.

### ZIP

`release:zip` vérifie les CRC et la sécurité des chemins internes. `scripts/check-zips.mjs` installe les dossiers extraits avec `--install-links`, contrôle un SSR Dialog/Button/icône et la résolution CSS sous React 19.2.0. Il écrit `artifacts/zip-install-results.json`. Il ne teste pas tous les exports, les déclarations ni le navigateur.

Les noms d’archives sont calculés depuis la version racine par ce vérificateur ZIP. Une installation de tarball réussie ne dispense pas d'examiner un ZIP dont le contenu peut être différent.

## Catalogue dans Chromium

Préparer le navigateur :

```sh
npx playwright install chromium
```

Servir le catalogue dans un terminal :

```sh
npm run dev
```

Puis, dans un autre terminal, depuis la racine :

```sh
npm run test:browser
```

L'URL par défaut est `http://localhost:5173/`. Pour une autre URL, dans Bash :

```sh
MDEVS_PREVIEW_URL=http://localhost:4173/ npm run test:browser
```

Pour servir la sortie compilée après `npm run build` :

```sh
npm run preview --workspace @mdevs/catalog -- --port 4173
```

Le script analyse axe en clair/sombre, ouvre un aperçu `InvoiceForm`, recherche une icône, vérifie le débordement horizontal de page à 320, 375, 768 et 1 440 px, puis ouvre/ferme une fenêtre mobile. Il collecte les erreurs JavaScript et émule le mouvement réduit ; il ne vérifie pas l'ensemble des animations avec mouvement normal.

Les fichiers sont `artifacts/catalog-desktop.png`, `catalog-mobile.png`, `axe-results.json` et `browser-results.json`. Le dossier `artifacts/` doit exister : le script actuel ne le crée pas. Le contrôle de distribution, l'empaquetage ou l'archivage le créent normalement avant lui.

La couverture porte sur Chromium et ces parcours. Un résultat axe sans violation n'établit pas la conformité WCAG de toute composition. Ajouter les essais Safari/iOS, Firefox, tactile et lecteur d'écran nécessaires au public de l'application, puis nommer les environnements réellement testés.

## Matrice de vérification

| Changement | Contrôles adaptés | Complément avant livraison |
| --- | --- | --- |
| Guides/AGENTS seulement | `docs:build`, `docs:check`, relecture commandes/types/exemples | Tarballs/ZIP concernés et contenu documentaire ; pas de rebuild si code/CSS inchangés |
| Primitive dans `foundations.py` | Génération, typecheck, catalogue et comportements pertinents | Build/distribution ; navigateur si interaction, focus ou aspect change |
| Domaine ou règles UI | Génération, diff contrats/exports, catalogue/formulaires | Build/distribution ; navigateur représentatif ; vérifier les anciens fichiers après retrait/renommage |
| `internal/domain.tsx` | Typecheck, comportements/formulaires et catalogue ; examiner les dix familles | Build/distribution ; navigateur pour les interactions/largeurs touchées |
| CSS, tokens, thème/portails | Tests thème/portails si code ; clair/sombre/verre désactivé et mouvement réduit | Build/navigateur ; distribution si exports/packaging changent |
| Snapshot/catégorisation Icons | Génération, noms/géométries, provenance/licences et anciens fichiers | Build/distribution/XML ; essai visuel si rendu modifié |
| `create-icon.tsx` | Typecheck, titre/taille/décoration, appels générés | Build/distribution ; essai visuel représentatif |
| `package.json`, exports, build | Typecheck, build, cibles, ESM/CJS, déclarations et consommateurs | Distribution, tarballs, installation ZIP, CSS et licences |
| Catalogue interactif | Typecheck, build, recherche/aperçus et axe | Navigateur sur l'application servie |
| Nouvelle version/archives | Versions/manifests/noms ZIP, documentation, exclusions | Distribution adaptée, archive, installation ZIP et empreintes |

Préférer un test de comportement qui échouerait sur une régression réelle. Ne pas ajouter de tests recopiant du texte ou des classes pour une correction documentaire ou un changement visuel réversible. Une inspection ciblée et les vérifications existantes sont souvent suffisantes.

## Attacher les preuves au changement

Dans un compte rendu, préciser fichiers/changements contrôlés, commandes réellement exécutées, versions et résultats. Distinguer inspection des sources, test automatisé, essai visuel et installation externe. Nommer les étapes non exécutées au lieu de reprendre un ancien succès.

[VALIDATION_REPORT.md](VALIDATION_REPORT.md) conserve le bilan historique de livraison et ne se met pas à jour automatiquement. Les JSON/captures dans `artifacts/` peuvent être anciens ou partiels. `browser-results.json` est écrit tard dans le parcours ; un échec plus précoce peut laisser un ancien rapport en place.

Un SSR sans exception ne démontre pas l'hydratation ; Chromium ne démontre pas Safari ; une installation React 18 ne démontre pas la suite interactive sous React 18. Le résultat reste attaché à la version et au contexte examinés.


## Vérification du style 0.2.0

`tests/extensions.test.tsx` couvre les interactions ajoutées : combobox au clavier, édition et focus, listes dynamiques, sélection de page, cellules éditables, minuteur, retour de focus du dialogue et contrat des assets Inter. Les tests d’inventaire comptent 1 212 composants et 2 600 icônes ; actualiser ces attentes après une extension réelle.

Avec le catalogue compilé servi sur `http://localhost:5173`, `npm run test:style` charge la fonte Inter, vérifie son rendu effectif via Chromium, les couleurs noir/blanc sous thème et sans CSS UI, et les tailles 16/20/24/32/48 px. Il parcourt les 60 nouveaux aperçus dans leur état initial, contrôle axe WCAG A/AA en clair et les limites de fenêtre à 320/375/1 440 px, puis exerce Combobox et SelectableTable. Le rapport est `artifacts/style-results.json` ; la planche des 500 ajouts est `artifacts/icons-monochrome.png`. La planche permet une revue visuelle, pas une mesure d’originalité artistique. Les états ouverts, autres interactions et combinaisons personnalisées demandent leurs propres essais. Aucun contrôle Safari, Firefox ou lecteur d’écran n’est revendiqué.

Le script de style suppose le snapshot de comparaison fourni avec le dépôt dans `scripts/data/release-0.1.0-baseline.json`, pour identifier les 500 ajouts. Il utilise `MDEVS_PREVIEW_URL` si défini.
