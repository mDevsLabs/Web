# Périmètre et limites — version 0.2.0

Les packages fournissent des rendus React, des contrats TypeScript et une présentation CSS/SVG. L’application possède ses données, ses services, sa validation métier et ses autorisations. Cette page aide à choisir un composant et à prévoir le travail d’intégration, sans déduire de capacité supplémentaire de son nom de domaine.

## Inventaire et indépendance

| Élément | Contenu livré | Conséquence d’intégration |
| --- | --- | --- |
| UI | 1 212 exports nommés : 132 primitives et 1 080 composants métier | Chaque composant dispose d’un module et d’un contrat importables séparément |
| Domaines | 108 domaines, dix familles de rendu par domaine | Les modèles/configurations changent ; le moteur de chaque famille est partagé |
| Icônes | 2 600 géométries normalisées distinctes | Tailles, couleurs et épaisseurs ne créent pas de nouvelles entrées |
| Catalogue interactif | Recherche, fixtures et prévisualisations | Les fixtures sont fictives et ne constituent pas un contrat réseau |
| Distribution | ESM, CommonJS, `.d.ts`, sources, CSS/SVG, catalogues et guides | Installer les dossiers ou tarballs locaux ; aucune publication npm n’est effectuée |

L’indépendance d’import ne signifie pas une implémentation sans dépendance interne : les domaines réutilisent les fonctions `Domain*`, les interactions avancées utilisent Radix et les icônes utilisent `createIcon`. `@mdevs/ui` ne dépend pas de `@mdevs/icons`, et les icônes seules ne demandent pas la feuille CSS UI.

Les domaines santé, finance, sécurité et commerce décrivent des interfaces génériques. Leurs composants ne réalisent pas de diagnostic, traitement de paiement, calcul fiscal, vérification d’identité ou contrôle d’autorisation. Valider ces règles dans les services et dans l’application hôte.

## Données et interactions

| Sujet | Comportement actuel | Travail du projet hôte |
| --- | --- | --- |
| Formulaires métier | Contrôles HTML natifs, collecte `FormData`, conversion des nombres et callback `onSubmit` | Valider plages/dépendances/statuts, gérer erreurs, réseau et sauvegarde |
| Édition | `initialValues` fournit les valeurs initiales au montage | Remonter le formulaire avec une `key` distincte pour un autre enregistrement ou composer une édition contrôlée |
| Filtres | Valeurs contrôlées et callbacks | Filtrer/rechercher les collections, temporiser les requêtes si nécessaire |
| Table | Affichage et tri local | Pagination serveur, export, sélection avancée et virtualisation selon besoin |
| Liste | Affichage et sélection facultative | Actualiser la sélection, charger les données et définir les actions |
| Statistiques | Affichage des métriques reçues | Calculer les agrégats et garantir leurs unités/périodes |
| Timeline | Ordre reçu et dates sous forme de chaînes | Trier, localiser et choisir des valeurs `dateTime` valides |
| Réglages | Collection contrôlée et `onChange(key, value)` | Mettre à jour l’état puis persister les préférences |
| Fichiers et progression | Sélection locale ou affichage de progression | Transfert, stockage, contraintes serveur et annulation réseau |
| Confirmation | `ConfirmDialog` ferme immédiatement lors de la confirmation | Utiliser `Dialog` contrôlé si une opération doit maintenir la fenêtre ouverte |
| Palette | Filtre local des actions et déclenchement de callbacks | Installer ses raccourcis globaux et définir la navigation |

Un type TypeScript, un cast ou une option HTML ne valide pas une réponse JSON reçue à l’exécution. Les conversions des formulaires ne garantissent pas à elles seules un nombre fini ni une règle métier. Les montants ne sont pas convertis entre devises ; les tables métier affichent principalement les valeurs reçues. Utiliser les primitives ou des adaptateurs lorsque le formatage requis dépasse la configuration fournie.

Les tables n’incluent pas de virtualisation, redimensionnement de colonnes, export CSV automatique ni pagination serveur. Aucune taille de collection maximale validée n’est publiée. Mesurer les volumes réels de l’application avant de rendre de grandes listes.

## Personnalisation et environnement

Les libellés de configuration métier sont en français et les codes de statuts en anglais. La version 0.2.0 ne fournit pas de changement de locale global par domaine. Plusieurs primitives acceptent leurs libellés en props ; pour modifier durablement les textes de domaine, adapter la source de configuration et régénérer, ou composer une interface dédiée.

Le Liquid Glass utilise translucence, flou, bordures, dégradés et ombres CSS. Il ne simule pas une réfraction optique physique. Le contraste dépend du fond de l’application. Le support de `backdrop-filter`, la performance GPU et les réglages utilisateur varient selon le navigateur/appareil ; le fond opaque de secours et `glass={false}` doivent aussi être vérifiés dans le projet.

`ThemeProvider` configure une portée ; un provider imbriqué conserve ses propres valeurs par défaut. Les portails reprennent les tokens CSS transmis par le contexte, pas tous les styles arbitraires du conteneur. Une application avec un système de z-index, une autre librairie de modales ou un thème global doit vérifier les interactions. Les wrappers d’overlay n’exposent pas toutes les options Radix, notamment le conteneur de portail et les callbacks de gestion fine du focus.

React 18.3/19 est déclaré dans les peer dependencies. Le dépôt de développement exige Node 22.12+ ; le champ moteur des packages est Node 18+. Une installation de dossier local peut télécharger les dépendances/peers manquantes. Aucun résultat général d’intégration à tous les bundlers ou frameworks SSR n’est revendiqué.

## SVG, provenance et accessibilité

Les dessins viennent de Lucide et Tabler ; les licences et notices originales sont conservées. Ils ne sont pas présentés comme 2 600 dessins originaux Mdevs. La grille de base est `24 × 24`. Réduire fortement une icône ou changer `strokeWidth` peut affecter sa lisibilité et demande une inspection visuelle.

Les props SVG natives sont transmises après les valeurs calculées du wrapper et peuvent les remplacer. Les enfants SVG personnalisés ne reçoivent pas automatiquement `vectorEffect` via `absoluteStrokeWidth`. Aucun retournement RTL automatique, loader SVGR ou déclaration d’asset SVG universelle n’est fourni. Un SVG externe rendu avec `<img>` ne récupère pas la couleur du parent comme le SVG React inline.

Le wrapper fournit des défauts décoratifs/informatifs ; le nom d’un bouton, la taille de sa zone tactile et le lien entre label/champ restent à définir. `TreeView` utilise des listes et `details/summary`, sans contrat de navigation ARIA `tree`. La palette expose des boutons filtrés, sans navigation spécialisée par touches fléchées. Choisir les primitives et les comportements adaptés aux besoins d’accessibilité du produit.

## Portée des preuves

Les vérifications initiales ont couvert TypeScript, 120 tests, tous les exports UI en rendu serveur, les 2 100 SVG, les distributions et des consommateurs React 18/19. Les contrôles d’interaction et axe portent sur des parcours du catalogue dans Chromium. Ils ne démontrent pas l’accessibilité de toute composition, ni tous les états ouverts, lecteurs d’écran ou navigateurs.

Les guides Markdown, imports nommés et exemples complets ont des contrôles documentaires dédiés. Ces contrôles ne mesurent ni contraste, ni fonctionnement clavier, ni performance. Distinguer les résultats historiques du runtime des vérifications exécutées pour une modification documentaire. Lire [le rapport de livraison](VALIDATION_REPORT.md) et [le guide de vérification](TESTING.md) pour leur périmètre exact.

## Maintenance

La génération reconstruit les fichiers dérivés et ne nettoie pas automatiquement tous les anciens modules/documents après un retrait ou renommage. Le build nettoie `dist`, mais compile les fichiers encore présents dans `src`. Examiner les sorties obsolètes explicitement. Les catalogues et notices doivent rester cohérents avec les exports et géométries.

Le seuil de sélection des géométries et des tests de livraison fixent encore des décomptes attendus. Un changement de version ou d’inventaire nécessite leur examen ; il ne suffit pas de changer un seul `package.json`. Les documents générés se reconstruisent depuis leurs sources et ne doivent pas être corrigés seulement dans un ZIP.

Pour approfondir : [contrats API](API.md), [formulaires](FORM_PATTERNS.md), [overlays](OVERLAYS.md), [icônes](ICONS.md), [accessibilité](ACCESSIBILITY.md) et [publication/versionnement](RELEASING.md).


La livraison 0.2.0 relance 147 tests, le contrôle documentaire, les distributions React 18/19 et les essais Chromium. Les 60 aperçus ajoutés sont contrôlés dans leur état initial ; les nouveaux parcours clavier et sélection restent ciblés. Consulter [VALIDATION_REPORT.md](VALIDATION_REPORT.md) pour distinguer ces résultats des preuves historiques.
