# Documentation Mdevs

Cette documentation accompagne le monorepo et les deux packages extraits. Dans un package individuel, les mêmes guides centraux sont sous `catalog/docs`. Les instructions spécifiques sont dans son `AGENTS.md`, l’entrée courte dans `llms.txt` et la consolidation dans `llms-full.txt`.

## Choisir le guide utile

| Objectif | Guide | Résultat |
| --- | --- | --- |
| Créer selon les règles choisies | [STYLE](STYLE.md) | Inter locale, verre subtil, monochrome et méthodes de création |
| Intégrer les ajouts 0.2.0 | [EXTENSIONS](EXTENSIONS.md) | 60 primitives et 40 compositions, contrats et migration visuelle |
| Installer et afficher le premier composant | [GETTING_STARTED](GETTING_STARTED.md) | ZIP/tarball, React, CSS, Next.js et imports |
| Comprendre les APIs et états | [API](API.md) | Contrats, callbacks, contrôlé/non contrôlé, dix familles |
| Choisir une composition UI | [UI_PLAYBOOK](UI_PLAYBOOK.md) | Cas d’usage, tableaux, paramètres et responsabilités |
| Sauvegarder et valider une saisie | [FORM_PATTERNS](FORM_PATTERNS.md) | Initialisation, async, erreurs et remount |
| Ouvrir des fenêtres et menus | [OVERLAYS](OVERLAYS.md) | Déclencheurs, focus, portails et confirmation |
| Utiliser une icône | [ICONS](ICONS.md) | Grille, taille, ref, ARIA, imports et SVG brut |
| Maintenir ou étendre les dessins | [ICON_MAINTENANCE](ICON_MAINTENANCE.md) | Snapshot, géométrie, provenance et licences |
| Personnaliser le verre | [LIQUID_GLASS](LIQUID_GLASS.md) | Tokens, cascade, portails, performance et replis |
| Concevoir un parcours accessible | [ACCESSIBILITY](ACCESSIBILITY.md) | Noms, clavier, focus, erreurs et contraste |
| Travailler comme agent IA | [AI_AGENTS](AI_AGENTS.md) | Recherche fiable, décisions, prompts et preuves |
| Comprendre le dépôt | [ARCHITECTURE](ARCHITECTURE.md) | Génération, distribution et responsabilités |
| Vérifier un changement | [TESTING](TESTING.md) | Commandes, périmètre et limites de validation |
| Diagnostiquer un problème | [TROUBLESHOOTING](TROUBLESHOOTING.md) | Symptômes, preuves et corrections |
| Empaqueter/publier | [RELEASING](RELEASING.md) | Versions, tarballs, ZIP et publication séparée |
| Lire les limites connues | [LIMITATIONS](LIMITATIONS.md) | Capacités actuelles et tâches applicatives |
| Lire les résultats de livraison | [VALIDATION_REPORT](VALIDATION_REPORT.md) | Contrôles exécutés et portée des preuves |

## Parcours rapide pour un agent

1. Lire l’AGENTS du périmètre concerné.
2. Chercher un nom exact dans `catalog/manifest.json`.
3. Ouvrir la fiche individuelle et le module public qu’elle cite.
4. Lire les types du domaine ou de la primitive.
5. Choisir un exemple complet, raccorder les données et callbacks.
6. Exécuter les vérifications adaptées à l’intégration.

Le manifeste contient l’inventaire. `catalog/documentation.json` contient l’index des guides et fiches présents ; le lire via un chemin de fichier, sans supposer un export JavaScript supplémentaire. Les docs de domaine se trouvent dans `catalog/<domaine>/README.md`, les fiches UI dans `catalog/components/<catégorie>/`, et les guides d’icônes dans `catalog/<catégorie>/README.md` du package icônes.

## Contrats, exemples et données

Les déclarations et sources sont la référence d’API. Un tableau de props extrait d’une interface peut dépendre de types déclarés ailleurs ; les liens et chemins indiquent ce contexte. Un fragment illustre une idée ; les exemples complets maintenus du monorepo sont dans `examples/docs/` et sont inclus dans `npm run typecheck`.

Les `sampleProps` sont fictifs. Les callbacks d’exemples locaux ne fournissent pas un backend ou des règles de métier. Les nombres et dates gardent leurs unités/format applicatifs ; aucune devise ou timezone ne doit être déduite sans définition.

## Édition et synchronisation

Modifier les guides originaux dans `docs` et les AGENTS/llms de leur périmètre. Exécuter `npm run docs:build` pour produire les fiches depuis les sources et recopier les guides centraux dans les packages. `npm run docs:check` vérifie la présence, les liens, les imports nommés, les exemples complets des fiches UI et la synchronisation documentaire. Il exige des distributions `dist` cohérentes ; sur un checkout qui ne les contient pas, lancer d’abord `npm run build`. Compiler les exemples modifiés avec `npm run typecheck`.

La chaîne `npm run generate` appelle aussi la génération documentaire après les sources et leur formatage. Elle ne remplace pas une relecture du comportement. Un paquet individuel contient les sorties de ce processus ; il ne fournit pas nécessairement les outils du monorepo pour les reproduire.

## Repères de la version initiale

- UI : 132 primitives, 108 domaines × 10 familles = 1 212 exports de composants.
- Icônes : 2 600 SVG sélectionnés ; noms React avec suffixe Icon.
- Les familles métier partagent des rendus et des contrats de domaine propres.
- Les variantes de taille/couleur ne sont pas comptées comme nouveaux composants.
- La présence de tarballs/ZIP n’indique pas une publication npm.
- Les licences Mdevs, Lucide/Feather et Tabler accompagnent la redistribution.
