# Interface — icônes

124 icônes de la catégorie `interface`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (113), tabler (11). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {CircleIcon} from '@mdevs/icons';
// Alternatives :
import {CircleIcon} from '@mdevs/icons/interface';
import {CircleIcon} from '@mdevs/icons/interface/circle';
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
import {CircleIcon} from '@mdevs/icons/interface/circle';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><CircleIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <CircleIcon size={32} title="Interface" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `CircleIcon` | `@mdevs/icons/interface/circle` | [circle.svg](../../svg/interface/circle.svg) | [TSX](../../src/icons/interface/circle.tsx) | lucide | off, zero, record, shape |
| `CircleAsteriskIcon` | `@mdevs/icons/interface/circle-asterisk` | [circle-asterisk.svg](../../svg/interface/circle-asterisk.svg) | [TSX](../../src/icons/interface/circle-asterisk.tsx) | tabler | circle, asterisk, star, symbol, shape, mark, required, mandatory, important, password |
| `CircleCheckIcon` | `@mdevs/icons/interface/circle-check` | [circle-check.svg](../../svg/interface/circle-check.svg) | [TSX](../../src/icons/interface/circle-check.tsx) | tabler | accept, yes, tick, done, circle, check, round, circular, confirm, approve |
| `CircleDashedIcon` | `@mdevs/icons/interface/circle-dashed` | [circle-dashed.svg](../../svg/interface/circle-dashed.svg) | [TSX](../../src/icons/interface/circle-dashed.tsx) | lucide | pending, dot, progress, issue, draft, code, coding, version control |
| `CircleDashedCheckIcon` | `@mdevs/icons/interface/circle-dashed-check` | [circle-dashed-check.svg](../../svg/interface/circle-dashed-check.svg) | [TSX](../../src/icons/interface/circle-dashed-check.tsx) | lucide | approved, pending, changes, revision, reapproval, published, schedule, assignment, request, review, progress, issue, draft, code, coding, version control |
| `CircleDashedMinusIcon` | `@mdevs/icons/interface/circle-dashed-minus` | [circle-dashed-minus.svg](../../svg/interface/circle-dashed-minus.svg) | [TSX](../../src/icons/interface/circle-dashed-minus.tsx) | tabler | subtract, minus-symbol, decrease, negative, remove, less, reduce, takeaway, deduct, negate |
| `CircleDashedPercentageIcon` | `@mdevs/icons/interface/circle-dashed-percentage` | [circle-dashed-percentage.svg](../../svg/interface/circle-dashed-percentage.svg) | [TSX](../../src/icons/interface/circle-dashed-percentage.tsx) | tabler | percent, ratio, portion, fraction, rate, 100, per, decimal, markup, discount |
| `CircleDashedPlusIcon` | `@mdevs/icons/interface/circle-dashed-plus` | [circle-dashed-plus.svg](../../svg/interface/circle-dashed-plus.svg) | [TSX](../../src/icons/interface/circle-dashed-plus.tsx) | tabler | add, plus-symbol, increase, positive, augment, more, addition, enhance, supplement, plus-sign |
| `CircleDashedXIcon` | `@mdevs/icons/interface/circle-dashed-x` | [circle-dashed-x.svg](../../svg/interface/circle-dashed-x.svg) | [TSX](../../src/icons/interface/circle-dashed-x.tsx) | tabler | cancel, multiply, close, cross, deny, exit, remove, reject, eliminate, terminate |
| `CircleDivideIcon` | `@mdevs/icons/interface/circle-divide` | [circle-divide.svg](../../svg/interface/circle-divide.svg) | [TSX](../../src/icons/interface/circle-divide.tsx) | lucide | calculate, math, ÷, / |
| `CircleDollarSignIcon` | `@mdevs/icons/interface/circle-dollar-sign` | [circle-dollar-sign.svg](../../svg/interface/circle-dollar-sign.svg) | [TSX](../../src/icons/interface/circle-dollar-sign.tsx) | lucide | monetization, marketing, currency, money, payment |
| `CircleDotIcon` | `@mdevs/icons/interface/circle-dot` | [circle-dot.svg](../../svg/interface/circle-dot.svg) | [TSX](../../src/icons/interface/circle-dot.tsx) | lucide | pending, dot, progress, issue, code, coding, version control, choices, multiple choice, choose, album, music, songs, format, cd, dvd, vinyl, sleeve, cover, platinum, compilation, ep, recording, playback, spin, rotate, rpm, dj |
| `CircleDotDashedIcon` | `@mdevs/icons/interface/circle-dot-dashed` | [circle-dot-dashed.svg](../../svg/interface/circle-dot-dashed.svg) | [TSX](../../src/icons/interface/circle-dot-dashed.tsx) | lucide | pending, dot, progress, issue, draft, code, coding, version control |
| `CircleDottedIcon` | `@mdevs/icons/interface/circle-dotted` | [circle-dotted.svg](../../svg/interface/circle-dotted.svg) | [TSX](../../src/icons/interface/circle-dotted.tsx) | tabler | shape, point, check, circle, dotted, round, circular, geometry, form, figure |
| `CircleEllipsisIcon` | `@mdevs/icons/interface/circle-ellipsis` | [circle-ellipsis.svg](../../svg/interface/circle-ellipsis.svg) | [TSX](../../src/icons/interface/circle-ellipsis.tsx) | lucide | ellipsis, et cetera, etc, loader, loading, progress, pending, throbber, menu, options, operator, code, spread, rest, more, further, extra, overflow, dots, …, ... |
| `CircleEqualIcon` | `@mdevs/icons/interface/circle-equal` | [circle-equal.svg](../../svg/interface/circle-equal.svg) | [TSX](../../src/icons/interface/circle-equal.tsx) | lucide | calculate, shape, = |
| `CircleEuroIcon` | `@mdevs/icons/interface/circle-euro` | [circle-euro.svg](../../svg/interface/circle-euro.svg) | [TSX](../../src/icons/interface/circle-euro.tsx) | lucide | symbol, economy, banking, europe, €, euro, currency, money, payment, coin, finance, financial, exchange |
| `CircleFadingArrowUpIcon` | `@mdevs/icons/interface/circle-fading-arrow-up` | [circle-fading-arrow-up.svg](../../svg/interface/circle-fading-arrow-up.svg) | [TSX](../../src/icons/interface/circle-fading-arrow-up.tsx) | lucide | north, up, upgrade, improve, circle, button |
| `CircleFadingPlusIcon` | `@mdevs/icons/interface/circle-fading-plus` | [circle-fading-plus.svg](../../svg/interface/circle-fading-plus.svg) | [TSX](../../src/icons/interface/circle-fading-plus.tsx) | lucide | stories, social media, sharing, content |
| `CircleGaugeIcon` | `@mdevs/icons/interface/circle-gauge` | [circle-gauge.svg](../../svg/interface/circle-gauge.svg) | [TSX](../../src/icons/interface/circle-gauge.tsx) | lucide | dashboard, dial, meter, speed, pressure, measure, level |
| `CircleHalfIcon` | `@mdevs/icons/interface/circle-half` | [circle-half.svg](../../svg/interface/circle-half.svg) | [TSX](../../src/icons/interface/circle-half.tsx) | tabler | shape, split, slash, circle, half, round, circular, geometry, form, figure |
| `CircleHalf2Icon` | `@mdevs/icons/interface/circle-half-2` | [circle-half-2.svg](../../svg/interface/circle-half-2.svg) | [TSX](../../src/icons/interface/circle-half-2.tsx) | tabler | shape, split, slash, circle, half, round, circular, geometry, form, figure |
| `CircleHalfVerticalIcon` | `@mdevs/icons/interface/circle-half-vertical` | [circle-half-vertical.svg](../../svg/interface/circle-half-vertical.svg) | [TSX](../../src/icons/interface/circle-half-vertical.tsx) | tabler | shape, split, slash, circle, half, vertical, round, circular, geometry, form |
| `CircleHelpIcon` | `@mdevs/icons/interface/circle-help` | [circle-help.svg](../../svg/interface/circle-help.svg) | [TSX](../../src/icons/interface/circle-help.tsx) | lucide | — |
| `CircleKeyIcon` | `@mdevs/icons/interface/circle-key` | [circle-key.svg](../../svg/interface/circle-key.svg) | [TSX](../../src/icons/interface/circle-key.tsx) | tabler | shape, lock, door, acsses, circle, key, round, circular |
| `CircleMinusIcon` | `@mdevs/icons/interface/circle-minus` | [circle-minus.svg](../../svg/interface/circle-minus.svg) | [TSX](../../src/icons/interface/circle-minus.tsx) | lucide | subtract, remove, decrease, reduce, calculate, line, operator, code, coding, minimum, downgrade, - |
| `CircleOffIcon` | `@mdevs/icons/interface/circle-off` | [circle-off.svg](../../svg/interface/circle-off.svg) | [TSX](../../src/icons/interface/circle-off.tsx) | lucide | diameter, zero, Ø, nothing, null, void, cancel, ban, no, stop, forbidden, prohibited, error, incorrect, mistake, wrong, failure |
| `CircleParkingIcon` | `@mdevs/icons/interface/circle-parking` | [circle-parking.svg](../../svg/interface/circle-parking.svg) | [TSX](../../src/icons/interface/circle-parking.tsx) | lucide | parking lot, car park |
| `CircleParkingOffIcon` | `@mdevs/icons/interface/circle-parking-off` | [circle-parking-off.svg](../../svg/interface/circle-parking-off.svg) | [TSX](../../src/icons/interface/circle-parking-off.tsx) | lucide | parking lot, car park, no parking |
| `CirclePauseIcon` | `@mdevs/icons/interface/circle-pause` | [circle-pause.svg](../../svg/interface/circle-pause.svg) | [TSX](../../src/icons/interface/circle-pause.tsx) | lucide | music, audio, stop |
| `CirclePercentIcon` | `@mdevs/icons/interface/circle-percent` | [circle-percent.svg](../../svg/interface/circle-percent.svg) | [TSX](../../src/icons/interface/circle-percent.tsx) | lucide | verified, unverified, sale, discount, offer, marketing, sticker, price tag |
| `CirclePileIcon` | `@mdevs/icons/interface/circle-pile` | [circle-pile.svg](../../svg/interface/circle-pile.svg) | [TSX](../../src/icons/interface/circle-pile.tsx) | lucide | off, zero, record, shape, circle-pile, circle, pile, stack, layer, structure, form, group, collection, stock, inventory, materials, warehouse |
| `CirclePlayIcon` | `@mdevs/icons/interface/circle-play` | [circle-play.svg](../../svg/interface/circle-play.svg) | [TSX](../../src/icons/interface/circle-play.tsx) | lucide | music, start, run |
| `CirclePlusIcon` | `@mdevs/icons/interface/circle-plus` | [circle-plus.svg](../../svg/interface/circle-plus.svg) | [TSX](../../src/icons/interface/circle-plus.tsx) | lucide | add, new, increase, increment, positive, calculate, crosshair, aim, target, scope, sight, reticule, maximum, upgrade, extra, operator, join, concatenate, code, coding, + |
| `CirclePoundSterlingIcon` | `@mdevs/icons/interface/circle-pound-sterling` | [circle-pound-sterling.svg](../../svg/interface/circle-pound-sterling.svg) | [TSX](../../src/icons/interface/circle-pound-sterling.tsx) | lucide | monetization, coin, penny, marketing, currency, money, payment, british, gbp, £ |
| `CirclePowerIcon` | `@mdevs/icons/interface/circle-power` | [circle-power.svg](../../svg/interface/circle-power.svg) | [TSX](../../src/icons/interface/circle-power.tsx) | lucide | on, off, device, switch, toggle, binary, boolean, reboot, restart, button, keyboard, troubleshoot |
| `CircleSlashIcon` | `@mdevs/icons/interface/circle-slash` | [circle-slash.svg](../../svg/interface/circle-slash.svg) | [TSX](../../src/icons/interface/circle-slash.tsx) | lucide | diameter, zero, Ø, nothing, null, void, cancel, ban, no, stop, forbidden, prohibited, error, incorrect, mistake, wrong, failure, divide, division, or, / |
| `CircleSlash2Icon` | `@mdevs/icons/interface/circle-slash-2` | [circle-slash-2.svg](../../svg/interface/circle-slash-2.svg) | [TSX](../../src/icons/interface/circle-slash-2.tsx) | lucide | diameter, zero, ø, nothing, null, void, ban, math, divide, division, half, split, /, average, avg, mean, median, normal |
| `CircleSmallIcon` | `@mdevs/icons/interface/circle-small` | [circle-small.svg](../../svg/interface/circle-small.svg) | [TSX](../../src/icons/interface/circle-small.tsx) | lucide | shape, bullet, gender, genderless |
| `CircleStarIcon` | `@mdevs/icons/interface/circle-star` | [circle-star.svg](../../svg/interface/circle-star.svg) | [TSX](../../src/icons/interface/circle-star.tsx) | lucide | badge, medal, honour, decoration, order, pin, laurel, trophy, medallion, insignia, bronze, silver, gold |
| `CircleStopIcon` | `@mdevs/icons/interface/circle-stop` | [circle-stop.svg](../../svg/interface/circle-stop.svg) | [TSX](../../src/icons/interface/circle-stop.tsx) | lucide | media, music |
| `CircleUserIcon` | `@mdevs/icons/interface/circle-user` | [circle-user.svg](../../svg/interface/circle-user.svg) | [TSX](../../src/icons/interface/circle-user.tsx) | lucide | person, account, contact |
| `CircleUserRoundIcon` | `@mdevs/icons/interface/circle-user-round` | [circle-user-round.svg](../../svg/interface/circle-user-round.svg) | [TSX](../../src/icons/interface/circle-user-round.tsx) | lucide | person, account, contact |
| `CircleXIcon` | `@mdevs/icons/interface/circle-x` | [circle-x.svg](../../svg/interface/circle-x.svg) | [TSX](../../src/icons/interface/circle-x.tsx) | lucide | cancel, close, delete, remove, times, clear, error, incorrect, wrong, mistake, failure, linter, multiply, multiplication |
| `Columns2Icon` | `@mdevs/icons/interface/columns-2` | [columns-2.svg](../../svg/interface/columns-2.svg) | [TSX](../../src/icons/interface/columns-2.tsx) | lucide | lines, list, queue, preview, panel, parallel, series, split, vertical, horizontal, half, center, middle, even, sidebar, drawer, gutter, fold, reflow, typography, pagination, pages |
| `Columns3Icon` | `@mdevs/icons/interface/columns-3` | [columns-3.svg](../../svg/interface/columns-3.svg) | [TSX](../../src/icons/interface/columns-3.tsx) | lucide | lines, list, queue, preview, parallel, series, split, vertical, horizontal, thirds, triple, center, middle, alignment, even, sidebars, drawers, gutters, fold, reflow, typography, pagination, pages |
| `Columns3CogIcon` | `@mdevs/icons/interface/columns-3-cog` | [columns-3-cog.svg](../../svg/interface/columns-3-cog.svg) | [TSX](../../src/icons/interface/columns-3-cog.tsx) | lucide | columns, settings, customize, table, grid, adjust, configuration, panel, layout |
| `Columns4Icon` | `@mdevs/icons/interface/columns-4` | [columns-4.svg](../../svg/interface/columns-4.svg) | [TSX](../../src/icons/interface/columns-4.tsx) | lucide | lines, list, queue, preview, parallel, series, split, vertical, horizontal, thirds, triple, center, middle, alignment, even, sidebars, drawers, gutters, fold, reflow, typography, pagination, pages, prison, jail, bars, sentence, police, cops, cell, crime, criminal, justice, law, enforcement, grill |
| `EllipsisIcon` | `@mdevs/icons/interface/ellipsis` | [ellipsis.svg](../../svg/interface/ellipsis.svg) | [TSX](../../src/icons/interface/ellipsis.tsx) | lucide | et cetera, etc, loader, loading, progress, pending, throbber, menu, options, operator, code, coding, spread, rest, more, further, extra, overflow, dots, …, ... |
| `EllipsisVerticalIcon` | `@mdevs/icons/interface/ellipsis-vertical` | [ellipsis-vertical.svg](../../svg/interface/ellipsis-vertical.svg) | [TSX](../../src/icons/interface/ellipsis-vertical.tsx) | lucide | menu, options, spread, more, further, extra, overflow, dots, …, ... |
| `FullscreenIcon` | `@mdevs/icons/interface/fullscreen` | [fullscreen.svg](../../svg/interface/fullscreen.svg) | [TSX](../../src/icons/interface/fullscreen.tsx) | lucide | expand, zoom, preview, focus, camera, lens, image |
| `Grid2X2Icon` | `@mdevs/icons/interface/grid-2-x-2` | [grid-2-x-2.svg](../../svg/interface/grid-2-x-2.svg) | [TSX](../../src/icons/interface/grid-2-x-2.tsx) | lucide | — |
| `Grid2X2CheckIcon` | `@mdevs/icons/interface/grid-2-x-2-check` | [grid-2-x-2-check.svg](../../svg/interface/grid-2-x-2-check.svg) | [TSX](../../src/icons/interface/grid-2-x-2-check.tsx) | lucide | — |
| `Grid2X2PlusIcon` | `@mdevs/icons/interface/grid-2-x-2-plus` | [grid-2-x-2-plus.svg](../../svg/interface/grid-2-x-2-plus.svg) | [TSX](../../src/icons/interface/grid-2-x-2-plus.tsx) | lucide | — |
| `Grid2X2XIcon` | `@mdevs/icons/interface/grid-2-x-2-x` | [grid-2-x-2-x.svg](../../svg/interface/grid-2-x-2-x.svg) | [TSX](../../src/icons/interface/grid-2-x-2-x.tsx) | lucide | — |
| `Grid3X3Icon` | `@mdevs/icons/interface/grid-3-x-3` | [grid-3-x-3.svg](../../svg/interface/grid-3-x-3.svg) | [TSX](../../src/icons/interface/grid-3-x-3.tsx) | lucide | — |
| `Grid3x2Icon` | `@mdevs/icons/interface/grid-3x2` | [grid-3x2.svg](../../svg/interface/grid-3x2.svg) | [TSX](../../src/icons/interface/grid-3x2.tsx) | lucide | table, rows, columns, blocks, plot, land, geometry, measure, size, width, height, distance, surface area, square meter, acre, window |
| `LayoutIcon` | `@mdevs/icons/interface/layout` | [layout.svg](../../svg/interface/layout.svg) | [TSX](../../src/icons/interface/layout.tsx) | lucide | — |
| `LayoutArrowDownIcon` | `@mdevs/icons/interface/layout-arrow-down` | [layout-arrow-down.svg](../../svg/interface/layout-arrow-down.svg) | [TSX](../../src/icons/interface/layout-arrow-down.tsx) | lucide | layout, direction, flex, flexbox, flex-direction, column, auto layout, vertical, arrange, order, flow, stack |
| `LayoutArrowRightIcon` | `@mdevs/icons/interface/layout-arrow-right` | [layout-arrow-right.svg](../../svg/interface/layout-arrow-right.svg) | [TSX](../../src/icons/interface/layout-arrow-right.tsx) | lucide | layout, direction, flex, flexbox, flex-direction, row, auto layout, horizontal, arrange, order, flow, stack |
| `LayoutDashboardIcon` | `@mdevs/icons/interface/layout-dashboard` | [layout-dashboard.svg](../../svg/interface/layout-dashboard.svg) | [TSX](../../src/icons/interface/layout-dashboard.tsx) | lucide | masonry, brick |
| `LayoutFreeformIcon` | `@mdevs/icons/interface/layout-freeform` | [layout-freeform.svg](../../svg/interface/layout-freeform.svg) | [TSX](../../src/icons/interface/layout-freeform.tsx) | lucide | layout, freeform, free, absolute, position, auto layout, unaligned, scattered, arrange, blocks, canvas, frame |
| `LayoutGridIcon` | `@mdevs/icons/interface/layout-grid` | [layout-grid.svg](../../svg/interface/layout-grid.svg) | [TSX](../../src/icons/interface/layout-grid.tsx) | lucide | app, home, start |
| `LayoutGridCirclesIcon` | `@mdevs/icons/interface/layout-grid-circles` | [layout-grid-circles.svg](../../svg/interface/layout-grid-circles.svg) | [TSX](../../src/icons/interface/layout-grid-circles.tsx) | lucide | app, home, start, dot matrix, dots, menu, dashboard, collection, overview, tiles, grid, matrix, launcher, apps, widgets, ui, circles, shortcuts |
| `LayoutListIcon` | `@mdevs/icons/interface/layout-list` | [layout-list.svg](../../svg/interface/layout-list.svg) | [TSX](../../src/icons/interface/layout-list.tsx) | lucide | todo, tasks, items, pending, image, photo |
| `LayoutPanelLeftIcon` | `@mdevs/icons/interface/layout-panel-left` | [layout-panel-left.svg](../../svg/interface/layout-panel-left.svg) | [TSX](../../src/icons/interface/layout-panel-left.tsx) | lucide | app, home, start, grid |
| `LayoutPanelTopIcon` | `@mdevs/icons/interface/layout-panel-top` | [layout-panel-top.svg](../../svg/interface/layout-panel-top.svg) | [TSX](../../src/icons/interface/layout-panel-top.tsx) | lucide | window, webpage, block, section, grid, template, structure |
| `LayoutTemplateIcon` | `@mdevs/icons/interface/layout-template` | [layout-template.svg](../../svg/interface/layout-template.svg) | [TSX](../../src/icons/interface/layout-template.tsx) | lucide | window, webpage, block, section |
| `MaximizeIcon` | `@mdevs/icons/interface/maximize` | [maximize.svg](../../svg/interface/maximize.svg) | [TSX](../../src/icons/interface/maximize.tsx) | lucide | fullscreen, expand, dashed |
| `Maximize2Icon` | `@mdevs/icons/interface/maximize-2` | [maximize-2.svg](../../svg/interface/maximize-2.svg) | [TSX](../../src/icons/interface/maximize-2.tsx) | lucide | fullscreen, arrows, expand |
| `MenuIcon` | `@mdevs/icons/interface/menu` | [menu.svg](../../svg/interface/menu.svg) | [TSX](../../src/icons/interface/menu.tsx) | lucide | bars, navigation, hamburger, options |
| `MenuSquareIcon` | `@mdevs/icons/interface/menu-square` | [menu-square.svg](../../svg/interface/menu-square.svg) | [TSX](../../src/icons/interface/menu-square.tsx) | lucide | — |
| `MinimizeIcon` | `@mdevs/icons/interface/minimize` | [minimize.svg](../../svg/interface/minimize.svg) | [TSX](../../src/icons/interface/minimize.tsx) | lucide | exit fullscreen, close, shrink |
| `Minimize2Icon` | `@mdevs/icons/interface/minimize-2` | [minimize-2.svg](../../svg/interface/minimize-2.svg) | [TSX](../../src/icons/interface/minimize-2.tsx) | lucide | exit fullscreen, arrows, close, shrink |
| `PanelBottomIcon` | `@mdevs/icons/interface/panel-bottom` | [panel-bottom.svg](../../svg/interface/panel-bottom.svg) | [TSX](../../src/icons/interface/panel-bottom.tsx) | lucide | drawer, dock |
| `PanelBottomCloseIcon` | `@mdevs/icons/interface/panel-bottom-close` | [panel-bottom-close.svg](../../svg/interface/panel-bottom-close.svg) | [TSX](../../src/icons/interface/panel-bottom-close.tsx) | lucide | drawer, dock, hide, chevron, down |
| `PanelBottomDashedIcon` | `@mdevs/icons/interface/panel-bottom-dashed` | [panel-bottom-dashed.svg](../../svg/interface/panel-bottom-dashed.svg) | [TSX](../../src/icons/interface/panel-bottom-dashed.tsx) | lucide | drawer, dock, show, reveal, padding, margin, guide, layout, bleed |
| `PanelBottomOpenIcon` | `@mdevs/icons/interface/panel-bottom-open` | [panel-bottom-open.svg](../../svg/interface/panel-bottom-open.svg) | [TSX](../../src/icons/interface/panel-bottom-open.tsx) | lucide | drawer, dock, show, reveal, chevron, up |
| `PanelLeftIcon` | `@mdevs/icons/interface/panel-left` | [panel-left.svg](../../svg/interface/panel-left.svg) | [TSX](../../src/icons/interface/panel-left.tsx) | lucide | primary, drawer |
| `PanelLeftCloseIcon` | `@mdevs/icons/interface/panel-left-close` | [panel-left-close.svg](../../svg/interface/panel-left-close.svg) | [TSX](../../src/icons/interface/panel-left-close.tsx) | lucide | primary, drawer, hide, chevron, < |
| `PanelLeftDashedIcon` | `@mdevs/icons/interface/panel-left-dashed` | [panel-left-dashed.svg](../../svg/interface/panel-left-dashed.svg) | [TSX](../../src/icons/interface/panel-left-dashed.tsx) | lucide | sidebar, primary, drawer, show, reveal, padding, margin, guide, layout, bleed |
| `PanelLeftOpenIcon` | `@mdevs/icons/interface/panel-left-open` | [panel-left-open.svg](../../svg/interface/panel-left-open.svg) | [TSX](../../src/icons/interface/panel-left-open.tsx) | lucide | primary, drawer, show, reveal, chevron, right, > |
| `PanelLeftRightDashedIcon` | `@mdevs/icons/interface/panel-left-right-dashed` | [panel-left-right-dashed.svg](../../svg/interface/panel-left-right-dashed.svg) | [TSX](../../src/icons/interface/panel-left-right-dashed.tsx) | lucide | sidebar, primary, drawer, show, reveal, padding, margin, guide, layout, vertical, bleed |
| `PanelRightIcon` | `@mdevs/icons/interface/panel-right` | [panel-right.svg](../../svg/interface/panel-right.svg) | [TSX](../../src/icons/interface/panel-right.tsx) | lucide | sidebar, secondary, drawer |
| `PanelRightCloseIcon` | `@mdevs/icons/interface/panel-right-close` | [panel-right-close.svg](../../svg/interface/panel-right-close.svg) | [TSX](../../src/icons/interface/panel-right-close.tsx) | lucide | sidebar, secondary, drawer, hide, chevron, > |
| `PanelRightDashedIcon` | `@mdevs/icons/interface/panel-right-dashed` | [panel-right-dashed.svg](../../svg/interface/panel-right-dashed.svg) | [TSX](../../src/icons/interface/panel-right-dashed.tsx) | lucide | sidebar, secondary, drawer, show, reveal, padding, margin, guide, layout, bleed |
| `PanelRightOpenIcon` | `@mdevs/icons/interface/panel-right-open` | [panel-right-open.svg](../../svg/interface/panel-right-open.svg) | [TSX](../../src/icons/interface/panel-right-open.tsx) | lucide | sidebar, secondary, drawer, show, reveal, chevron, left, < |
| `PanelTopIcon` | `@mdevs/icons/interface/panel-top` | [panel-top.svg](../../svg/interface/panel-top.svg) | [TSX](../../src/icons/interface/panel-top.tsx) | lucide | drawer, browser, webpage |
| `PanelTopBottomDashedIcon` | `@mdevs/icons/interface/panel-top-bottom-dashed` | [panel-top-bottom-dashed.svg](../../svg/interface/panel-top-bottom-dashed.svg) | [TSX](../../src/icons/interface/panel-top-bottom-dashed.tsx) | lucide | sidebar, primary, drawer, show, reveal, padding, margin, guide, layout, horizontal, bleed |
| `PanelTopCloseIcon` | `@mdevs/icons/interface/panel-top-close` | [panel-top-close.svg](../../svg/interface/panel-top-close.svg) | [TSX](../../src/icons/interface/panel-top-close.tsx) | lucide | menu bar, drawer, hide, chevron, up |
| `PanelTopDashedIcon` | `@mdevs/icons/interface/panel-top-dashed` | [panel-top-dashed.svg](../../svg/interface/panel-top-dashed.svg) | [TSX](../../src/icons/interface/panel-top-dashed.tsx) | lucide | menu bar, drawer, show, reveal, padding, margin, guide, layout, bleed |
| `PanelTopOpenIcon` | `@mdevs/icons/interface/panel-top-open` | [panel-top-open.svg](../../svg/interface/panel-top-open.svg) | [TSX](../../src/icons/interface/panel-top-open.tsx) | lucide | menu bar, drawer, show, reveal, chevron, down |
| `RectangleCircleIcon` | `@mdevs/icons/interface/rectangle-circle` | [rectangle-circle.svg](../../svg/interface/rectangle-circle.svg) | [TSX](../../src/icons/interface/rectangle-circle.tsx) | lucide | compose, keyboard, key, button |
| `RectangleGogglesIcon` | `@mdevs/icons/interface/rectangle-goggles` | [rectangle-goggles.svg](../../svg/interface/rectangle-goggles.svg) | [TSX](../../src/icons/interface/rectangle-goggles.tsx) | lucide | vr, virtual, augmented, reality, headset, goggles |
| `RectangleHorizontalIcon` | `@mdevs/icons/interface/rectangle-horizontal` | [rectangle-horizontal.svg](../../svg/interface/rectangle-horizontal.svg) | [TSX](../../src/icons/interface/rectangle-horizontal.tsx) | lucide | rectangle, aspect ratio, 16:9, horizontal, shape |
| `RectangleVerticalIcon` | `@mdevs/icons/interface/rectangle-vertical` | [rectangle-vertical.svg](../../svg/interface/rectangle-vertical.svg) | [TSX](../../src/icons/interface/rectangle-vertical.tsx) | lucide | rectangle, aspect ratio, 9:16, vertical, shape |
| `Rows2Icon` | `@mdevs/icons/interface/rows-2` | [rows-2.svg](../../svg/interface/rows-2.svg) | [TSX](../../src/icons/interface/rows-2.tsx) | lucide | lines, list, queue, preview, panel, paragraphs, parallel, series, split, vertical, horizontal, half, center, middle, even, drawer |
| `Rows4Icon` | `@mdevs/icons/interface/rows-4` | [rows-4.svg](../../svg/interface/rows-4.svg) | [TSX](../../src/icons/interface/rows-4.tsx) | lucide | lines, list, queue, preview, paragraphs, parallel, series, split, vertical, horizontal, half, center, middle, even, drawers, grill |
| `SquareIcon` | `@mdevs/icons/interface/square` | [square.svg](../../svg/interface/square.svg) | [TSX](../../src/icons/interface/square.tsx) | lucide | stop, playback, music, audio, video, rectangle, aspect ratio, 1:1, shape |
| `SquareArrowRightEnterIcon` | `@mdevs/icons/interface/square-arrow-right-enter` | [square-arrow-right-enter.svg](../../svg/interface/square-arrow-right-enter.svg) | [TSX](../../src/icons/interface/square-arrow-right-enter.tsx) | lucide | left, in, inside, input, insert, source, import, place, -> |
| `SquareArrowRightExitIcon` | `@mdevs/icons/interface/square-arrow-right-exit` | [square-arrow-right-exit.svg](../../svg/interface/square-arrow-right-exit.svg) | [TSX](../../src/icons/interface/square-arrow-right-exit.tsx) | lucide | out, outside, output, export, -> |
| `SquareDashedBottomIcon` | `@mdevs/icons/interface/square-dashed-bottom` | [square-dashed-bottom.svg](../../svg/interface/square-dashed-bottom.svg) | [TSX](../../src/icons/interface/square-dashed-bottom.tsx) | lucide | rectangle, aspect ratio, 1:1, shape, snippet, code, coding |
| `SquareDashedBottomCodeIcon` | `@mdevs/icons/interface/square-dashed-bottom-code` | [square-dashed-bottom-code.svg](../../svg/interface/square-dashed-bottom-code.svg) | [TSX](../../src/icons/interface/square-dashed-bottom-code.tsx) | lucide | rectangle, aspect ratio, 1:1, shape, snippet, code, coding |
| `SquareDashedPlusIcon` | `@mdevs/icons/interface/square-dashed-plus` | [square-dashed-plus.svg](../../svg/interface/square-dashed-plus.svg) | [TSX](../../src/icons/interface/square-dashed-plus.tsx) | lucide | selection, select, add, new, placeholder, marquee, box, dashed, plus, insert, frame, empty |
| `SquareDashedTextIcon` | `@mdevs/icons/interface/square-dashed-text` | [square-dashed-text.svg](../../svg/interface/square-dashed-text.svg) | [TSX](../../src/icons/interface/square-dashed-text.tsx) | lucide | find, search, selection, dashed |
| `SquareDashedTopSolidIcon` | `@mdevs/icons/interface/square-dashed-top-solid` | [square-dashed-top-solid.svg](../../svg/interface/square-dashed-top-solid.svg) | [TSX](../../src/icons/interface/square-dashed-top-solid.tsx) | lucide | square, border, width, layout, style, design, rectangular, marquee, dashed, box, rectangle, aspect ratio, 1:1 |
| `SquareDashedXIcon` | `@mdevs/icons/interface/square-dashed-x` | [square-dashed-x.svg](../../svg/interface/square-dashed-x.svg) | [TSX](../../src/icons/interface/square-dashed-x.tsx) | lucide | deselect, unselect, delete, select, selection, border, width, layout, style, design, rectangular, marquee, box, rectangle, aspect ratio, 1:1 |
| `SquareDashedXCornerIcon` | `@mdevs/icons/interface/square-dashed-x-corner` | [square-dashed-x-corner.svg](../../svg/interface/square-dashed-x-corner.svg) | [TSX](../../src/icons/interface/square-dashed-x-corner.tsx) | lucide | deselect, unselect, delete, select, selection, border, width, layout, style, design, rectangular, marquee, box, rectangle, aspect ratio, 1:1 |
| `SquareDimensionsIcon` | `@mdevs/icons/interface/square-dimensions` | [square-dimensions.svg](../../svg/interface/square-dimensions.svg) | [TSX](../../src/icons/interface/square-dimensions.tsx) | lucide | ratio, size, width, height, resize, scale, frame, proportions, aspect, bounds, measurements, canvas |
| `SquareExclamationPointIcon` | `@mdevs/icons/interface/square-exclamation-point` | [square-exclamation-point.svg](../../svg/interface/square-exclamation-point.svg) | [TSX](../../src/icons/interface/square-exclamation-point.tsx) | lucide | warning, alert, danger, exclamation mark, rectangle, square, notification, attention, important, caution |
| `SquareOffIcon` | `@mdevs/icons/interface/square-off` | [square-off.svg](../../svg/interface/square-off.svg) | [TSX](../../src/icons/interface/square-off.tsx) | lucide | /, not, slash, off, disabled, inactive, cancel, none, block, forbidden, unavailable, stopped, checkbox, unchecked, toggle, negation, form, ui |
| `SquarePauseIcon` | `@mdevs/icons/interface/square-pause` | [square-pause.svg](../../svg/interface/square-pause.svg) | [TSX](../../src/icons/interface/square-pause.tsx) | lucide | music, audio, stop |
| `SquareRadicalIcon` | `@mdevs/icons/interface/square-radical` | [square-radical.svg](../../svg/interface/square-radical.svg) | [TSX](../../src/icons/interface/square-radical.tsx) | lucide | calculate, formula, math, operator, root, square, symbol |
| `SquareRoundCornerIcon` | `@mdevs/icons/interface/square-round-corner` | [square-round-corner.svg](../../svg/interface/square-round-corner.svg) | [TSX](../../src/icons/interface/square-round-corner.tsx) | lucide | border, radius, style, design, corner, layout, round, rounded |
| `SquareSparklesIcon` | `@mdevs/icons/interface/square-sparkles` | [square-sparkles.svg](../../svg/interface/square-sparkles.svg) | [TSX](../../src/icons/interface/square-sparkles.tsx) | lucide | picture, photo, sparkles |
| `SquareSquareIcon` | `@mdevs/icons/interface/square-square` | [square-square.svg](../../svg/interface/square-square.svg) | [TSX](../../src/icons/interface/square-square.tsx) | lucide | float, center, rectangle |
| `SquareStackIcon` | `@mdevs/icons/interface/square-stack` | [square-stack.svg](../../svg/interface/square-stack.svg) | [TSX](../../src/icons/interface/square-stack.tsx) | lucide | versions, clone, copy, duplicate, multiple, revisions, version control, backup, history |
| `SquareStarIcon` | `@mdevs/icons/interface/square-star` | [square-star.svg](../../svg/interface/square-star.svg) | [TSX](../../src/icons/interface/square-star.tsx) | lucide | badge, medal, honour, decoration, order, pin, laurel, trophy, medallion, insignia, bronze, silver, gold |
| `SquareStopIcon` | `@mdevs/icons/interface/square-stop` | [square-stop.svg](../../svg/interface/square-stop.svg) | [TSX](../../src/icons/interface/square-stop.tsx) | lucide | media, music |
| `SquareTerminalIcon` | `@mdevs/icons/interface/square-terminal` | [square-terminal.svg](../../svg/interface/square-terminal.svg) | [TSX](../../src/icons/interface/square-terminal.tsx) | lucide | code, command line, prompt, shell |
| `SquareTextIcon` | `@mdevs/icons/interface/square-text` | [square-text.svg](../../svg/interface/square-text.svg) | [TSX](../../src/icons/interface/square-text.tsx) | lucide | text, paragraph, content, note, document, body, copy, article, square, container, block, card, placeholder, log, page, paper, sheet, list, script, code, editor |
| `SquareUserIcon` | `@mdevs/icons/interface/square-user` | [square-user.svg](../../svg/interface/square-user.svg) | [TSX](../../src/icons/interface/square-user.tsx) | lucide | person, account, contact |
| `SquareUserRoundIcon` | `@mdevs/icons/interface/square-user-round` | [square-user-round.svg](../../svg/interface/square-user-round.svg) | [TSX](../../src/icons/interface/square-user-round.tsx) | lucide | person, account, contact |
| `SquareXIcon` | `@mdevs/icons/interface/square-x` | [square-x.svg](../../svg/interface/square-x.svg) | [TSX](../../src/icons/interface/square-x.tsx) | lucide | cancel, close, delete, remove, times, clear, math, multiply, multiplication |

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
