# @mdevs/icons

Catalogue de 2 600 icônes SVG React sur une grille de 24 × 24. Le package regroupe des formes issues de Lucide et Tabler ; les attributions et licences amont sont fournies avec le package. La collection expose des imports ESM et CommonJS, des types TypeScript et les SVG bruts.

~~~tsx
import {SearchIcon} from "@mdevs/icons/controls/search";
import {ArrowRightIcon} from "@mdevs/icons/arrows/arrow-right";

<SearchIcon size={20} aria-label="Rechercher" />
<ArrowRightIcon size={24} strokeWidth={1.5} />
~~~

## Installer et utiliser

React 18.3 ou 19 est une peer dependency. Le package et ses exports publics sont décrits dans package.json. Pour l’utiliser depuis un projet local, installez le package depuis ce dossier ou son archive npm. Aucune feuille de style n’est requise pour les icônes.

Chaque icône accepte les props SVG et utilise currentColor. Les icônes seules sont décoratives ; nommez le bouton ou le lien qui porte l’action. Utilisez title ou les attributs ARIA lorsque l’icône transmet une information à elle seule.

## Trouver une icône

- [Manifeste complet](catalog/manifest.json) : noms, chemins d’import, mots-clés, catégorie et provenance.
- [Guides de catégories](catalog/) : sélections d’icônes par usage.
- [Documentation du package](catalog/docs/README.md)
- [Règles de contribution](AGENTS.md) et [conventions graphiques](STYLE.md)

La licence du wrapper est dans LICENSE. Les notices et licences des dessins sont dans NOTICE.md, LICENSE-LUCIDE et LICENSE-TABLER. Conservez ces fichiers lors de toute redistribution.
