# Extensions 0.2.0 — composants et contrats

Cette version ajoute 100 composants et 500 icônes : 60 primitives nouvelles et 40 compositions provenant de quatre modèles. Les inventaires complets sont les manifests des packages. Le style est défini dans [STYLE.md](STYLE.md) et les méthodes d’agent dans [AI_AGENTS.md](AI_AGENTS.md).

## Utiliser une nouvelle primitive

Les imports sont publics sous `@mdevs/ui/primitives/<slug>` ou depuis la racine. Charger `@mdevs/ui/styles.css` une fois : il inclut Inter locale et les styles des extensions. Les valeurs contrôlées exigent une mise à jour du parent ; les callbacks de prévisualisation n’appellent pas un service.

Les fiches sous `catalog/components/primitives` exposent types, callbacks, comportement, fixture et exemple complet. Leurs props et descriptions sont extraites des sources. Les chemins cités ici sont relatifs au package installé ; les sources durables de création sont `scripts/extensions.py` dans le monorepo.

## Formulaires et saisie — 20 composants

| Export | Usage | Import ciblé | État contrôlé |
| --- | --- | --- | --- |
| `FormSection` | Groupe de champs avec légende et aide commune. | `@mdevs/ui/primitives/form-section` | Lire le contrat de la fiche |
| `FormActions` | Actions de formulaire et message de sauvegarde regroupés. | `@mdevs/ui/primitives/form-actions` | Lire le contrat de la fiche |
| `FormErrorSummary` | Résumé des erreurs avec liens vers les champs concernés. | `@mdevs/ui/primitives/form-error-summary` | Lire le contrat de la fiche |
| `ClearableInput` | Saisie contrôlée avec effacement et restitution du focus. | `@mdevs/ui/primitives/clearable-input` | value → onValueChange |
| `CharacterCountTextarea` | Texte contrôlé, limite native et compteur lié au champ. | `@mdevs/ui/primitives/character-count-textarea` | value → onValueChange |
| `NumberStepper` | Nombre contrôlé avec incrément, décrément et bornes explicites. | `@mdevs/ui/primitives/number-stepper` | value → onValueChange |
| `Combobox` | Choix recherchable avec navigation clavier et liste ARIA. | `@mdevs/ui/primitives/combobox` | value → onValueChange |
| `MultiSelect` | Sélection multiple native avec résumé et choix indépendants. | `@mdevs/ui/primitives/multi-select` | value → onValueChange |
| `ChoiceCards` | Choix radio détaillés sous forme de cartes sélectionnables. | `@mdevs/ui/primitives/choice-cards` | value → onValueChange |
| `DateRangeInput` | Dates de début et fin avec bornes natives coordonnées. | `@mdevs/ui/primitives/date-range-input` | value → onValueChange |
| `RangePairInput` | Deux bornes numériques avec curseurs natifs coordonnés. | `@mdevs/ui/primitives/range-pair-input` | value → onValueChange |
| `OtpInput` | Code à usage unique avec filtrage numérique et autofill natif. | `@mdevs/ui/primitives/otp-input` | value → onValueChange |
| `PasswordRequirements` | Règles de mot de passe visibles et calculées localement. | `@mdevs/ui/primitives/password-requirements` | Lire le contrat de la fiche |
| `EditableText` | Édition inline avec validation, annulation et retour du focus. | `@mdevs/ui/primitives/editable-text` | value → onCommit |
| `FieldArray` | Collection de valeurs textuelles avec ajout et suppression. | `@mdevs/ui/primitives/field-array` | value → onValueChange |
| `KeyValueEditor` | Paires clé/valeur contrôlées avec validation de clés uniques. | `@mdevs/ui/primitives/key-value-editor` | value → onValueChange |
| `ConsentField` | Consentement requis et contenu de conditions lié au contrôle. | `@mdevs/ui/primitives/consent-field` | checked → onCheckedChange |
| `SearchField` | Formulaire de recherche explicite avec envoi et effacement. | `@mdevs/ui/primitives/search-field` | value → onValueChange |
| `FileDropzone` | Sélection clavier ou dépôt de fichiers avec contrôle local de taille. | `@mdevs/ui/primitives/file-dropzone` | Lire le contrat de la fiche |
| `DualListSelector` | Transfert de choix entre deux listes natives multisélection. | `@mdevs/ui/primitives/dual-list-selector` | value → onValueChange |

## Navigation — 10 composants

| Export | Usage | Import ciblé | État contrôlé |
| --- | --- | --- | --- |
| `SkipLink` | Lien d’évitement visible au focus vers le contenu principal. | `@mdevs/ui/primitives/skip-link` | Lire le contrat de la fiche |
| `AppHeader` | En-tête applicatif avec marque, navigation et actions. | `@mdevs/ui/primitives/app-header` | Lire le contrat de la fiche |
| `PageHeader` | Titre de page, contexte de navigation et actions principales. | `@mdevs/ui/primitives/page-header` | Lire le contrat de la fiche |
| `SidebarNavigation` | Navigation verticale avec sections et route courante explicite. | `@mdevs/ui/primitives/sidebar-navigation` | Lire le contrat de la fiche |
| `AnchorNavigation` | Sommaire d’ancres nommé avec indication de section active. | `@mdevs/ui/primitives/anchor-navigation` | Lire le contrat de la fiche |
| `MobileNavigation` | Menu compact en dialogue avec fermeture après choix d’un lien. | `@mdevs/ui/primitives/mobile-navigation` | Lire le contrat de la fiche |
| `PageSizeSelect` | Nombre de lignes par page contrôlé avec options explicites. | `@mdevs/ui/primitives/page-size-select` | value → onValueChange |
| `NextPreviousNavigation` | Navigation vers les documents précédents et suivants. | `@mdevs/ui/primitives/next-previous-navigation` | Lire le contrat de la fiche |
| `WorkspaceSwitcher` | Sélection d’espace de travail avec description du choix actif. | `@mdevs/ui/primitives/workspace-switcher` | value → onValueChange |
| `ScrollToTopButton` | Retour en haut conditionnel respectant le mouvement réduit. | `@mdevs/ui/primitives/scroll-to-top-button` | Lire le contrat de la fiche |

## Tables et données — 12 composants

| Export | Usage | Import ciblé | État contrôlé |
| --- | --- | --- | --- |
| `SelectableTable` | Table avec sélection contrôlée et sélection de la page visible. | `@mdevs/ui/primitives/selectable-table` | selectedIds → onSelectionChange |
| `ExpandableTable` | Table avec détails de ligne dépliables et état contrôlé. | `@mdevs/ui/primitives/expandable-table` | expandedIds → onExpandedChange |
| `EditableTable` | Cellules textuelles contrôlées avec labels par ligne et colonne. | `@mdevs/ui/primitives/editable-table` | value → onValueChange |
| `ColumnVisibilityMenu` | Choix des colonnes affichées à transmettre à une table. | `@mdevs/ui/primitives/column-visibility-menu` | visibleKeys → onVisibilityChange |
| `FilterChips` | Filtres actifs supprimables et réinitialisation globale. | `@mdevs/ui/primitives/filter-chips` | Lire le contrat de la fiche |
| `FacetFilter` | Facette contrôlée avec comptages et choix multiples. | `@mdevs/ui/primitives/facet-filter` | value → onValueChange |
| `SearchResults` | Liste de résultats nommés avec extrait et liens réels. | `@mdevs/ui/primitives/search-results` | Lire le contrat de la fiche |
| `ResultSummary` | Résumé de la plage visible et du nombre total de résultats. | `@mdevs/ui/primitives/result-summary` | Lire le contrat de la fiche |
| `PropertyGrid` | Propriétés regroupées en sections avec descriptions sémantiques. | `@mdevs/ui/primitives/property-grid` | Lire le contrat de la fiche |
| `ComparisonTable` | Comparaison d’offres avec en-têtes de lignes et de colonnes. | `@mdevs/ui/primitives/comparison-table` | Lire le contrat de la fiche |
| `BarChart` | Barres proportionnelles accompagnées d’une liste de valeurs accessible. | `@mdevs/ui/primitives/bar-chart` | Lire le contrat de la fiche |
| `Sparkline` | Tendance SVG compacte avec résumé et valeurs textuelles accessibles. | `@mdevs/ui/primitives/sparkline` | Lire le contrat de la fiche |

## États et retours — 10 composants

| Export | Usage | Import ciblé | État contrôlé |
| --- | --- | --- | --- |
| `DismissibleNotice` | Message de contexte refermable avec intention de fermeture explicite. | `@mdevs/ui/primitives/dismissible-notice` | Lire le contrat de la fiche |
| `ErrorPanel` | Erreur persistante avec diagnostic optionnel sous details. | `@mdevs/ui/primitives/error-panel` | Lire le contrat de la fiche |
| `RetryPanel` | Échec de chargement avec relance et attente contrôlées. | `@mdevs/ui/primitives/retry-panel` | Lire le contrat de la fiche |
| `BusyRegion` | Région nommée avec état occupé et annonce de chargement. | `@mdevs/ui/primitives/busy-region` | Lire le contrat de la fiche |
| `SavingIndicator` | État de sauvegarde textuel sans déduire de succès réseau. | `@mdevs/ui/primitives/saving-indicator` | Lire le contrat de la fiche |
| `ConnectionBanner` | Connectivité fournie par le parent avec relance optionnelle. | `@mdevs/ui/primitives/connection-banner` | Lire le contrat de la fiche |
| `Countdown` | Compte à rebours local avec nettoyage du timer au démontage. | `@mdevs/ui/primitives/countdown` | Lire le contrat de la fiche |
| `Announcer` | Région live persistante pour les annonces applicatives. | `@mdevs/ui/primitives/announcer` | Lire le contrat de la fiche |
| `UndoNotice` | Résultat d’action avec annulation et fermeture fournies par le parent. | `@mdevs/ui/primitives/undo-notice` | Lire le contrat de la fiche |
| `SessionTimeoutPrompt` | Dialogue d’expiration contrôlé avec continuer et se déconnecter. | `@mdevs/ui/primitives/session-timeout-prompt` | open → onOpenChange |

## Structure et médias — 8 composants

| Export | Usage | Import ciblé | État contrôlé |
| --- | --- | --- | --- |
| `AppShell` | Structure applicative avec header, navigation et contenu principal nommé. | `@mdevs/ui/primitives/app-shell` | Lire le contrat de la fiche |
| `SplitPane` | Deux panneaux avec largeur contrôlée par un curseur clavier natif. | `@mdevs/ui/primitives/split-pane` | value → onValueChange |
| `MasterDetail` | Liste de sélection et panneau de détail avec état vide explicite. | `@mdevs/ui/primitives/master-detail` | selectedId → onSelectionChange |
| `BentoGrid` | Grille de cartes éditoriales avec spans et ordre DOM conservé. | `@mdevs/ui/primitives/bento-grid` | Lire le contrat de la fiche |
| `StickyActions` | Barre d’actions persistante dans le flux de défilement. | `@mdevs/ui/primitives/sticky-actions` | Lire le contrat de la fiche |
| `ScrollArea` | Région défilante nommée, focusable et bornée en hauteur. | `@mdevs/ui/primitives/scroll-area` | Lire le contrat de la fiche |
| `CodeBlock` | Bloc de code sélectionnable avec copie et gestion d’erreur locale. | `@mdevs/ui/primitives/code-block` | Lire le contrat de la fiche |
| `ImageGallery` | Galerie avec image active, miniatures et alternatives textuelles. | `@mdevs/ui/primitives/image-gallery` | value → onValueChange |

## Quatre nouveaux modèles — 40 compositions

| Modèle | Domaine public | Données principales | Limite |
| --- | --- | --- | --- |
| FormSubmission | @mdevs/ui/form-submission | Référence, formulaire, auteur, date, nombre de champs | Aucun moteur de collecte ou contrôle d’accès fourni |
| SavedFilter | @mdevs/ui/saved-filter | Nom, query, propriétaire, résultats et date | Les critères et requêtes sont appliqués par l’application |
| RouteDefinition | @mdevs/ui/route-definition | Nom, path, section, priorité et date | Aucun routeur ou permission de route installé |
| TablePreset | @mdevs/ui/table-preset | Nom, propriétaire, colonnes, taille de page et date | Aucun stockage ou transformation de table implicite |

Chaque modèle fournit Overview/Card/List/Table/Form/Filters/Timeline/Stats/EmptyState/Settings. Les unions de statuts, métriques et réglages sont dans son module public de types. Ces dix familles partagent les rendus métier existants ; elles ne sont pas présentées comme quarante inventions visuelles.

## Choisir une interaction réelle

- Recherche locale de choix : Combobox ; choix multiples : MultiSelect ou DualListSelector selon le flux clavier attendu.
- Saisie répétée : FieldArray ; métadonnées : KeyValueEditor. Conserver les id au fil des éditions.
- Sélection/édition de données : SelectableTable, ExpandableTable ou EditableTable. Les tables restent natives, sans contrat ARIA spreadsheet.
- Filtres : FacetFilter et FilterChips ; le parent calcule les résultats ou appelle son service.
- Enregistrement : SavingIndicator, RetryPanel, ErrorPanel ou UndoNotice reçoivent l’état et les actions du parent.
- Fenêtre de session : SessionTimeoutPrompt reçoit l’état contrôlé, une échéance calculée ailleurs et les callbacks de service. Countdown n’est pas une horloge de sécurité.
- Mise en page : AppShell à la racine, MasterDetail pour une consultation, SplitPane pour une proportion réglable au clavier.

La combobox conserve le focus sur l’input, saute les choix désactivés, ferme avec Escape et choisit via Entrée. Elle est locale, sans portail ni virtualisation ; un parent avec overflow peut couper son popup. Ne pas promettre une navigation de touches fléchées aux listes qui n’implémentent pas ce contrat.

EditableTable édite des chaînes ; id demeure protégé et les nombres sont convertis/validés dans l’application. SelectableTable conserve les sélections d’autres pages et sa case d’en-tête concerne uniquement les lignes reçues. Les collections doivent avoir des clés uniques.

FileDropzone ne transfère aucun fichier. accept guide le sélecteur natif, pas les fichiers déposés ; le contrôle local fourni porte sur maxBytes. Le service vérifie contenu, MIME et règles de stockage. CodeBlock gère une copie utilisateur mais ne fournit pas de coloration syntaxique.

## Changements de style et migration

Inter 4.1 est fournie en WOFF2 normal variable avec licence OFL. Le CSS charge l’asset local avec swap ; vérifier l’URL dans le bundler. Le flou par défaut passe de 18 à 12 px. Les rayons/espacements suivent le verre aéré retenu.

Le trait SVG passe de 2 à 1,5 px et les icônes possèdent une couleur noir/blanc propre. Pour un ancien comportement d’héritage, transmettre explicitement `style={{color:'currentColor'}}`; pour conserver le trait antérieur, fournir `strokeWidth={2}`. Un bouton sur fond noir/blanc inverse doit aussi préserver le contraste de son icône.

Les 1 112 anciens composants et 2 100 anciennes icônes restent exportés aux mêmes chemins ; les géométries initiales sont conservées. Le changement des défauts visuels est annoncé en 0.2.0 plutôt que présenté comme une simple édition documentaire.

## Vérifications utiles

Les tests spécifiques sont dans `tests/extensions.test.tsx` du monorepo. Les fiches fournissent des exemples complets compilés par `docs:check`. La suite de distribution examine ESM/CJS/sous-chemins et des consommateurs React 18/19. Les contrôles navigateur portent sur des parcours représentatifs ; aucune conclusion Safari/Firefox ou lecteur d’écran complet n’est déduite.

Lire [TESTING.md](TESTING.md), [ACCESSIBILITY.md](ACCESSIBILITY.md) et [LIMITATIONS.md](LIMITATIONS.md) pour distinguer commandes, résultats exécutés et travail restant dans l’application.
