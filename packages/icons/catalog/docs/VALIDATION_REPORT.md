# Rapport de livraison — 0.1.0

## Livraison 0.2.0 — extension et style, 5 octobre 2026

Cette livraison ajoute 100 composants et 500 géométries distinctes, Inter variable local et le trait monochrome de 1,5 px. Les noms et chemins des 1 112 composants et 2 100 icônes précédents sont conservés ; les empreintes de leurs géométries sont inchangées. Les défauts visuels évoluent explicitement en 0.2.0.

| Contrôle exécuté | Résultat |
| --- | --- |
| Inventaire UI et SSR | 1 212 composants : 132 primitives + 1 080 compositions, 108 domaines |
| Inventaire, unicité des géométries et XML | 2 600 icônes : 1 865 Lucide + 735 Tabler |
| Vitest | 147 tests réussis, dont 23 tests des ajouts |
| TypeScript du dépôt | Réussi |
| Documentation | 1 212 exemples complets compilés ; copies, liens et imports publics vérifiés |
| ESM/CJS et sous-chemins | Tous les exports des manifests vérifiés |
| Imports ciblés Button + ArrowRightIcon | 1 462 octets minifiés, React externe |
| Consommateurs tarballs React 18.3.1 / 19.2.0 | Installation propre, déclarations strictes, SSR et CJS réussis |
| Fontes | WOFF2 Inter local chargé et rendu effectif confirmé dans Chromium |
| Icônes | Noir/blanc sous ThemeProvider et autonomes ; tailles 16, 20, 24, 32 et 48 px |
| Catalogue Chromium et axe | Aucune erreur ni violation détectée en clair et sombre sur le parcours testé |
| 60 aperçus ajoutés | Axe en clair, limites de fenêtre à 320/375/1 440 px réussis |
| Interactions navigateur ajoutées | Combobox au clavier et sélection de table réussies |
| Planche des 500 icônes ajoutées | Générée et revue visuellement |

Rapports actuels : `artifacts/distribution-results.json`, `browser-results.json`, `axe-results.json`, `style-results.json`, `expansion-results.json` et `documentation-results.json`. Les rapports antérieurs sont conservés dans `artifacts/history/0.1.0`. Le contrôle d’installation des ZIP est consigné séparément dans `artifacts/zip-install-results.json` après leur assemblage.

Les contrôles axe des 60 ajouts portent sur leurs états initiaux ; ils ne certifient pas tous les états ouverts ou toutes les compositions. Aucun essai Safari, Firefox ou lecteur d’écran n’est revendiqué. Le catalogue charge volontairement l’ensemble des exports pour la recherche ; son bundle complet n’est pas le poids d’un import individuel. Les packages ne sont pas publiés sur npm.

## Historique 0.1.0


Vérifications exécutées dans l’environnement Linux de livraison le 4 octobre 2026.

| Contrôle | Résultat |
| --- | --- |
| TypeScript strict, sources et exemples | Réussi |
| Tests de comportements et catalogues | 120 tests réussis |
| Rendu serveur des composants | 1 112 exports vérifiés |
| Rendu des icônes et parsing XML | 2 100 SVG vérifiés |
| Exportations ESM et CommonJS | Toutes les entrées du manifeste vérifiées |
| Sous-chemins et déclarations .d.ts | Toutes les entrées publiques vérifiées |
| Bundle bouton + icône, React externe | 1 334 octets minifiés ; exports inutilisés éliminés |
| Installation de tarballs, React 19.2.0 | Réussie, typecheck strict et SSR |
| Installation de tarballs, React 18.3.1 | Réussie, typecheck strict et SSR |
| Catalogue compilé, Chromium | Recherche, previews et modal mobile réussies |
| axe WCAG A/AA, clair et sombre | Aucune violation détectée sur le catalogue testé |
| Largeurs 320, 375, 768, 1 440 px | Aucun débordement horizontal de page |

Composition : 72 primitives + 1 040 composants métier, répartis en 104 domaines et dix familles de rendu ; 1 865 géométries Lucide + 235 géométries Tabler. Les variantes de taille/couleur ne sont pas comptées. Le résultat axe porte sur le catalogue et ses parcours testés, pas sur toute composition possible.

Les fichiers JSON des vérifications et les captures sont dans `artifacts`. Les scripts reproduisent ces contrôles. Aucun résultat Safari/Firefox n’est revendiqué et aucun package n’a été publié sur npm.

## Complément — approfondissement documentaire

La révision des AGENTS et guides ajoute des contrats détaillés, des procédures d’intégration/maintenance et une génération documentaire déterministe. Les sources et le CSS des deux packages conservent exactement leurs empreintes avant/après cette révision. Les résultats runtime ci-dessus restent ceux de la livraison initiale ; les suites runtime et navigateur n’ont pas été relancées pour ce changement documentaire.

| Contrôle exécuté pour les documents | Résultat |
| --- | --- |
| Fiches UI détaillées générées depuis les types/sources | 1 112 |
| Guides de domaine et catégories d’icônes | 104 domaines et 29 catégories |
| Synchronisation des guides, index et consolidations IA | 1 285 sorties vérifiées |
| Documents Markdown vérifiés | 1 305 |
| Cibles de liens locaux Markdown | 17 423 liens valides |
| Imports nommés dans les blocs de code | 3 820 déclarations, 1 282 modules publics vérifiés |
| Exemples complets des fiches composants | 1 112 exemples vérifiés par compilation stricte, aucun diagnostic |
| Typecheck global avec les quatre intégrations `examples/docs` | Réussi |
| Empreintes du code et CSS des packages | Inchangées |

`scripts/documentation.mjs --check` compare les sorties attendues et leur contenu distribué. `scripts/check-docs.mjs` vérifie les liens, les exports nommés et compile les sections « Exemple d’intégration » contre les déclarations présentes. Les autres fragments Markdown ne sont pas compilés intégralement. Les URLs distantes et ancres internes ne sont pas contrôlées.

Ces vérifications ne remplacent pas les essais clavier, focus, contraste ou navigateur d’une application. Un changement de source nécessite un build frais avant les contrôles qui lisent `dist`. Le rapport machine de ce complément est `artifacts/documentation-results.json` dans le monorepo. Les guides distribués sont conservés dans les deux ZIP individuels, même si les scripts et rapports du dépôt n’y figurent pas.
