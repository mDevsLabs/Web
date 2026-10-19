# Diagnostic et résolution des problèmes

Identifier d'abord le contexte : monorepo, dossier extrait d'un ZIP, tarball installé ou application consommatrice. Les commandes de génération, documentation et validation appartiennent au monorepo. Un package isolé fournit sources, sorties et guides, sans les workspaces ni l'outillage racine.

Garder le message exact, versions du package/React/Node, import utilisé et exemple minimal. Manifeste, `package.json` et déclarations priment sur un nom supposé. Voir [AI_AGENTS.md](AI_AGENTS.md).

## Installation et résolution

| Symptôme | Diagnostic et correction |
| --- | --- |
| `Missing script: generate`, `docs:build` ou `verify` | Vérifier le dossier courant et la version du dépôt. Ces scripts appartiennent au `package.json` racine ; un ZIP isolé ne permet pas la maintenance complète. |
| Erreur de moteur Node dans le dépôt | Utiliser Node ≥ 22.12.0 pour Vite et les scripts employant `import.meta.dirname`. Le minimum Node des packages est différent. |
| ZIP refusé par npm | Extraire le ZIP, puis installer le dossier `mdevs-ui`/`mdevs-icons` ; ce n'est pas un tarball npm. |
| React/Radix introuvable après installation locale | Depuis l'application, utiliser `npm install --install-links /chemin/mdevs-ui /chemin/mdevs-icons`. Ne pas déplacer les dossiers à la main dans `node_modules`. |
| `Invalid hook call` | Examiner `npm ls react react-dom` dans le projet hôte, peers et liens locaux. Les packages attendent React 18.3.1 ou React 19 compatible ; UI attend aussi ReactDOM. Corriger les résolutions multiples/incohérentes. |
| `ERR_PACKAGE_PATH_NOT_EXPORTED` | Lire `exports` et le champ `import` du manifeste. Éviter `src`, `internal` et les noms issus d'autres bibliothèques. |
| Module `dist` absent | Dans le dépôt, construire après génération. Dans une installation, vérifier les sorties incluses et utiliser une archive complète. |
| Nom Lucide/Tabler introuvable | La sélection n'est pas l'intégralité des bibliothèques amont. Chercher le nom exact, suffixe `Icon` inclus. |
| `verify` échoue à installer les consommateurs | Lire l'erreur npm : registre, proxy, réseau, cache ou peers. Génération locale et installation de dépendances n'ont pas les mêmes besoins. |

Dans le dépôt :

```sh
npm run catalog:find -- invoice
npm run catalog:find -- search --icons
```

La recherche affiche au maximum 30 résultats avec un total. Affiner le terme ou lire le manifeste pour un résultat au-delà de cette limite. Dans une installation, lire `catalog/manifest.json` ou son export `@mdevs/ui/catalog`/`@mdevs/icons/catalog` plutôt que chercher des scripts absents.

ESM choisit `.js`, `require` choisit `.cjs`. Ne pas renommer ces sorties ou modifier les chemins CJS dans `dist` : leur transformation appartient au build. Reproduire une erreur d'exports dans un consommateur externe avec les tarballs, plutôt que seulement dans les sources du workspace.

## Styles, thèmes et portails

| Symptôme | Vérification et correction |
| --- | --- |
| Composants sans style | Importer `@mdevs/ui/styles.css` une fois au niveau racine et vérifier le traitement CSS du bundler. Un SSR Node ne charge pas de CSS visuel. |
| CSS absent ou ancien | Examiner l'export `./styles.css`, `dist/styles.css` et la version installée. Un CSS source modifié demande un rebuild avant packaging. |
| Thème différent en modale/tiroir | Utiliser ThemeProvider et ses surcharges `style`. Les variables d'un ancêtre DOM arbitraire ne traversent pas automatiquement un portail. |
| Mode `system` différent selon l'appareil | Vérifier les préférences du navigateur ; utiliser `theme="light"`/`"dark"` pour isoler les tokens. |
| Verre imperceptible | Vérifier fond derrière la surface, transparence, support de `backdrop-filter` et prop `glass`. L'effet subtil ne simule pas une réfraction physique. |
| Contraste insuffisant | Tester clair/sombre, fonds hôtes et flou désactivé ; ajuster les tokens documentés et vérifier les portails. |
| Débordement mobile | Distinguer défilement local d'une table et débordement de page. Examiner largeurs fixes/textes longs du projet hôte ; le test du catalogue ne couvre pas l'écran métier. |

Voir [LIQUID_GLASS.md](LIQUID_GLASS.md) et [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Données, formulaires et callbacks

**Une action ne change pas les données.** Connecter le callback au state/service hôte. `query`, `status` ou `values` contrôlés doivent être mis à jour par l'application. Les composants ne chargent ni ne persistent une API automatiquement.

**Le formulaire ne suit pas une nouvelle sélection.** Les formulaires métier initialisent leurs champs avec `initialValues` et `defaultValue`. Cette prop n'est pas un modèle contrôlé. Pour afficher un autre objet, examiner une remonte par une clé stable d'objet, ou un formulaire contrôlé construit avec les primitives. Ne pas promettre une synchronisation absente du contrat.

**Zéro disparaît dans l'application.** Examiner conversions et conditions hôtes : `value || fallback` remplace zéro, contrairement à `value ?? fallback`. Les tests fournis couvrent zéro pour NumberInput et formulaires métier. Garder les types numériques attendus.

**Une date change de jour.** Un champ HTML `date` attend `YYYY-MM-DD`. Éviter une conversion UTC involontaire d'une date locale en instant. La bibliothèque ne fournit pas une gestion complète des fuseaux.

**La validation métier manque.** Les formulaires utilisent les contraintes HTML et TypeScript. TypeScript ne valide pas une réponse réseau à l'exécution, et `schema.json` du catalogue n'est pas un validateur. Ajouter règles/validation serveur et messages d'erreur dans l'application.

**Un statut, une métrique ou clé de réglage est refusé.** Lire les types propres au domaine, sans élargir avec `any`. Pour changer le contrat de la bibliothèque, modifier `scripts/data/domains.txt`, régénérer et décrire la migration.

**Un bouton soumet involontairement.** Vérifier son `type`, son placement dans le formulaire et les déclencheurs interactifs. Préserver les comportements natifs du contrat et éviter les boutons imbriqués.

## Icônes : taille, couleur et nom accessible

Les composants React acceptent `size` en nombre ou longueur CSS, par exemple `18` ou `"1em"`. La grille interne reste 24 × 24. `currentColor` suit la couleur CSS ; `1em` suit la taille de texte environnante. En cas d'étirement, examiner les règles hôtes imposant séparément largeur et hauteur.

Une icône décorative est cachée des technologies d'assistance. Pour une icône informative, utiliser `title` ou les attributs de `IconProps`. Un bouton sans texte visible doit avoir un nom accessible explicite sur le bouton ; le titre SVG ne remplace pas toujours le nom de l'action.

SVG bruts et composants React n'ont pas le même contrat de props. Conserver les notices lors d'une copie de SVG vers une autre distribution. Voir [ICONS.md](ICONS.md).

## Génération et fichiers obsolètes

| Symptôme | Cause et résolution |
| --- | --- |
| Une correction TSX disparaît | Fichier généré édité directement. Modifier `foundations.py`, `domains.txt`, les règles ou le rendu partagé durable. |
| Ancien domaine/icône dans le ZIP | Le générateur n'efface pas ses anciennes sorties. Comparer manifeste/dossiers, retirer les fichiers identifiés et reconstruire. |
| Nombre de SVG différent du manifeste | Sélection changée ou anciennes sorties. Ne pas masquer des fichiers résiduels en changeant seulement le compteur. |
| `Identifier collision` Icons | Plusieurs slugs produisent le même PascalCase. Examiner noms et sélection ; conserver géométrie distincte et stabilité des imports. |
| Types/index UI dupliqués | Examiner domaines/primitives, slugs, clés `id`/`status` et exports globaux. Toutes les collisions ne sont pas rejetées avant écriture. |
| Erreur de découpage d'un domaine | Garder cinq sections `|` et les séparateurs de champs/statuts. Aucun échappement ni commentaire libre n'est prévu. |
| Option amont ignorée | Fournir `--lucide` et `--tabler` ensemble, après `npm run generate --`. Une seule option utilise le snapshot actuel. |
| Manifeste dans une ancienne version | Le générateur lit les package.json ; aligner les métadonnées puis régénérer. |
| TypeScript introuvable pendant `generate` | La mise en forme finale importe `typescript`. Installer les dépendances racine ; Python seul ne suffit pas. |

Une génération échouée peut avoir écrit partiellement ses sorties. Examiner le diff avant relance. Ne pas effacer tout `src` : les moteurs internes et `create-icon.tsx` ne sont pas émis par le générateur. Voir [ARCHITECTURE.md](ARCHITECTURE.md).

## Documentation dérivée et contrôle des liens

**Un nouveau guide manque dans le package.** Depuis le monorepo, lancer `npm run docs:build` puis `npm run docs:check`. Les guides source de `docs/` doivent être copiés dans les deux `catalog/docs/` avant tarballs/ZIP. Examiner aussi les entrées propres aux packages et les agrégats `llms-full.txt`.

**Une fiche détaillée redevient ancienne.** Modifier sa source ou la règle dans `scripts/documentation.mjs`, pas seulement une sortie générée. Une modification du manifeste sans reconstruction documentaire peut rendre imports/comptages incohérents.

**Le contrôle d'un lien échoue.** Vérifier le fichier relatif au document qui contient le lien. Les guides communs doivent pouvoir vivre aussi dans `catalog/docs/` : un lien vers un script racine n'est pas valide dans le package isolé. Citer un chemin de monorepo en code et l'expliquer ; relier les guides voisins par leur nom relatif.

**Un exemple passe le contrôle documentaire, mais échoue en TypeScript.** Ce contrôle inspecte la structure documentaire ; il ne compile pas les blocs Markdown. Typer l'exemple dans les fichiers TSX de `examples/` ou un consommateur conforme au framework cible. Lire les props dans les sources/.d.ts.

## Build, tests et navigateur

**Les tests passent, l'import installé échoue.** Vitest lit les sources. Construire puis contrôler `scripts/verify.mjs`, qui examine `dist` et les tarballs. Pour les ZIP, ajouter leur contrôle spécifique après archivage.

**Chromium ne démarre pas.** Installer `npx playwright install chromium` et lire l'erreur d'environnement. Le contrôle vise Chromium : aucune preuve Safari/Firefox n'en découle.

**Le test cherche le mauvais port.** Son URL par défaut est `http://localhost:5173/`. Servir le catalogue avant de lancer le contrôle et définir `MDEVS_PREVIEW_URL` sur l'adresse réelle. Le test ne démarre pas le serveur.

**Une capture échoue : dossier absent.** Le navigateur ne crée pas `artifacts/`. Depuis la racine, `mkdir -p artifacts`, puis relancer. Distribution/archivage créent aussi ce dossier.

**Un rapport affiche encore un ancien succès.** Les scripts ne suppriment pas tous les rapports au démarrage. Examiner sortie de commande et fraîcheur des fichiers ; un échec précoce peut laisser `browser-results.json` ancien. Ne pas l'utiliser comme nouvelle preuve.

**Axe échoue sur le catalogue.** Lire `artifacts/axe-results.json`/`browser-results.json`, reproduire thème et nœud, puis corriger la source durable. Une absence de violation sur le parcours ne démontre pas toute l'accessibilité de chaque composition. Voir [TESTING.md](TESTING.md).

## Archives et livraison

**Le ZIP contient un code ancien.** `release:zip` archive les fichiers présents ; il ne génère ni ne compile. Exécuter les étapes nécessaires puis refaire les archives. Les dates internes ZIP sont fixes : comparer contenu et empreintes.

**Le contrôle ZIP ouvre une ancienne version.** Vérifier package.json racine, la dernière exécution d’archive.py et les fichiers artifacts ; les noms du contrôleur suivent maintenant la version racine.

**Le lien de téléchargement contient une ancienne copie.** Les scripts écrivent dans `artifacts/`. Remplacer toute copie externe depuis les sorties finales puis vérifier son empreinte. Les fichiers `SHA256SUMS.txt` et `release-manifest.json` sont produits après archivage, sans incorporation automatique dans chaque ZIP.

**Un chemin `scripts/` manque dans le package isolé.** Les guides couvrent aussi la maintenance du monorepo. Un chemin cité en code désigne le dépôt complet ; utiliser son ZIP pour modifier ces fichiers. Les guides voisins restent accessibles dans `catalog/docs/`.

La procédure de livraison et les attributions à conserver sont dans [RELEASING.md](RELEASING.md).
