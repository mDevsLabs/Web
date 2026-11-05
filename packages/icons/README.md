# @mdevs/icons

Catalogue de **2 600** icônes SVG en composants React, sur une grille de 24 × 24,
trait de 1,5, `currentColor`. Les géométries viennent de Lucide (ISC) et Tabler
(MIT) ; le wrapper est MIT. Version du paquet : **0.9.3**.

```tsx
import {SearchIcon} from "@mdevs/icons/controls/search";
import {ArrowRightIcon} from "@mdevs/icons/arrows/arrow-right";

<SearchIcon size={20} aria-label="Rechercher" />
<ArrowRightIcon size={24} strokeWidth={1.5} />
```

## Dans ce dépôt

Le paquet est **consommé en dépendance `file:packages/icons`** et n'est pas un
membre du workspace pnpm (`pnpm-workspace.yaml` = `packages: []`). Il est installé
par `pnpm install` à la racine, sans commande propre.

`dist/`, `svg/`, `src/icons/`, les index et `catalog/` sont des **artefacts
versionnés**, générés ailleurs : les scripts du générateur (`scripts/generate.py`,
`scripts/data/icons.json`) et les commandes `npm run generate` ou `catalog:find`
cités dans [AGENTS.md](AGENTS.md) **n'existent pas dans ce dépôt**. Y compris
`catalog/*/README.md`, qui est une sortie : ne pas les réécrire à la main, et ne
pas corriger une géométrie uniquement dans `src/icons/`.

Ici, le paquet sert l'interface de l'hôte : environ 480 sites d'import dans
`app/`, `components/`, `lib/` et `hooks/`. `next.config.ts` l'ajoute à
`experimental.optimizePackageImports`.

## Utiliser

React 18.3 ou 19 est une pair dependency. Aucune feuille de style n'est requise.
Exports publics : racine, `./core`, `./catalog`, les 30 sous-chemins de catégorie,
`<catégorie>/<slug>` et `./svg/<catégorie>/<slug>` (sans extension).

- **Préférer le sous-chemin d'icône** (`@mdevs/icons/controls/search`) dans un
  bundle web ; garder l'import racine pour les petits scripts.
- Pas d'import par défaut, pas de chemin `src/` ou `dist/`, pas de nom déduit
  d'une documentation Lucide ou Tabler externe : **copier l'import depuis
  `catalog/manifest.json`**.
- Éviter `import * as Icons` puis résolution par chaîne : construire une table
  d'imports statiques et typer sa clé.

`IconProps` étend `SVGProps<SVGSVGElement>` : `size` (défaut 24), `title` (titre
à ID unique et `aria-labelledby` calculé), `absoluteStrokeWidth`
(`non-scaling-stroke`), et les attributs SVG transmis **après** les défauts — un
`width`, `viewBox` ou `aria-hidden` explicite les remplace donc.

Icône décorative avec texte voisin : aucun titre ni label, `aria-hidden` est
calculé. Icône seule porteuse d'information : `title` ou `aria-label`. Bouton sans
texte visible : nommer le **bouton**, garder son SVG décoratif.

## Trouver et licencier

- [Manifeste complet](catalog/manifest.json) — noms, chemins, mots-clés, catégorie, provenance
- [Guides par catégorie](catalog/) · [Documentation du package](catalog/docs/README.md)
- [Règles de contribution](AGENTS.md) · [Conventions graphiques](STYLE.md)

Conserver `LICENSE`, `NOTICE.md`, `LICENSE-LUCIDE` et `LICENSE-TABLER` lors de
toute redistribution : la collection n'est pas constituée de dessins originaux.
