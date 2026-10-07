# Symboles — icônes

102 icônes de la catégorie `symbols`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (65), tabler (37). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {AArrowDownIcon} from '@mdevs/icons';
// Alternatives :
import {AArrowDownIcon} from '@mdevs/icons/symbols';
import {AArrowDownIcon} from '@mdevs/icons/symbols/a-arrow-down';
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
import {AArrowDownIcon} from '@mdevs/icons/symbols/a-arrow-down';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><AArrowDownIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <AArrowDownIcon size={32} title="Symboles" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `AArrowDownIcon` | `@mdevs/icons/symbols/a-arrow-down` | [a-arrow-down.svg](../../svg/symbols/a-arrow-down.svg) | [TSX](../../src/icons/symbols/a-arrow-down.tsx) | lucide | letter, font size, text, formatting, smaller |
| `AArrowUpIcon` | `@mdevs/icons/symbols/a-arrow-up` | [a-arrow-up.svg](../../svg/symbols/a-arrow-up.svg) | [TSX](../../src/icons/symbols/a-arrow-up.tsx) | lucide | letter, font size, text, formatting, larger, bigger |
| `ABIcon` | `@mdevs/icons/symbols/a-b` | [a-b.svg](../../svg/symbols/a-b.svg) | [TSX](../../src/icons/symbols/a-b.tsx) | tabler | test, visual, user, programming, software, coding, technical, developer, a, b |
| `AB2Icon` | `@mdevs/icons/symbols/a-b-2` | [a-b-2.svg](../../svg/symbols/a-b-2.svg) | [TSX](../../src/icons/symbols/a-b-2.tsx) | tabler | test, visual, user, design, a, b, 2 |
| `ABOffIcon` | `@mdevs/icons/symbols/a-b-off` | [a-b-off.svg](../../svg/symbols/a-b-off.svg) | [TSX](../../src/icons/symbols/a-b-off.tsx) | tabler | test, visual, user, off, disabled, inactive, a, b |
| `ALargeSmallIcon` | `@mdevs/icons/symbols/a-large-small` | [a-large-small.svg](../../svg/symbols/a-large-small.svg) | [TSX](../../src/icons/symbols/a-large-small.tsx) | lucide | letter, font size, text, formatting |
| `AlignBoxBottomCenterIcon` | `@mdevs/icons/symbols/align-box-bottom-center` | [align-box-bottom-center.svg](../../svg/symbols/align-box-bottom-center.svg) | [TSX](../../src/icons/symbols/align-box-bottom-center.tsx) | tabler | text, type, down, south, align, box, bottom, center, typography, writing |
| `AlignBoxBottomLeftIcon` | `@mdevs/icons/symbols/align-box-bottom-left` | [align-box-bottom-left.svg](../../svg/symbols/align-box-bottom-left.svg) | [TSX](../../src/icons/symbols/align-box-bottom-left.tsx) | tabler | text, type, west, corner, align, box, bottom, left, typography, writing |
| `AlignBoxBottomRightIcon` | `@mdevs/icons/symbols/align-box-bottom-right` | [align-box-bottom-right.svg](../../svg/symbols/align-box-bottom-right.svg) | [TSX](../../src/icons/symbols/align-box-bottom-right.tsx) | tabler | text, type, east, corner, align, box, bottom, right, typography, writing |
| `AlignBoxCenterBottomIcon` | `@mdevs/icons/symbols/align-box-center-bottom` | [align-box-center-bottom.svg](../../svg/symbols/align-box-center-bottom.svg) | [TSX](../../src/icons/symbols/align-box-center-bottom.tsx) | tabler | arrange, organize, align, middle, bottom, balance, center, layout, adjust, format |
| `AlignBoxCenterMiddleIcon` | `@mdevs/icons/symbols/align-box-center-middle` | [align-box-center-middle.svg](../../svg/symbols/align-box-center-middle.svg) | [TSX](../../src/icons/symbols/align-box-center-middle.tsx) | tabler | text, type, line, horizontal, align, box, center, middle, typography, writing |
| `AlignBoxCenterStretchIcon` | `@mdevs/icons/symbols/align-box-center-stretch` | [align-box-center-stretch.svg](../../svg/symbols/align-box-center-stretch.svg) | [TSX](../../src/icons/symbols/align-box-center-stretch.tsx) | tabler | distribute, organize, align, stretch, center, balance, expand, even, layout, arrange |
| `AlignBoxCenterTopIcon` | `@mdevs/icons/symbols/align-box-center-top` | [align-box-center-top.svg](../../svg/symbols/align-box-center-top.svg) | [TSX](../../src/icons/symbols/align-box-center-top.tsx) | tabler | balance, arrange, organize, top, center, align, layout, position, format, adjust |
| `AlignBoxLeftBottomIcon` | `@mdevs/icons/symbols/align-box-left-bottom` | [align-box-left-bottom.svg](../../svg/symbols/align-box-left-bottom.svg) | [TSX](../../src/icons/symbols/align-box-left-bottom.tsx) | tabler | text, type, west, down, south, corner, align, box, left, bottom |
| `AlignBoxLeftMiddleIcon` | `@mdevs/icons/symbols/align-box-left-middle` | [align-box-left-middle.svg](../../svg/symbols/align-box-left-middle.svg) | [TSX](../../src/icons/symbols/align-box-left-middle.tsx) | tabler | text, type, west, align, box, left, middle, typography, writing, font |
| `AlignBoxLeftStretchIcon` | `@mdevs/icons/symbols/align-box-left-stretch` | [align-box-left-stretch.svg](../../svg/symbols/align-box-left-stretch.svg) | [TSX](../../src/icons/symbols/align-box-left-stretch.tsx) | tabler | layout, position, padding, design, interface, spacing, css, align, flex, grid |
| `AlignBoxLeftTopIcon` | `@mdevs/icons/symbols/align-box-left-top` | [align-box-left-top.svg](../../svg/symbols/align-box-left-top.svg) | [TSX](../../src/icons/symbols/align-box-left-top.tsx) | tabler | text, type, west, up, north, corner, align, box, left, top |
| `AlignBoxRightBottomIcon` | `@mdevs/icons/symbols/align-box-right-bottom` | [align-box-right-bottom.svg](../../svg/symbols/align-box-right-bottom.svg) | [TSX](../../src/icons/symbols/align-box-right-bottom.tsx) | tabler | text, type, east, down, south, corner, align, box, right, bottom |
| `AlignBoxRightMiddleIcon` | `@mdevs/icons/symbols/align-box-right-middle` | [align-box-right-middle.svg](../../svg/symbols/align-box-right-middle.svg) | [TSX](../../src/icons/symbols/align-box-right-middle.tsx) | tabler | text, type, east, align, box, right, middle, typography, writing, font |
| `AlignBoxRightStretchIcon` | `@mdevs/icons/symbols/align-box-right-stretch` | [align-box-right-stretch.svg](../../svg/symbols/align-box-right-stretch.svg) | [TSX](../../src/icons/symbols/align-box-right-stretch.tsx) | tabler | layout, position, padding, design, interface, spacing, css, align, flex, grid |
| `AlignBoxRightTopIcon` | `@mdevs/icons/symbols/align-box-right-top` | [align-box-right-top.svg](../../svg/symbols/align-box-right-top.svg) | [TSX](../../src/icons/symbols/align-box-right-top.tsx) | tabler | text, type, east, up, north, corner, align, box, right, top |
| `AlignBoxTopCenterIcon` | `@mdevs/icons/symbols/align-box-top-center` | [align-box-top-center.svg](../../svg/symbols/align-box-top-center.svg) | [TSX](../../src/icons/symbols/align-box-top-center.tsx) | tabler | text, type, up, north, align, box, top, center, typography, writing |
| `AlignCenterIcon` | `@mdevs/icons/symbols/align-center` | [align-center.svg](../../svg/symbols/align-center.svg) | [TSX](../../src/icons/symbols/align-center.tsx) | lucide | — |
| `AlignCenterHorizontalIcon` | `@mdevs/icons/symbols/align-center-horizontal` | [align-center-horizontal.svg](../../svg/symbols/align-center-horizontal.svg) | [TSX](../../src/icons/symbols/align-center-horizontal.tsx) | lucide | items, flex, justify |
| `AlignCenterVerticalIcon` | `@mdevs/icons/symbols/align-center-vertical` | [align-center-vertical.svg](../../svg/symbols/align-center-vertical.svg) | [TSX](../../src/icons/symbols/align-center-vertical.tsx) | lucide | items, flex, justify |
| `AlignEndHorizontalIcon` | `@mdevs/icons/symbols/align-end-horizontal` | [align-end-horizontal.svg](../../svg/symbols/align-end-horizontal.svg) | [TSX](../../src/icons/symbols/align-end-horizontal.tsx) | lucide | items, bottom, flex, justify |
| `AlignEndVerticalIcon` | `@mdevs/icons/symbols/align-end-vertical` | [align-end-vertical.svg](../../svg/symbols/align-end-vertical.svg) | [TSX](../../src/icons/symbols/align-end-vertical.tsx) | lucide | items, right, flex, justify |
| `AlignHorizontalDistributeCenterIcon` | `@mdevs/icons/symbols/align-horizontal-distribute-center` | [align-horizontal-distribute-center.svg](../../svg/symbols/align-horizontal-distribute-center.svg) | [TSX](../../src/icons/symbols/align-horizontal-distribute-center.tsx) | lucide | items, flex, justify, space, evenly, around |
| `AlignHorizontalDistributeEndIcon` | `@mdevs/icons/symbols/align-horizontal-distribute-end` | [align-horizontal-distribute-end.svg](../../svg/symbols/align-horizontal-distribute-end.svg) | [TSX](../../src/icons/symbols/align-horizontal-distribute-end.tsx) | lucide | right, items, flex, justify |
| `AlignHorizontalDistributeStartIcon` | `@mdevs/icons/symbols/align-horizontal-distribute-start` | [align-horizontal-distribute-start.svg](../../svg/symbols/align-horizontal-distribute-start.svg) | [TSX](../../src/icons/symbols/align-horizontal-distribute-start.tsx) | lucide | left, items, flex, justify |
| `AlignHorizontalJustifyCenterIcon` | `@mdevs/icons/symbols/align-horizontal-justify-center` | [align-horizontal-justify-center.svg](../../svg/symbols/align-horizontal-justify-center.svg) | [TSX](../../src/icons/symbols/align-horizontal-justify-center.tsx) | lucide | center, items, flex, justify |
| `AlignHorizontalJustifyEndIcon` | `@mdevs/icons/symbols/align-horizontal-justify-end` | [align-horizontal-justify-end.svg](../../svg/symbols/align-horizontal-justify-end.svg) | [TSX](../../src/icons/symbols/align-horizontal-justify-end.tsx) | lucide | right, items, flex, justify |
| `AlignHorizontalJustifyStartIcon` | `@mdevs/icons/symbols/align-horizontal-justify-start` | [align-horizontal-justify-start.svg](../../svg/symbols/align-horizontal-justify-start.svg) | [TSX](../../src/icons/symbols/align-horizontal-justify-start.tsx) | lucide | left, items, flex, justify |
| `AlignHorizontalSpaceAroundIcon` | `@mdevs/icons/symbols/align-horizontal-space-around` | [align-horizontal-space-around.svg](../../svg/symbols/align-horizontal-space-around.svg) | [TSX](../../src/icons/symbols/align-horizontal-space-around.tsx) | lucide | center, items, flex, justify, distribute, between |
| `AlignHorizontalSpaceBetweenIcon` | `@mdevs/icons/symbols/align-horizontal-space-between` | [align-horizontal-space-between.svg](../../svg/symbols/align-horizontal-space-between.svg) | [TSX](../../src/icons/symbols/align-horizontal-space-between.tsx) | lucide | around, items, bottom, flex, justify |
| `AlignJustifyIcon` | `@mdevs/icons/symbols/align-justify` | [align-justify.svg](../../svg/symbols/align-justify.svg) | [TSX](../../src/icons/symbols/align-justify.tsx) | lucide | — |
| `AlignLeftIcon` | `@mdevs/icons/symbols/align-left` | [align-left.svg](../../svg/symbols/align-left.svg) | [TSX](../../src/icons/symbols/align-left.tsx) | lucide | — |
| `AlignRightIcon` | `@mdevs/icons/symbols/align-right` | [align-right.svg](../../svg/symbols/align-right.svg) | [TSX](../../src/icons/symbols/align-right.tsx) | lucide | — |
| `AlignStartHorizontalIcon` | `@mdevs/icons/symbols/align-start-horizontal` | [align-start-horizontal.svg](../../svg/symbols/align-start-horizontal.svg) | [TSX](../../src/icons/symbols/align-start-horizontal.tsx) | lucide | top, items, flex, justify |
| `AlignStartVerticalIcon` | `@mdevs/icons/symbols/align-start-vertical` | [align-start-vertical.svg](../../svg/symbols/align-start-vertical.svg) | [TSX](../../src/icons/symbols/align-start-vertical.tsx) | lucide | left, items, flex, justify |
| `AlignVerticalDistributeCenterIcon` | `@mdevs/icons/symbols/align-vertical-distribute-center` | [align-vertical-distribute-center.svg](../../svg/symbols/align-vertical-distribute-center.svg) | [TSX](../../src/icons/symbols/align-vertical-distribute-center.tsx) | lucide | items, flex, justify, space, evenly, around |
| `AlignVerticalDistributeEndIcon` | `@mdevs/icons/symbols/align-vertical-distribute-end` | [align-vertical-distribute-end.svg](../../svg/symbols/align-vertical-distribute-end.svg) | [TSX](../../src/icons/symbols/align-vertical-distribute-end.tsx) | lucide | bottom, items, flex, justify |
| `AlignVerticalDistributeStartIcon` | `@mdevs/icons/symbols/align-vertical-distribute-start` | [align-vertical-distribute-start.svg](../../svg/symbols/align-vertical-distribute-start.svg) | [TSX](../../src/icons/symbols/align-vertical-distribute-start.tsx) | lucide | top, items, flex, justify |
| `AlignVerticalJustifyCenterIcon` | `@mdevs/icons/symbols/align-vertical-justify-center` | [align-vertical-justify-center.svg](../../svg/symbols/align-vertical-justify-center.svg) | [TSX](../../src/icons/symbols/align-vertical-justify-center.tsx) | lucide | center, items, flex, justify, distribute, between |
| `AlignVerticalJustifyEndIcon` | `@mdevs/icons/symbols/align-vertical-justify-end` | [align-vertical-justify-end.svg](../../svg/symbols/align-vertical-justify-end.svg) | [TSX](../../src/icons/symbols/align-vertical-justify-end.tsx) | lucide | bottom, items, flex, justify, distribute, between |
| `AlignVerticalJustifyStartIcon` | `@mdevs/icons/symbols/align-vertical-justify-start` | [align-vertical-justify-start.svg](../../svg/symbols/align-vertical-justify-start.svg) | [TSX](../../src/icons/symbols/align-vertical-justify-start.tsx) | lucide | top, items, flex, justify, distribute, between |
| `AlignVerticalSpaceAroundIcon` | `@mdevs/icons/symbols/align-vertical-space-around` | [align-vertical-space-around.svg](../../svg/symbols/align-vertical-space-around.svg) | [TSX](../../src/icons/symbols/align-vertical-space-around.tsx) | lucide | center, items, flex, justify, distribute, between |
| `AlignVerticalSpaceBetweenIcon` | `@mdevs/icons/symbols/align-vertical-space-between` | [align-vertical-space-between.svg](../../svg/symbols/align-vertical-space-between.svg) | [TSX](../../src/icons/symbols/align-vertical-space-between.tsx) | lucide | center, items, flex, justify, distribute, between |
| `AmpersandIcon` | `@mdevs/icons/symbols/ampersand` | [ampersand.svg](../../svg/symbols/ampersand.svg) | [TSX](../../src/icons/symbols/ampersand.tsx) | lucide | and, typography, operator, join, concatenate, code, & |
| `AsteriskIcon` | `@mdevs/icons/symbols/asterisk` | [asterisk.svg](../../svg/symbols/asterisk.svg) | [TSX](../../src/icons/symbols/asterisk.tsx) | lucide | symbol, sterisk, mark, pointer, pencil, sign, alert, notification, indicator, symbolic, reference, times, multiply, multiplication, operator, code, glob pattern, wildcard, * |
| `AsteriskSquareIcon` | `@mdevs/icons/symbols/asterisk-square` | [asterisk-square.svg](../../svg/symbols/asterisk-square.svg) | [TSX](../../src/icons/symbols/asterisk-square.tsx) | lucide | — |
| `BoldIcon` | `@mdevs/icons/symbols/bold` | [bold.svg](../../svg/symbols/bold.svg) | [TSX](../../src/icons/symbols/bold.tsx) | lucide | text, strong, format |
| `DivideIcon` | `@mdevs/icons/symbols/divide` | [divide.svg](../../svg/symbols/divide.svg) | [TSX](../../src/icons/symbols/divide.tsx) | lucide | calculate, math, division, operator, code, ÷, / |
| `DivideSquareIcon` | `@mdevs/icons/symbols/divide-square` | [divide-square.svg](../../svg/symbols/divide-square.svg) | [TSX](../../src/icons/symbols/divide-square.tsx) | lucide | — |
| `EqualIcon` | `@mdevs/icons/symbols/equal` | [equal.svg](../../svg/symbols/equal.svg) | [TSX](../../src/icons/symbols/equal.tsx) | lucide | calculate, math, operator, assignment, code, = |
| `EqualApproximatelyIcon` | `@mdevs/icons/symbols/equal-approximately` | [equal-approximately.svg](../../svg/symbols/equal-approximately.svg) | [TSX](../../src/icons/symbols/equal-approximately.tsx) | lucide | about, calculate, math, operator |
| `EqualApproximatelyNotIcon` | `@mdevs/icons/symbols/equal-approximately-not` | [equal-approximately-not.svg](../../svg/symbols/equal-approximately-not.svg) | [TSX](../../src/icons/symbols/equal-approximately-not.tsx) | lucide | calculate, math, operator, not, approximately, unequal, code, ≇, tolerance, threshold, mismatch, comparison, assertion, variance |
| `EqualDoubleIcon` | `@mdevs/icons/symbols/equal-double` | [equal-double.svg](../../svg/symbols/equal-double.svg) | [TSX](../../src/icons/symbols/equal-double.tsx) | tabler | coding, programming, code, sign, equal, double, calculation, equation, mathematics, numeric |
| `EqualNotIcon` | `@mdevs/icons/symbols/equal-not` | [equal-not.svg](../../svg/symbols/equal-not.svg) | [TSX](../../src/icons/symbols/equal-not.tsx) | lucide | calculate, off, math, operator, code, ≠ |
| `EqualSquareIcon` | `@mdevs/icons/symbols/equal-square` | [equal-square.svg](../../svg/symbols/equal-square.svg) | [TSX](../../src/icons/symbols/equal-square.tsx) | lucide | — |
| `HashIcon` | `@mdevs/icons/symbols/hash` | [hash.svg](../../svg/symbols/hash.svg) | [TSX](../../src/icons/symbols/hash.tsx) | lucide | hashtag, number, pound |
| `HeadingIcon` | `@mdevs/icons/symbols/heading` | [heading.svg](../../svg/symbols/heading.svg) | [TSX](../../src/icons/symbols/heading.tsx) | lucide | h1, html, markup, markdown |
| `Heading1Icon` | `@mdevs/icons/symbols/heading-1` | [heading-1.svg](../../svg/symbols/heading-1.svg) | [TSX](../../src/icons/symbols/heading-1.tsx) | lucide | h1, html, markup, markdown |
| `Heading2Icon` | `@mdevs/icons/symbols/heading-2` | [heading-2.svg](../../svg/symbols/heading-2.svg) | [TSX](../../src/icons/symbols/heading-2.tsx) | lucide | h2, html, markup, markdown |
| `Heading3Icon` | `@mdevs/icons/symbols/heading-3` | [heading-3.svg](../../svg/symbols/heading-3.svg) | [TSX](../../src/icons/symbols/heading-3.tsx) | lucide | h3, html, markup, markdown |
| `Heading4Icon` | `@mdevs/icons/symbols/heading-4` | [heading-4.svg](../../svg/symbols/heading-4.svg) | [TSX](../../src/icons/symbols/heading-4.tsx) | lucide | h4, html, markup, markdown |
| `Heading5Icon` | `@mdevs/icons/symbols/heading-5` | [heading-5.svg](../../svg/symbols/heading-5.svg) | [TSX](../../src/icons/symbols/heading-5.tsx) | lucide | h5, html, markup, markdown |
| `Heading6Icon` | `@mdevs/icons/symbols/heading-6` | [heading-6.svg](../../svg/symbols/heading-6.svg) | [TSX](../../src/icons/symbols/heading-6.tsx) | lucide | h6, html, markup, markdown |
| `ItalicIcon` | `@mdevs/icons/symbols/italic` | [italic.svg](../../svg/symbols/italic.svg) | [TSX](../../src/icons/symbols/italic.tsx) | lucide | oblique, text, format |
| `LetterASmallIcon` | `@mdevs/icons/symbols/letter-a-small` | [letter-a-small.svg](../../svg/symbols/letter-a-small.svg) | [TSX](../../src/icons/symbols/letter-a-small.tsx) | tabler | a, alpha, alphabet, first, letter, initial, character, typeface, glyph, script |
| `LetterBSmallIcon` | `@mdevs/icons/symbols/letter-b-small` | [letter-b-small.svg](../../svg/symbols/letter-b-small.svg) | [TSX](../../src/icons/symbols/letter-b-small.tsx) | tabler | b, beta, second, letter, alphabet, character, typeface, glyph, script, small |
| `LetterCSmallIcon` | `@mdevs/icons/symbols/letter-c-small` | [letter-c-small.svg](../../svg/symbols/letter-c-small.svg) | [TSX](../../src/icons/symbols/letter-c-small.tsx) | tabler | c, charlie, third, letter, alphabet, character, typeface, glyph, script, small |
| `LetterDSmallIcon` | `@mdevs/icons/symbols/letter-d-small` | [letter-d-small.svg](../../svg/symbols/letter-d-small.svg) | [TSX](../../src/icons/symbols/letter-d-small.tsx) | tabler | d, delta, fourth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterESmallIcon` | `@mdevs/icons/symbols/letter-e-small` | [letter-e-small.svg](../../svg/symbols/letter-e-small.svg) | [TSX](../../src/icons/symbols/letter-e-small.tsx) | tabler | e, echo, fifth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterFSmallIcon` | `@mdevs/icons/symbols/letter-f-small` | [letter-f-small.svg](../../svg/symbols/letter-f-small.svg) | [TSX](../../src/icons/symbols/letter-f-small.tsx) | tabler | f, foxtrot, sixth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterGSmallIcon` | `@mdevs/icons/symbols/letter-g-small` | [letter-g-small.svg](../../svg/symbols/letter-g-small.svg) | [TSX](../../src/icons/symbols/letter-g-small.tsx) | tabler | g, golf, seventh, letter, alphabet, character, typeface, glyph, script, small |
| `LetterHSmallIcon` | `@mdevs/icons/symbols/letter-h-small` | [letter-h-small.svg](../../svg/symbols/letter-h-small.svg) | [TSX](../../src/icons/symbols/letter-h-small.tsx) | tabler | h, hotel, eighth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterISmallIcon` | `@mdevs/icons/symbols/letter-i-small` | [letter-i-small.svg](../../svg/symbols/letter-i-small.svg) | [TSX](../../src/icons/symbols/letter-i-small.tsx) | tabler | i, india, ninth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterJSmallIcon` | `@mdevs/icons/symbols/letter-j-small` | [letter-j-small.svg](../../svg/symbols/letter-j-small.svg) | [TSX](../../src/icons/symbols/letter-j-small.tsx) | tabler | j, juliett, tenth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterKSmallIcon` | `@mdevs/icons/symbols/letter-k-small` | [letter-k-small.svg](../../svg/symbols/letter-k-small.svg) | [TSX](../../src/icons/symbols/letter-k-small.tsx) | tabler | k, kilo, eleventh, letter, alphabet, character, typeface, glyph, script, small |
| `LetterLSmallIcon` | `@mdevs/icons/symbols/letter-l-small` | [letter-l-small.svg](../../svg/symbols/letter-l-small.svg) | [TSX](../../src/icons/symbols/letter-l-small.tsx) | tabler | l, lima, twelfth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterMSmallIcon` | `@mdevs/icons/symbols/letter-m-small` | [letter-m-small.svg](../../svg/symbols/letter-m-small.svg) | [TSX](../../src/icons/symbols/letter-m-small.tsx) | tabler | m, mike, thirteenth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterNSmallIcon` | `@mdevs/icons/symbols/letter-n-small` | [letter-n-small.svg](../../svg/symbols/letter-n-small.svg) | [TSX](../../src/icons/symbols/letter-n-small.tsx) | tabler | n, november, fourteenth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterOSmallIcon` | `@mdevs/icons/symbols/letter-o-small` | [letter-o-small.svg](../../svg/symbols/letter-o-small.svg) | [TSX](../../src/icons/symbols/letter-o-small.tsx) | tabler | o, oscar, fifteenth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterPSmallIcon` | `@mdevs/icons/symbols/letter-p-small` | [letter-p-small.svg](../../svg/symbols/letter-p-small.svg) | [TSX](../../src/icons/symbols/letter-p-small.tsx) | tabler | p, papa, sixteenth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterQSmallIcon` | `@mdevs/icons/symbols/letter-q-small` | [letter-q-small.svg](../../svg/symbols/letter-q-small.svg) | [TSX](../../src/icons/symbols/letter-q-small.tsx) | tabler | q, quebec, seventeenth, letter, alphabet, character, typeface, glyph, script, small |
| `LetterTextIcon` | `@mdevs/icons/symbols/letter-text` | [letter-text.svg](../../svg/symbols/letter-text.svg) | [TSX](../../src/icons/symbols/letter-text.tsx) | lucide | — |
| `ParenthesesIcon` | `@mdevs/icons/symbols/parentheses` | [parentheses.svg](../../svg/symbols/parentheses.svg) | [TSX](../../src/icons/symbols/parentheses.tsx) | lucide | code, token, parenthesis, parens, brackets, parameters, arguments, args, input, call, math, formula, function, (, ) |
| `QuoteIcon` | `@mdevs/icons/symbols/quote` | [quote.svg](../../svg/symbols/quote.svg) | [TSX](../../src/icons/symbols/quote.tsx) | lucide | quotation |
| `SubscriptIcon` | `@mdevs/icons/symbols/subscript` | [subscript.svg](../../svg/symbols/subscript.svg) | [TSX](../../src/icons/symbols/subscript.tsx) | lucide | text |
| `SuperscriptIcon` | `@mdevs/icons/symbols/superscript` | [superscript.svg](../../svg/symbols/superscript.svg) | [TSX](../../src/icons/symbols/superscript.tsx) | lucide | text, exponent |
| `TextAlignJustifyCenterIcon` | `@mdevs/icons/symbols/text-align-justify-center` | [text-align-justify-center.svg](../../svg/symbols/text-align-justify-center.svg) | [TSX](../../src/icons/symbols/text-align-justify-center.tsx) | lucide | paragraph, alignment, justified, center, middle, typography, editor, document |
| `TextAlignJustifyEndIcon` | `@mdevs/icons/symbols/text-align-justify-end` | [text-align-justify-end.svg](../../svg/symbols/text-align-justify-end.svg) | [TSX](../../src/icons/symbols/text-align-justify-end.tsx) | lucide | paragraph, alignment, justified, right, end, typography, editor, document |
| `TextAlignJustifyStartIcon` | `@mdevs/icons/symbols/text-align-justify-start` | [text-align-justify-start.svg](../../svg/symbols/text-align-justify-start.svg) | [TSX](../../src/icons/symbols/text-align-justify-start.tsx) | lucide | paragraph, alignment, justified, left, start, typography, editor, document |
| `TextCursorIcon` | `@mdevs/icons/symbols/text-cursor` | [text-cursor.svg](../../svg/symbols/text-cursor.svg) | [TSX](../../src/icons/symbols/text-cursor.tsx) | lucide | select, caret, type, typing, write, writing, edit, insert, input, textarea |
| `TextCursorInputIcon` | `@mdevs/icons/symbols/text-cursor-input` | [text-cursor-input.svg](../../svg/symbols/text-cursor-input.svg) | [TSX](../../src/icons/symbols/text-cursor-input.tsx) | lucide | select |
| `TextQuoteIcon` | `@mdevs/icons/symbols/text-quote` | [text-quote.svg](../../svg/symbols/text-quote.svg) | [TSX](../../src/icons/symbols/text-quote.tsx) | lucide | blockquote, quotation, indent, reply, response |
| `TextSearchIcon` | `@mdevs/icons/symbols/text-search` | [text-search.svg](../../svg/symbols/text-search.svg) | [TSX](../../src/icons/symbols/text-search.tsx) | lucide | find, data, copy, txt, pdf, document, scan, magnifier, magnifying glass, lens |
| `TextWrapIcon` | `@mdevs/icons/symbols/text-wrap` | [text-wrap.svg](../../svg/symbols/text-wrap.svg) | [TSX](../../src/icons/symbols/text-wrap.tsx) | lucide | words, lines, break, paragraph |
| `TypeIcon` | `@mdevs/icons/symbols/type` | [type.svg](../../svg/symbols/type.svg) | [TSX](../../src/icons/symbols/type.tsx) | lucide | text, font, typography |
| `TypeOutlineIcon` | `@mdevs/icons/symbols/type-outline` | [type-outline.svg](../../svg/symbols/type-outline.svg) | [TSX](../../src/icons/symbols/type-outline.tsx) | lucide | text, font, typography, silhouette, profile, contour, stroke, line |
| `UnderlineIcon` | `@mdevs/icons/symbols/underline` | [underline.svg](../../svg/symbols/underline.svg) | [TSX](../../src/icons/symbols/underline.tsx) | lucide | text, format |

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
