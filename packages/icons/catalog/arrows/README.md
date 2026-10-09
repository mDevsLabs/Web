# Flèches et orientation — icônes

136 icônes de la catégorie `arrows`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : tabler (20), lucide (116). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {ArrowAutofitContentIcon} from '@mdevs/icons';
// Alternatives :
import {ArrowAutofitContentIcon} from '@mdevs/icons/arrows';
import {ArrowAutofitContentIcon} from '@mdevs/icons/arrows/arrow-autofit-content';
```

Conserver une seule des trois lignes. Les sous-chemins du tableau correspondent aux exports publics. Le SVG brut de chaque entrée est accessible sous @mdevs/icons/svg/<catégorie>/<slug> (sans extension dans l’import public, le fichier cible porte .svg) ; son traitement en URL, chaîne ou composant dépend du bundler du projet hôte. Aucun loader SVG particulier n’est fourni.
## Contrat commun


```ts
export type IconNode = readonly (readonly [
    string,
    Readonly<Record<string, string | number>>
])[];

export interface IconProps extends SVGProps<SVGSVGElement> {
    /** Base viewBox is 0 0 24 24; native props can override it. Size accepts CSS units. */
    size?: number | string;
    title?: string;
    /** Keep strokes fixed in screen units during CSS/SVG scaling. */
    absoluteStrokeWidth?: boolean;
}
```


| Prop | Défaut | Comportement |
| --- | --- | --- |
| size | 24 | Nombre en pixels ou chaîne CSS, notamment em/rem ; définit width et height. |
| strokeWidth | 1.5 | Épaisseur de référence du contour minimaliste. |
| absoluteStrokeWidth | false | Ajoute vectorEffect="non-scaling-stroke" aux nœuds géométriques pour une épaisseur fixe à l’écran. |
| title | Absent | Crée un title avec id unique et nomme le SVG comme image. |
| aria-label / aria-labelledby | Absent | Nom accessible si l’icône porte une information autonome. |
| color / style / className | Noir/blanc adaptatif | Le contour utilise currentColor avec une couleur propre : --md-icon-color ou light-dark. color puis style.color peuvent personnaliser ce défaut. |
| ref | Optionnel | Ref vers SVGSVGElement, transmise par forwardRef. |
| children | Optionnel | Nœuds SVG supplémentaires ; aucune modification des géométries du catalogue. |

## Grille et adaptation

Le viewBox par défaut est 0 0 24 24 et les géométries sont dessinées sur cette grille. size permet de les rendre à 16, 20, 24, 32 px ou en unités relatives ; une dimension en pourcentage exige un conteneur dimensionné. Les attributs SVG natifs sont transmis après les défauts : garder le viewBox du package afin de conserver la grille. Un SVG s’adapte à la densité d’écran sans bitmap ; vérifier visuellement les très petites tailles et l’épaisseur du trait. La taille d’une icône ne définit pas la zone tactile de son bouton.

## Exemples accessibles


```tsx
import {ArrowAutofitContentIcon} from '@mdevs/icons/arrows/arrow-autofit-content';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><ArrowAutofitContentIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <ArrowAutofitContentIcon size={32} title="Flèches et orientation" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `ArrowAutofitContentIcon` | `@mdevs/icons/arrows/arrow-autofit-content` | [arrow-autofit-content.svg](../../svg/arrows/arrow-autofit-content.svg) | [TSX](../../src/icons/arrows/arrow-autofit-content.tsx) | tabler | direction, east, west, arrow, autofit, content, pointer, navigation, flow, navigate |
| `ArrowAutofitDownIcon` | `@mdevs/icons/arrows/arrow-autofit-down` | [arrow-autofit-down.svg](../../svg/arrows/arrow-autofit-down.svg) | [TSX](../../src/icons/arrows/arrow-autofit-down.tsx) | tabler | direction, south, arrow, autofit, down, pointer, bottom, decrease, navigation, flow |
| `ArrowAutofitHeightIcon` | `@mdevs/icons/arrows/arrow-autofit-height` | [arrow-autofit-height.svg](../../svg/arrows/arrow-autofit-height.svg) | [TSX](../../src/icons/arrows/arrow-autofit-height.tsx) | tabler | direction, north, up, down, south, arrow, autofit, height, pointer, navigation |
| `ArrowAutofitLeftIcon` | `@mdevs/icons/arrows/arrow-autofit-left` | [arrow-autofit-left.svg](../../svg/arrows/arrow-autofit-left.svg) | [TSX](../../src/icons/arrows/arrow-autofit-left.tsx) | tabler | direction, west, arrow, autofit, left, pointer, navigation, flow, navigate, move |
| `ArrowAutofitRightIcon` | `@mdevs/icons/arrows/arrow-autofit-right` | [arrow-autofit-right.svg](../../svg/arrows/arrow-autofit-right.svg) | [TSX](../../src/icons/arrows/arrow-autofit-right.tsx) | tabler | direction, east, west, arrow, autofit, right, pointer, navigation, flow, navigate |
| `ArrowAutofitUpIcon` | `@mdevs/icons/arrows/arrow-autofit-up` | [arrow-autofit-up.svg](../../svg/arrows/arrow-autofit-up.svg) | [TSX](../../src/icons/arrows/arrow-autofit-up.tsx) | tabler | direction, north, arrow, autofit, pointer, top, increase, navigation, flow, navigate |
| `ArrowAutofitWidthIcon` | `@mdevs/icons/arrows/arrow-autofit-width` | [arrow-autofit-width.svg](../../svg/arrows/arrow-autofit-width.svg) | [TSX](../../src/icons/arrows/arrow-autofit-width.tsx) | tabler | direction, east, west, arrow, autofit, width, pointer, navigation, flow, navigate |
| `ArrowBackIcon` | `@mdevs/icons/arrows/arrow-back` | [arrow-back.svg](../../svg/arrows/arrow-back.svg) | [TSX](../../src/icons/arrows/arrow-back.tsx) | tabler | pointer, return, revert, reverse, undo, left, arrow, back, direction, navigation |
| `ArrowBackUpIcon` | `@mdevs/icons/arrows/arrow-back-up` | [arrow-back-up.svg](../../svg/arrows/arrow-back-up.svg) | [TSX](../../src/icons/arrows/arrow-back-up.tsx) | tabler | pointer, return, revert, reverse, undo, left, arrow, back, direction, top |
| `ArrowBackUpDoubleIcon` | `@mdevs/icons/arrows/arrow-back-up-double` | [arrow-back-up-double.svg](../../svg/arrows/arrow-back-up-double.svg) | [TSX](../../src/icons/arrows/arrow-back-up-double.tsx) | tabler | navigation, direction, return, reverse, double, path, interface, ui, gesture, arrow |
| `ArrowBadgeDownIcon` | `@mdevs/icons/arrows/arrow-badge-down` | [arrow-badge-down.svg](../../svg/arrows/arrow-badge-down.svg) | [TSX](../../src/icons/arrows/arrow-badge-down.tsx) | tabler | army, badge, military, rank, soldier, war, south, bottom, arrow, down |
| `ArrowBadgeLeftIcon` | `@mdevs/icons/arrows/arrow-badge-left` | [arrow-badge-left.svg](../../svg/arrows/arrow-badge-left.svg) | [TSX](../../src/icons/arrows/arrow-badge-left.tsx) | tabler | army, badge, military, rank, soldier, war, west, arrow, left, direction |
| `ArrowBadgeRightIcon` | `@mdevs/icons/arrows/arrow-badge-right` | [arrow-badge-right.svg](../../svg/arrows/arrow-badge-right.svg) | [TSX](../../src/icons/arrows/arrow-badge-right.tsx) | tabler | army, badge, military, rank, soldier, war, east, arrow, right, direction |
| `ArrowBadgeUpIcon` | `@mdevs/icons/arrows/arrow-badge-up` | [arrow-badge-up.svg](../../svg/arrows/arrow-badge-up.svg) | [TSX](../../src/icons/arrows/arrow-badge-up.tsx) | tabler | army, badge, military, rank, soldier, war, north, arrow, direction, pointer |
| `ArrowBarBothIcon` | `@mdevs/icons/arrows/arrow-bar-both` | [arrow-bar-both.svg](../../svg/arrows/arrow-bar-both.svg) | [TSX](../../src/icons/arrows/arrow-bar-both.tsx) | tabler | direction, bar, navigation, indicator, bi-directional, interface, ui, path, flow, arrow |
| `ArrowBarDownIcon` | `@mdevs/icons/arrows/arrow-bar-down` | [arrow-bar-down.svg](../../svg/arrows/arrow-bar-down.svg) | [TSX](../../src/icons/arrows/arrow-bar-down.tsx) | tabler | drag, move, arrow, bar, down, direction, pointer, bottom, decrease, navigation |
| `ArrowBarLeftIcon` | `@mdevs/icons/arrows/arrow-bar-left` | [arrow-bar-left.svg](../../svg/arrows/arrow-bar-left.svg) | [TSX](../../src/icons/arrows/arrow-bar-left.tsx) | tabler | drag, move, arrow, bar, left, direction, pointer, navigation, flow, navigate |
| `ArrowBarRightIcon` | `@mdevs/icons/arrows/arrow-bar-right` | [arrow-bar-right.svg](../../svg/arrows/arrow-bar-right.svg) | [TSX](../../src/icons/arrows/arrow-bar-right.tsx) | tabler | drag, move, arrow, bar, right, direction, pointer, navigation, flow, navigate |
| `ArrowBarToDownIcon` | `@mdevs/icons/arrows/arrow-bar-to-down` | [arrow-bar-to-down.svg](../../svg/arrows/arrow-bar-to-down.svg) | [TSX](../../src/icons/arrows/arrow-bar-to-down.tsx) | tabler | drag, move, arrow, bar, down, direction, pointer, bottom, decrease, navigation |
| `ArrowBarToDownDashedIcon` | `@mdevs/icons/arrows/arrow-bar-to-down-dashed` | [arrow-bar-to-down-dashed.svg](../../svg/arrows/arrow-bar-to-down-dashed.svg) | [TSX](../../src/icons/arrows/arrow-bar-to-down-dashed.tsx) | tabler | arrow, bar, down, dashed, direction, pointer, bottom, decrease, navigation, flow |
| `ArrowBigDownIcon` | `@mdevs/icons/arrows/arrow-big-down` | [arrow-big-down.svg](../../svg/arrows/arrow-big-down.svg) | [TSX](../../src/icons/arrows/arrow-big-down.tsx) | lucide | backwards, reverse, direction, south |
| `ArrowBigDownDashIcon` | `@mdevs/icons/arrows/arrow-big-down-dash` | [arrow-big-down-dash.svg](../../svg/arrows/arrow-big-down-dash.svg) | [TSX](../../src/icons/arrows/arrow-big-down-dash.tsx) | lucide | backwards, reverse, slow, direction, south, download |
| `ArrowBigLeftIcon` | `@mdevs/icons/arrows/arrow-big-left` | [arrow-big-left.svg](../../svg/arrows/arrow-big-left.svg) | [TSX](../../src/icons/arrows/arrow-big-left.tsx) | lucide | previous, back, direction, west, indicate turn |
| `ArrowBigLeftDashIcon` | `@mdevs/icons/arrows/arrow-big-left-dash` | [arrow-big-left-dash.svg](../../svg/arrows/arrow-big-left-dash.svg) | [TSX](../../src/icons/arrows/arrow-big-left-dash.tsx) | lucide | previous, back, direction, west, turn, corner |
| `ArrowBigRightIcon` | `@mdevs/icons/arrows/arrow-big-right` | [arrow-big-right.svg](../../svg/arrows/arrow-big-right.svg) | [TSX](../../src/icons/arrows/arrow-big-right.tsx) | lucide | next, forward, direction, east, indicate turn |
| `ArrowBigRightDashIcon` | `@mdevs/icons/arrows/arrow-big-right-dash` | [arrow-big-right-dash.svg](../../svg/arrows/arrow-big-right-dash.svg) | [TSX](../../src/icons/arrows/arrow-big-right-dash.tsx) | lucide | next, forward, direction, east, turn, corner |
| `ArrowBigUpIcon` | `@mdevs/icons/arrows/arrow-big-up` | [arrow-big-up.svg](../../svg/arrows/arrow-big-up.svg) | [TSX](../../src/icons/arrows/arrow-big-up.tsx) | lucide | shift, keyboard, button, mac, capitalize, capitalise, forward, direction, north |
| `ArrowBigUpDashIcon` | `@mdevs/icons/arrows/arrow-big-up-dash` | [arrow-big-up-dash.svg](../../svg/arrows/arrow-big-up-dash.svg) | [TSX](../../src/icons/arrows/arrow-big-up-dash.tsx) | lucide | caps lock, capitals, keyboard, button, mac, forward, direction, north, faster, speed, boost |
| `ArrowDownIcon` | `@mdevs/icons/arrows/arrow-down` | [arrow-down.svg](../../svg/arrows/arrow-down.svg) | [TSX](../../src/icons/arrows/arrow-down.tsx) | lucide | backwards, reverse, direction, south |
| `ArrowDown01Icon` | `@mdevs/icons/arrows/arrow-down-0-1` | [arrow-down-0-1.svg](../../svg/arrows/arrow-down-0-1.svg) | [TSX](../../src/icons/arrows/arrow-down-0-1.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling, numerical |
| `ArrowDown10Icon` | `@mdevs/icons/arrows/arrow-down-1-0` | [arrow-down-1-0.svg](../../svg/arrows/arrow-down-1-0.svg) | [TSX](../../src/icons/arrows/arrow-down-1-0.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling, numerical |
| `ArrowDownAZIcon` | `@mdevs/icons/arrows/arrow-down-a-z` | [arrow-down-a-z.svg](../../svg/arrows/arrow-down-a-z.svg) | [TSX](../../src/icons/arrows/arrow-down-a-z.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling, alphabetical |
| `ArrowDownCircleIcon` | `@mdevs/icons/arrows/arrow-down-circle` | [arrow-down-circle.svg](../../svg/arrows/arrow-down-circle.svg) | [TSX](../../src/icons/arrows/arrow-down-circle.tsx) | lucide | — |
| `ArrowDownFromLineIcon` | `@mdevs/icons/arrows/arrow-down-from-line` | [arrow-down-from-line.svg](../../svg/arrows/arrow-down-from-line.svg) | [TSX](../../src/icons/arrows/arrow-down-from-line.tsx) | lucide | backwards, reverse, direction, south, download, expand, fold, vertical |
| `ArrowDownLeftIcon` | `@mdevs/icons/arrows/arrow-down-left` | [arrow-down-left.svg](../../svg/arrows/arrow-down-left.svg) | [TSX](../../src/icons/arrows/arrow-down-left.tsx) | lucide | direction, south-west, diagonal |
| `ArrowDownLeftFromCircleIcon` | `@mdevs/icons/arrows/arrow-down-left-from-circle` | [arrow-down-left-from-circle.svg](../../svg/arrows/arrow-down-left-from-circle.svg) | [TSX](../../src/icons/arrows/arrow-down-left-from-circle.tsx) | lucide | — |
| `ArrowDownLeftFromSquareIcon` | `@mdevs/icons/arrows/arrow-down-left-from-square` | [arrow-down-left-from-square.svg](../../svg/arrows/arrow-down-left-from-square.svg) | [TSX](../../src/icons/arrows/arrow-down-left-from-square.tsx) | lucide | — |
| `ArrowDownLeftSquareIcon` | `@mdevs/icons/arrows/arrow-down-left-square` | [arrow-down-left-square.svg](../../svg/arrows/arrow-down-left-square.svg) | [TSX](../../src/icons/arrows/arrow-down-left-square.tsx) | lucide | — |
| `ArrowDownNarrowWideIcon` | `@mdevs/icons/arrows/arrow-down-narrow-wide` | [arrow-down-narrow-wide.svg](../../svg/arrows/arrow-down-narrow-wide.svg) | [TSX](../../src/icons/arrows/arrow-down-narrow-wide.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling |
| `ArrowDownRightIcon` | `@mdevs/icons/arrows/arrow-down-right` | [arrow-down-right.svg](../../svg/arrows/arrow-down-right.svg) | [TSX](../../src/icons/arrows/arrow-down-right.tsx) | lucide | direction, south-east, diagonal |
| `ArrowDownRightFromCircleIcon` | `@mdevs/icons/arrows/arrow-down-right-from-circle` | [arrow-down-right-from-circle.svg](../../svg/arrows/arrow-down-right-from-circle.svg) | [TSX](../../src/icons/arrows/arrow-down-right-from-circle.tsx) | lucide | — |
| `ArrowDownRightFromSquareIcon` | `@mdevs/icons/arrows/arrow-down-right-from-square` | [arrow-down-right-from-square.svg](../../svg/arrows/arrow-down-right-from-square.svg) | [TSX](../../src/icons/arrows/arrow-down-right-from-square.tsx) | lucide | — |
| `ArrowDownRightSquareIcon` | `@mdevs/icons/arrows/arrow-down-right-square` | [arrow-down-right-square.svg](../../svg/arrows/arrow-down-right-square.svg) | [TSX](../../src/icons/arrows/arrow-down-right-square.tsx) | lucide | — |
| `ArrowDownSquareIcon` | `@mdevs/icons/arrows/arrow-down-square` | [arrow-down-square.svg](../../svg/arrows/arrow-down-square.svg) | [TSX](../../src/icons/arrows/arrow-down-square.tsx) | lucide | — |
| `ArrowDownToDotIcon` | `@mdevs/icons/arrows/arrow-down-to-dot` | [arrow-down-to-dot.svg](../../svg/arrows/arrow-down-to-dot.svg) | [TSX](../../src/icons/arrows/arrow-down-to-dot.tsx) | lucide | direction, south, waypoint, location, step, into |
| `ArrowDownToLineIcon` | `@mdevs/icons/arrows/arrow-down-to-line` | [arrow-down-to-line.svg](../../svg/arrows/arrow-down-to-line.svg) | [TSX](../../src/icons/arrows/arrow-down-to-line.tsx) | lucide | behind, direction, south, download, save, git, version control, pull, collapse, fold, vertical |
| `ArrowDownUpIcon` | `@mdevs/icons/arrows/arrow-down-up` | [arrow-down-up.svg](../../svg/arrows/arrow-down-up.svg) | [TSX](../../src/icons/arrows/arrow-down-up.tsx) | lucide | bidirectional, two-way, 2-way, swap, switch, network, traffic, flow, mobile data, internet, sort, reorder, move |
| `ArrowDownWideNarrowIcon` | `@mdevs/icons/arrows/arrow-down-wide-narrow` | [arrow-down-wide-narrow.svg](../../svg/arrows/arrow-down-wide-narrow.svg) | [TSX](../../src/icons/arrows/arrow-down-wide-narrow.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling |
| `ArrowDownZAIcon` | `@mdevs/icons/arrows/arrow-down-z-a` | [arrow-down-z-a.svg](../../svg/arrows/arrow-down-z-a.svg) | [TSX](../../src/icons/arrows/arrow-down-z-a.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling, alphabetical, reverse |
| `ArrowLeftIcon` | `@mdevs/icons/arrows/arrow-left` | [arrow-left.svg](../../svg/arrows/arrow-left.svg) | [TSX](../../src/icons/arrows/arrow-left.tsx) | lucide | previous, back, direction, west, <- |
| `ArrowLeftCircleIcon` | `@mdevs/icons/arrows/arrow-left-circle` | [arrow-left-circle.svg](../../svg/arrows/arrow-left-circle.svg) | [TSX](../../src/icons/arrows/arrow-left-circle.tsx) | lucide | — |
| `ArrowLeftFromLineIcon` | `@mdevs/icons/arrows/arrow-left-from-line` | [arrow-left-from-line.svg](../../svg/arrows/arrow-left-from-line.svg) | [TSX](../../src/icons/arrows/arrow-left-from-line.tsx) | lucide | previous, back, direction, west, expand, fold, horizontal, <-\| |
| `ArrowLeftRightIcon` | `@mdevs/icons/arrows/arrow-left-right` | [arrow-left-right.svg](../../svg/arrows/arrow-left-right.svg) | [TSX](../../src/icons/arrows/arrow-left-right.tsx) | lucide | bidirectional, two-way, 2-way, swap, switch, transaction, reorder, move, <-, -> |
| `ArrowLeftSquareIcon` | `@mdevs/icons/arrows/arrow-left-square` | [arrow-left-square.svg](../../svg/arrows/arrow-left-square.svg) | [TSX](../../src/icons/arrows/arrow-left-square.tsx) | lucide | — |
| `ArrowLeftToLineIcon` | `@mdevs/icons/arrows/arrow-left-to-line` | [arrow-left-to-line.svg](../../svg/arrows/arrow-left-to-line.svg) | [TSX](../../src/icons/arrows/arrow-left-to-line.tsx) | lucide | previous, back, direction, west, collapse, fold, horizontal, \|<- |
| `ArrowRightIcon` | `@mdevs/icons/arrows/arrow-right` | [arrow-right.svg](../../svg/arrows/arrow-right.svg) | [TSX](../../src/icons/arrows/arrow-right.tsx) | lucide | forward, next, direction, east, -> |
| `ArrowRightCircleIcon` | `@mdevs/icons/arrows/arrow-right-circle` | [arrow-right-circle.svg](../../svg/arrows/arrow-right-circle.svg) | [TSX](../../src/icons/arrows/arrow-right-circle.tsx) | lucide | — |
| `ArrowRightFromLineIcon` | `@mdevs/icons/arrows/arrow-right-from-line` | [arrow-right-from-line.svg](../../svg/arrows/arrow-right-from-line.svg) | [TSX](../../src/icons/arrows/arrow-right-from-line.tsx) | lucide | next, forward, direction, east, export, expand, fold, horizontal, \|-> |
| `ArrowRightLeftIcon` | `@mdevs/icons/arrows/arrow-right-left` | [arrow-right-left.svg](../../svg/arrows/arrow-right-left.svg) | [TSX](../../src/icons/arrows/arrow-right-left.tsx) | lucide | bidirectional, two-way, 2-way, swap, switch, transaction, reorder, move, <-, -> |
| `ArrowRightSquareIcon` | `@mdevs/icons/arrows/arrow-right-square` | [arrow-right-square.svg](../../svg/arrows/arrow-right-square.svg) | [TSX](../../src/icons/arrows/arrow-right-square.tsx) | lucide | — |
| `ArrowRightToLineIcon` | `@mdevs/icons/arrows/arrow-right-to-line` | [arrow-right-to-line.svg](../../svg/arrows/arrow-right-to-line.svg) | [TSX](../../src/icons/arrows/arrow-right-to-line.tsx) | lucide | next, forward, direction, east, tab, keyboard, mac, indent, collapse, fold, horizontal, ->\| |
| `ArrowUpIcon` | `@mdevs/icons/arrows/arrow-up` | [arrow-up.svg](../../svg/arrows/arrow-up.svg) | [TSX](../../src/icons/arrows/arrow-up.tsx) | lucide | forward, direction, north |
| `ArrowUp01Icon` | `@mdevs/icons/arrows/arrow-up-0-1` | [arrow-up-0-1.svg](../../svg/arrows/arrow-up-0-1.svg) | [TSX](../../src/icons/arrows/arrow-up-0-1.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling, numerical |
| `ArrowUp10Icon` | `@mdevs/icons/arrows/arrow-up-1-0` | [arrow-up-1-0.svg](../../svg/arrows/arrow-up-1-0.svg) | [TSX](../../src/icons/arrows/arrow-up-1-0.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling, numerical |
| `ArrowUpAZIcon` | `@mdevs/icons/arrows/arrow-up-a-z` | [arrow-up-a-z.svg](../../svg/arrows/arrow-up-a-z.svg) | [TSX](../../src/icons/arrows/arrow-up-a-z.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling, alphabetical |
| `ArrowUpCircleIcon` | `@mdevs/icons/arrows/arrow-up-circle` | [arrow-up-circle.svg](../../svg/arrows/arrow-up-circle.svg) | [TSX](../../src/icons/arrows/arrow-up-circle.tsx) | lucide | — |
| `ArrowUpDownIcon` | `@mdevs/icons/arrows/arrow-up-down` | [arrow-up-down.svg](../../svg/arrows/arrow-up-down.svg) | [TSX](../../src/icons/arrows/arrow-up-down.tsx) | lucide | bidirectional, two-way, 2-way, swap, switch, network, mobile data, internet, sort, reorder, move |
| `ArrowUpFromDotIcon` | `@mdevs/icons/arrows/arrow-up-from-dot` | [arrow-up-from-dot.svg](../../svg/arrows/arrow-up-from-dot.svg) | [TSX](../../src/icons/arrows/arrow-up-from-dot.tsx) | lucide | direction, north, step, out |
| `ArrowUpFromLineIcon` | `@mdevs/icons/arrows/arrow-up-from-line` | [arrow-up-from-line.svg](../../svg/arrows/arrow-up-from-line.svg) | [TSX](../../src/icons/arrows/arrow-up-from-line.tsx) | lucide | forward, direction, north, upload, git, version control, push, expand, fold, vertical |
| `ArrowUpLeftIcon` | `@mdevs/icons/arrows/arrow-up-left` | [arrow-up-left.svg](../../svg/arrows/arrow-up-left.svg) | [TSX](../../src/icons/arrows/arrow-up-left.tsx) | lucide | direction, north-west, diagonal |
| `ArrowUpLeftFromCircleIcon` | `@mdevs/icons/arrows/arrow-up-left-from-circle` | [arrow-up-left-from-circle.svg](../../svg/arrows/arrow-up-left-from-circle.svg) | [TSX](../../src/icons/arrows/arrow-up-left-from-circle.tsx) | lucide | — |
| `ArrowUpLeftFromSquareIcon` | `@mdevs/icons/arrows/arrow-up-left-from-square` | [arrow-up-left-from-square.svg](../../svg/arrows/arrow-up-left-from-square.svg) | [TSX](../../src/icons/arrows/arrow-up-left-from-square.tsx) | lucide | — |
| `ArrowUpLeftSquareIcon` | `@mdevs/icons/arrows/arrow-up-left-square` | [arrow-up-left-square.svg](../../svg/arrows/arrow-up-left-square.svg) | [TSX](../../src/icons/arrows/arrow-up-left-square.tsx) | lucide | — |
| `ArrowUpNarrowWideIcon` | `@mdevs/icons/arrows/arrow-up-narrow-wide` | [arrow-up-narrow-wide.svg](../../svg/arrows/arrow-up-narrow-wide.svg) | [TSX](../../src/icons/arrows/arrow-up-narrow-wide.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling |
| `ArrowUpRightIcon` | `@mdevs/icons/arrows/arrow-up-right` | [arrow-up-right.svg](../../svg/arrows/arrow-up-right.svg) | [TSX](../../src/icons/arrows/arrow-up-right.tsx) | lucide | direction, north-east, diagonal |
| `ArrowUpRightFromCircleIcon` | `@mdevs/icons/arrows/arrow-up-right-from-circle` | [arrow-up-right-from-circle.svg](../../svg/arrows/arrow-up-right-from-circle.svg) | [TSX](../../src/icons/arrows/arrow-up-right-from-circle.tsx) | lucide | — |
| `ArrowUpRightFromSquareIcon` | `@mdevs/icons/arrows/arrow-up-right-from-square` | [arrow-up-right-from-square.svg](../../svg/arrows/arrow-up-right-from-square.svg) | [TSX](../../src/icons/arrows/arrow-up-right-from-square.tsx) | lucide | — |
| `ArrowUpRightSquareIcon` | `@mdevs/icons/arrows/arrow-up-right-square` | [arrow-up-right-square.svg](../../svg/arrows/arrow-up-right-square.svg) | [TSX](../../src/icons/arrows/arrow-up-right-square.tsx) | lucide | — |
| `ArrowUpSquareIcon` | `@mdevs/icons/arrows/arrow-up-square` | [arrow-up-square.svg](../../svg/arrows/arrow-up-square.svg) | [TSX](../../src/icons/arrows/arrow-up-square.tsx) | lucide | — |
| `ArrowUpToLineIcon` | `@mdevs/icons/arrows/arrow-up-to-line` | [arrow-up-to-line.svg](../../svg/arrows/arrow-up-to-line.svg) | [TSX](../../src/icons/arrows/arrow-up-to-line.tsx) | lucide | forward, direction, north, upload, collapse, fold, vertical |
| `ArrowUpWideNarrowIcon` | `@mdevs/icons/arrows/arrow-up-wide-narrow` | [arrow-up-wide-narrow.svg](../../svg/arrows/arrow-up-wide-narrow.svg) | [TSX](../../src/icons/arrows/arrow-up-wide-narrow.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling |
| `ArrowUpZAIcon` | `@mdevs/icons/arrows/arrow-up-z-a` | [arrow-up-z-a.svg](../../svg/arrows/arrow-up-z-a.svg) | [TSX](../../src/icons/arrows/arrow-up-z-a.tsx) | lucide | filter, sort, ascending, descending, increasing, decreasing, rising, falling, alphabetical, reverse |
| `ChevronDownIcon` | `@mdevs/icons/arrows/chevron-down` | [chevron-down.svg](../../svg/arrows/chevron-down.svg) | [TSX](../../src/icons/arrows/chevron-down.tsx) | lucide | backwards, reverse, slow, dropdown |
| `ChevronDownCircleIcon` | `@mdevs/icons/arrows/chevron-down-circle` | [chevron-down-circle.svg](../../svg/arrows/chevron-down-circle.svg) | [TSX](../../src/icons/arrows/chevron-down-circle.tsx) | lucide | — |
| `ChevronDownSquareIcon` | `@mdevs/icons/arrows/chevron-down-square` | [chevron-down-square.svg](../../svg/arrows/chevron-down-square.svg) | [TSX](../../src/icons/arrows/chevron-down-square.tsx) | lucide | — |
| `ChevronFirstIcon` | `@mdevs/icons/arrows/chevron-first` | [chevron-first.svg](../../svg/arrows/chevron-first.svg) | [TSX](../../src/icons/arrows/chevron-first.tsx) | lucide | previous, music |
| `ChevronLastIcon` | `@mdevs/icons/arrows/chevron-last` | [chevron-last.svg](../../svg/arrows/chevron-last.svg) | [TSX](../../src/icons/arrows/chevron-last.tsx) | lucide | skip, next, music |
| `ChevronLeftIcon` | `@mdevs/icons/arrows/chevron-left` | [chevron-left.svg](../../svg/arrows/chevron-left.svg) | [TSX](../../src/icons/arrows/chevron-left.tsx) | lucide | back, previous, less than, fewer, menu, < |
| `ChevronLeftCircleIcon` | `@mdevs/icons/arrows/chevron-left-circle` | [chevron-left-circle.svg](../../svg/arrows/chevron-left-circle.svg) | [TSX](../../src/icons/arrows/chevron-left-circle.tsx) | lucide | — |
| `ChevronLeftSquareIcon` | `@mdevs/icons/arrows/chevron-left-square` | [chevron-left-square.svg](../../svg/arrows/chevron-left-square.svg) | [TSX](../../src/icons/arrows/chevron-left-square.tsx) | lucide | — |
| `ChevronRightIcon` | `@mdevs/icons/arrows/chevron-right` | [chevron-right.svg](../../svg/arrows/chevron-right.svg) | [TSX](../../src/icons/arrows/chevron-right.tsx) | lucide | forward, next, more than, greater, menu, code, coding, command line, terminal, prompt, shell, > |
| `ChevronRightCircleIcon` | `@mdevs/icons/arrows/chevron-right-circle` | [chevron-right-circle.svg](../../svg/arrows/chevron-right-circle.svg) | [TSX](../../src/icons/arrows/chevron-right-circle.tsx) | lucide | — |
| `ChevronRightSquareIcon` | `@mdevs/icons/arrows/chevron-right-square` | [chevron-right-square.svg](../../svg/arrows/chevron-right-square.svg) | [TSX](../../src/icons/arrows/chevron-right-square.tsx) | lucide | — |
| `ChevronUpIcon` | `@mdevs/icons/arrows/chevron-up` | [chevron-up.svg](../../svg/arrows/chevron-up.svg) | [TSX](../../src/icons/arrows/chevron-up.tsx) | lucide | caret, keyboard, mac, control, ctrl, superscript, exponential, power, ahead, fast, ^, dropdown |
| `ChevronUpCircleIcon` | `@mdevs/icons/arrows/chevron-up-circle` | [chevron-up-circle.svg](../../svg/arrows/chevron-up-circle.svg) | [TSX](../../src/icons/arrows/chevron-up-circle.tsx) | lucide | — |
| `ChevronUpSquareIcon` | `@mdevs/icons/arrows/chevron-up-square` | [chevron-up-square.svg](../../svg/arrows/chevron-up-square.svg) | [TSX](../../src/icons/arrows/chevron-up-square.tsx) | lucide | — |
| `CornerDownLeftIcon` | `@mdevs/icons/arrows/corner-down-left` | [corner-down-left.svg](../../svg/arrows/corner-down-left.svg) | [TSX](../../src/icons/arrows/corner-down-left.tsx) | lucide | arrow, return |
| `CornerDownRightIcon` | `@mdevs/icons/arrows/corner-down-right` | [corner-down-right.svg](../../svg/arrows/corner-down-right.svg) | [TSX](../../src/icons/arrows/corner-down-right.tsx) | lucide | arrow, indent, tab |
| `CornerLeftDownIcon` | `@mdevs/icons/arrows/corner-left-down` | [corner-left-down.svg](../../svg/arrows/corner-left-down.svg) | [TSX](../../src/icons/arrows/corner-left-down.tsx) | lucide | arrow |
| `CornerLeftUpIcon` | `@mdevs/icons/arrows/corner-left-up` | [corner-left-up.svg](../../svg/arrows/corner-left-up.svg) | [TSX](../../src/icons/arrows/corner-left-up.tsx) | lucide | arrow |
| `CornerRightDownIcon` | `@mdevs/icons/arrows/corner-right-down` | [corner-right-down.svg](../../svg/arrows/corner-right-down.svg) | [TSX](../../src/icons/arrows/corner-right-down.tsx) | lucide | arrow |
| `CornerRightUpIcon` | `@mdevs/icons/arrows/corner-right-up` | [corner-right-up.svg](../../svg/arrows/corner-right-up.svg) | [TSX](../../src/icons/arrows/corner-right-up.tsx) | lucide | arrow |
| `CornerUpLeftIcon` | `@mdevs/icons/arrows/corner-up-left` | [corner-up-left.svg](../../svg/arrows/corner-up-left.svg) | [TSX](../../src/icons/arrows/corner-up-left.tsx) | lucide | arrow |
| `CornerUpRightIcon` | `@mdevs/icons/arrows/corner-up-right` | [corner-up-right.svg](../../svg/arrows/corner-up-right.svg) | [TSX](../../src/icons/arrows/corner-up-right.tsx) | lucide | arrow |
| `FlipHorizontalIcon` | `@mdevs/icons/arrows/flip-horizontal` | [flip-horizontal.svg](../../svg/arrows/flip-horizontal.svg) | [TSX](../../src/icons/arrows/flip-horizontal.tsx) | lucide | — |
| `FlipHorizontal2Icon` | `@mdevs/icons/arrows/flip-horizontal-2` | [flip-horizontal-2.svg](../../svg/arrows/flip-horizontal-2.svg) | [TSX](../../src/icons/arrows/flip-horizontal-2.tsx) | lucide | — |
| `FlipVerticalIcon` | `@mdevs/icons/arrows/flip-vertical` | [flip-vertical.svg](../../svg/arrows/flip-vertical.svg) | [TSX](../../src/icons/arrows/flip-vertical.tsx) | lucide | — |
| `FlipVertical2Icon` | `@mdevs/icons/arrows/flip-vertical-2` | [flip-vertical-2.svg](../../svg/arrows/flip-vertical-2.svg) | [TSX](../../src/icons/arrows/flip-vertical-2.tsx) | lucide | — |
| `MoveIcon` | `@mdevs/icons/arrows/move` | [move.svg](../../svg/arrows/move.svg) | [TSX](../../src/icons/arrows/move.tsx) | lucide | arrows |
| `Move3DIcon` | `@mdevs/icons/arrows/move-3-d` | [move-3-d.svg](../../svg/arrows/move-3-d.svg) | [TSX](../../src/icons/arrows/move-3-d.tsx) | lucide | — |
| `MoveDiagonalIcon` | `@mdevs/icons/arrows/move-diagonal` | [move-diagonal.svg](../../svg/arrows/move-diagonal.svg) | [TSX](../../src/icons/arrows/move-diagonal.tsx) | lucide | double, arrow |
| `MoveDiagonal2Icon` | `@mdevs/icons/arrows/move-diagonal-2` | [move-diagonal-2.svg](../../svg/arrows/move-diagonal-2.svg) | [TSX](../../src/icons/arrows/move-diagonal-2.tsx) | lucide | double, arrow |
| `MoveDownIcon` | `@mdevs/icons/arrows/move-down` | [move-down.svg](../../svg/arrows/move-down.svg) | [TSX](../../src/icons/arrows/move-down.tsx) | lucide | arrow, direction, downwards, south |
| `MoveDownLeftIcon` | `@mdevs/icons/arrows/move-down-left` | [move-down-left.svg](../../svg/arrows/move-down-left.svg) | [TSX](../../src/icons/arrows/move-down-left.tsx) | lucide | arrow, direction |
| `MoveDownRightIcon` | `@mdevs/icons/arrows/move-down-right` | [move-down-right.svg](../../svg/arrows/move-down-right.svg) | [TSX](../../src/icons/arrows/move-down-right.tsx) | lucide | arrow, direction |
| `MoveHorizontalIcon` | `@mdevs/icons/arrows/move-horizontal` | [move-horizontal.svg](../../svg/arrows/move-horizontal.svg) | [TSX](../../src/icons/arrows/move-horizontal.tsx) | lucide | double, arrow |
| `MoveLeftIcon` | `@mdevs/icons/arrows/move-left` | [move-left.svg](../../svg/arrows/move-left.svg) | [TSX](../../src/icons/arrows/move-left.tsx) | lucide | arrow, direction, back, west |
| `MoveRightIcon` | `@mdevs/icons/arrows/move-right` | [move-right.svg](../../svg/arrows/move-right.svg) | [TSX](../../src/icons/arrows/move-right.tsx) | lucide | arrow, direction, trend flat, east |
| `MoveUpIcon` | `@mdevs/icons/arrows/move-up` | [move-up.svg](../../svg/arrows/move-up.svg) | [TSX](../../src/icons/arrows/move-up.tsx) | lucide | arrow, direction, upwards, north |
| `MoveUpLeftIcon` | `@mdevs/icons/arrows/move-up-left` | [move-up-left.svg](../../svg/arrows/move-up-left.svg) | [TSX](../../src/icons/arrows/move-up-left.tsx) | lucide | arrow, direction |
| `MoveUpRightIcon` | `@mdevs/icons/arrows/move-up-right` | [move-up-right.svg](../../svg/arrows/move-up-right.svg) | [TSX](../../src/icons/arrows/move-up-right.tsx) | lucide | arrow, direction |
| `MoveVerticalIcon` | `@mdevs/icons/arrows/move-vertical` | [move-vertical.svg](../../svg/arrows/move-vertical.svg) | [TSX](../../src/icons/arrows/move-vertical.tsx) | lucide | double, arrow |
| `RedoIcon` | `@mdevs/icons/arrows/redo` | [redo.svg](../../svg/arrows/redo.svg) | [TSX](../../src/icons/arrows/redo.tsx) | lucide | undo, rerun, history |
| `Redo2Icon` | `@mdevs/icons/arrows/redo-2` | [redo-2.svg](../../svg/arrows/redo-2.svg) | [TSX](../../src/icons/arrows/redo-2.tsx) | lucide | undo, rerun, history |
| `RedoDotIcon` | `@mdevs/icons/arrows/redo-dot` | [redo-dot.svg](../../svg/arrows/redo-dot.svg) | [TSX](../../src/icons/arrows/redo-dot.tsx) | lucide | redo, history, step, over, forward |
| `Rotate3DIcon` | `@mdevs/icons/arrows/rotate-3-d` | [rotate-3-d.svg](../../svg/arrows/rotate-3-d.svg) | [TSX](../../src/icons/arrows/rotate-3-d.tsx) | lucide | — |
| `RotateCcwIcon` | `@mdevs/icons/arrows/rotate-ccw` | [rotate-ccw.svg](../../svg/arrows/rotate-ccw.svg) | [TSX](../../src/icons/arrows/rotate-ccw.tsx) | lucide | arrow, left, counter-clockwise, restart, reload, rerun, refresh, backup, undo, replay, redo, retry, rewind, reverse |
| `RotateCcwKeyIcon` | `@mdevs/icons/arrows/rotate-ccw-key` | [rotate-ccw-key.svg](../../svg/arrows/rotate-ccw-key.svg) | [TSX](../../src/icons/arrows/rotate-ccw-key.tsx) | lucide | password, key, refresh, change |
| `RotateCcwSquareIcon` | `@mdevs/icons/arrows/rotate-ccw-square` | [rotate-ccw-square.svg](../../svg/arrows/rotate-ccw-square.svg) | [TSX](../../src/icons/arrows/rotate-ccw-square.tsx) | lucide | left, counter-clockwise, rotate, image, 90, 45, degrees, ° |
| `RotateCwIcon` | `@mdevs/icons/arrows/rotate-cw` | [rotate-cw.svg](../../svg/arrows/rotate-cw.svg) | [TSX](../../src/icons/arrows/rotate-cw.tsx) | lucide | arrow, right, clockwise, refresh, reload, rerun, redo |
| `RotateCwClockIcon` | `@mdevs/icons/arrows/rotate-cw-clock` | [rotate-cw-clock.svg](../../svg/arrows/rotate-cw-clock.svg) | [TSX](../../src/icons/arrows/rotate-cw-clock.tsx) | lucide | modify, edit, refresh, sync, renew, revision, settings, adjust, upgrade, time, timeline, version, time machine, backup, clockwise, arrow, reload, rerun, synchronize, circular, cycle, update |
| `RotateCwFadingClockIcon` | `@mdevs/icons/arrows/rotate-cw-fading-clock` | [rotate-cw-fading-clock.svg](../../svg/arrows/rotate-cw-fading-clock.svg) | [TSX](../../src/icons/arrows/rotate-cw-fading-clock.tsx) | lucide | clock, waiting, schedule, hourglass, loading, pause, pending, time, watch |
| `RotateCwSquareIcon` | `@mdevs/icons/arrows/rotate-cw-square` | [rotate-cw-square.svg](../../svg/arrows/rotate-cw-square.svg) | [TSX](../../src/icons/arrows/rotate-cw-square.tsx) | lucide | right, clockwise, rotate, image, 90, 45, degrees, ° |
| `UndoIcon` | `@mdevs/icons/arrows/undo` | [undo.svg](../../svg/arrows/undo.svg) | [TSX](../../src/icons/arrows/undo.tsx) | lucide | redo, rerun, history |
| `Undo2Icon` | `@mdevs/icons/arrows/undo-2` | [undo-2.svg](../../svg/arrows/undo-2.svg) | [TSX](../../src/icons/arrows/undo-2.tsx) | lucide | redo, rerun, history, back, return, reverse, revert, direction, u-turn |
| `UndoDotIcon` | `@mdevs/icons/arrows/undo-dot` | [undo-dot.svg](../../svg/arrows/undo-dot.svg) | [TSX](../../src/icons/arrows/undo-dot.tsx) | lucide | redo, history, step, back |

## Recherche et traçabilité

Le [manifeste global](../manifest.json) fournit name, slug, category, tags, import, svg, source et geometryHash pour chaque entrée. Copier le nom exact ; ne pas inventer de suffixe ni reprendre un alias non sélectionné d’un projet source. geometryHash identifie la géométrie normalisée ; les variantes de taille/couleur ne sont pas de nouvelles icônes.

## Licences et redistribution

Conserver [NOTICE.md](../../NOTICE.md), [la licence du wrapper](../../LICENSE), [LICENSE-LUCIDE](../../LICENSE-LUCIDE) et [LICENSE-TABLER](../../LICENSE-TABLER). Les géométries sont issues des versions indiquées dans le manifeste ; elles ne sont pas présentées comme des dessins originaux Mdevs.

## Repères pour les agents

- [Instructions du package](../../AGENTS.md).
- [API et provenance détaillées](../docs/ICONS.md).
- [Guide général des agents](../docs/AI_AGENTS.md).
- [Wrapper createIcon et types](../../src/create-icon.tsx).

Dans le monorepo, préfixer les chemins de fichiers par packages/icons/. Dans le package installé, les mêmes sources et SVG se trouvent sous node_modules/@mdevs/icons/. Aucune feuille CSS UI n’est nécessaire pour utiliser ces icônes seules.
