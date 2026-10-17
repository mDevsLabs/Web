# Contrôles — icônes

50 icônes de la catégorie `controls`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (50). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {CheckIcon} from '@mdevs/icons';
// Alternatives :
import {CheckIcon} from '@mdevs/icons/controls';
import {CheckIcon} from '@mdevs/icons/controls/check';
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
import {CheckIcon} from '@mdevs/icons/controls/check';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><CheckIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <CheckIcon size={32} title="Contrôles" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `CheckIcon` | `@mdevs/icons/controls/check` | [check.svg](../../svg/controls/check.svg) | [TSX](../../src/icons/controls/check.tsx) | lucide | done, todo, tick, complete, task |
| `CheckCheckIcon` | `@mdevs/icons/controls/check-check` | [check-check.svg](../../svg/controls/check-check.svg) | [TSX](../../src/icons/controls/check-check.tsx) | lucide | done, received, double, todo, tick, complete, task |
| `CheckCircleIcon` | `@mdevs/icons/controls/check-circle` | [check-circle.svg](../../svg/controls/check-circle.svg) | [TSX](../../src/icons/controls/check-circle.tsx) | lucide | — |
| `CheckCircle2Icon` | `@mdevs/icons/controls/check-circle-2` | [check-circle-2.svg](../../svg/controls/check-circle-2.svg) | [TSX](../../src/icons/controls/check-circle-2.tsx) | lucide | — |
| `CheckLineIcon` | `@mdevs/icons/controls/check-line` | [check-line.svg](../../svg/controls/check-line.svg) | [TSX](../../src/icons/controls/check-line.tsx) | lucide | done, todo, tick, complete, task |
| `CheckSquareIcon` | `@mdevs/icons/controls/check-square` | [check-square.svg](../../svg/controls/check-square.svg) | [TSX](../../src/icons/controls/check-square.tsx) | lucide | — |
| `CheckSquare2Icon` | `@mdevs/icons/controls/check-square-2` | [check-square-2.svg](../../svg/controls/check-square-2.svg) | [TSX](../../src/icons/controls/check-square-2.tsx) | lucide | — |
| `FilterIcon` | `@mdevs/icons/controls/filter` | [filter.svg](../../svg/controls/filter.svg) | [TSX](../../src/icons/controls/filter.tsx) | lucide | — |
| `FilterXIcon` | `@mdevs/icons/controls/filter-x` | [filter-x.svg](../../svg/controls/filter-x.svg) | [TSX](../../src/icons/controls/filter-x.tsx) | lucide | — |
| `ListIcon` | `@mdevs/icons/controls/list` | [list.svg](../../svg/controls/list.svg) | [TSX](../../src/icons/controls/list.tsx) | lucide | options |
| `ListCheckIcon` | `@mdevs/icons/controls/list-check` | [list-check.svg](../../svg/controls/list-check.svg) | [TSX](../../src/icons/controls/list-check.tsx) | lucide | done, check, tick, complete, list, to-do, bom |
| `ListChecksIcon` | `@mdevs/icons/controls/list-checks` | [list-checks.svg](../../svg/controls/list-checks.svg) | [TSX](../../src/icons/controls/list-checks.tsx) | lucide | todo, done, check, tick, complete, tasks, items, pending |
| `ListChevronsDownUpIcon` | `@mdevs/icons/controls/list-chevrons-down-up` | [list-chevrons-down-up.svg](../../svg/controls/list-chevrons-down-up.svg) | [TSX](../../src/icons/controls/list-chevrons-down-up.tsx) | lucide | options, items, collapse, expand, details, disclosure, show, hide, toggle, accordion, more, less, fold, unfold, vertical |
| `ListChevronsUpDownIcon` | `@mdevs/icons/controls/list-chevrons-up-down` | [list-chevrons-up-down.svg](../../svg/controls/list-chevrons-up-down.svg) | [TSX](../../src/icons/controls/list-chevrons-up-down.tsx) | lucide | options, items, collapse, expand, details, disclosure, show, hide, toggle, accordion, more, less, fold, unfold, vertical |
| `ListClockIcon` | `@mdevs/icons/controls/list-clock` | [list-clock.svg](../../svg/controls/list-clock.svg) | [TSX](../../src/icons/controls/list-clock.tsx) | lucide | history, log, clock, time, recent, updated, revision, activity, timestamp, audit, list |
| `ListCollapseIcon` | `@mdevs/icons/controls/list-collapse` | [list-collapse.svg](../../svg/controls/list-collapse.svg) | [TSX](../../src/icons/controls/list-collapse.tsx) | lucide | items, collapse, expand, details, disclosure, show, hide, toggle, accordion, more, less, fold, unfold |
| `ListEndIcon` | `@mdevs/icons/controls/list-end` | [list-end.svg](../../svg/controls/list-end.svg) | [TSX](../../src/icons/controls/list-end.tsx) | lucide | queue, bottom, end, playlist |
| `ListFilterIcon` | `@mdevs/icons/controls/list-filter` | [list-filter.svg](../../svg/controls/list-filter.svg) | [TSX](../../src/icons/controls/list-filter.tsx) | lucide | options |
| `ListFilterPlusIcon` | `@mdevs/icons/controls/list-filter-plus` | [list-filter-plus.svg](../../svg/controls/list-filter-plus.svg) | [TSX](../../src/icons/controls/list-filter-plus.tsx) | lucide | filter, plus, options, add |
| `ListMinusIcon` | `@mdevs/icons/controls/list-minus` | [list-minus.svg](../../svg/controls/list-minus.svg) | [TSX](../../src/icons/controls/list-minus.tsx) | lucide | playlist, remove, song, subtract, delete, unqueue |
| `ListMusicIcon` | `@mdevs/icons/controls/list-music` | [list-music.svg](../../svg/controls/list-music.svg) | [TSX](../../src/icons/controls/list-music.tsx) | lucide | playlist, queue, music, audio, playback |
| `ListOrderedIcon` | `@mdevs/icons/controls/list-ordered` | [list-ordered.svg](../../svg/controls/list-ordered.svg) | [TSX](../../src/icons/controls/list-ordered.tsx) | lucide | number, order, queue |
| `ListPlusIcon` | `@mdevs/icons/controls/list-plus` | [list-plus.svg](../../svg/controls/list-plus.svg) | [TSX](../../src/icons/controls/list-plus.tsx) | lucide | playlist, add, song, track, new |
| `ListRestartIcon` | `@mdevs/icons/controls/list-restart` | [list-restart.svg](../../svg/controls/list-restart.svg) | [TSX](../../src/icons/controls/list-restart.tsx) | lucide | reset, refresh, reload, playlist, replay |
| `ListSortAscendingIcon` | `@mdevs/icons/controls/list-sort-ascending` | [list-sort-ascending.svg](../../svg/controls/list-sort-ascending.svg) | [TSX](../../src/icons/controls/list-sort-ascending.tsx) | lucide | list, order, arrangement, organization, sequence, ranking, categories, presentation, filter, sort, ascending, descending, increasing, decreasing, rising, falling |
| `ListSortDescendingIcon` | `@mdevs/icons/controls/list-sort-descending` | [list-sort-descending.svg](../../svg/controls/list-sort-descending.svg) | [TSX](../../src/icons/controls/list-sort-descending.tsx) | lucide | list, order, arrangement, organization, sequence, ranking, categories, presentation, filter, sort, ascending, descending, increasing, decreasing, rising, falling |
| `ListStartIcon` | `@mdevs/icons/controls/list-start` | [list-start.svg](../../svg/controls/list-start.svg) | [TSX](../../src/icons/controls/list-start.tsx) | lucide | queue, top, start, next, playlist |
| `ListTodoIcon` | `@mdevs/icons/controls/list-todo` | [list-todo.svg](../../svg/controls/list-todo.svg) | [TSX](../../src/icons/controls/list-todo.tsx) | lucide | todo, done, check, tick, complete, tasks, items, pending |
| `ListTreeIcon` | `@mdevs/icons/controls/list-tree` | [list-tree.svg](../../svg/controls/list-tree.svg) | [TSX](../../src/icons/controls/list-tree.tsx) | lucide | tree, browser |
| `ListVideoIcon` | `@mdevs/icons/controls/list-video` | [list-video.svg](../../svg/controls/list-video.svg) | [TSX](../../src/icons/controls/list-video.tsx) | lucide | playlist, video, playback |
| `ListXIcon` | `@mdevs/icons/controls/list-x` | [list-x.svg](../../svg/controls/list-x.svg) | [TSX](../../src/icons/controls/list-x.tsx) | lucide | playlist, subtract, remove, delete, unqueue |
| `MinusIcon` | `@mdevs/icons/controls/minus` | [minus.svg](../../svg/controls/minus.svg) | [TSX](../../src/icons/controls/minus.tsx) | lucide | subtract, remove, decrease, decrement, reduce, negative, calculate, line, divider, separator, horizontal rule, hr, html, markup, markdown, ---, toolbar, operator, code, coding, minimum, downgrade |
| `MinusSquareIcon` | `@mdevs/icons/controls/minus-square` | [minus-square.svg](../../svg/controls/minus-square.svg) | [TSX](../../src/icons/controls/minus-square.tsx) | lucide | — |
| `PlusIcon` | `@mdevs/icons/controls/plus` | [plus.svg](../../svg/controls/plus.svg) | [TSX](../../src/icons/controls/plus.tsx) | lucide | add, new, increase, increment, positive, calculate, toolbar, crosshair, aim, target, scope, sight, reticule, maximum, upgrade, extra, + |
| `PlusSquareIcon` | `@mdevs/icons/controls/plus-square` | [plus-square.svg](../../svg/controls/plus-square.svg) | [TSX](../../src/icons/controls/plus-square.tsx) | lucide | — |
| `SearchIcon` | `@mdevs/icons/controls/search` | [search.svg](../../svg/controls/search.svg) | [TSX](../../src/icons/controls/search.tsx) | lucide | find, scan, magnifier, magnifying glass, lens, locate, explore, discover, enlarge, zoom |
| `SearchAlertIcon` | `@mdevs/icons/controls/search-alert` | [search-alert.svg](../../svg/controls/search-alert.svg) | [TSX](../../src/icons/controls/search-alert.tsx) | lucide | find, scan, magnifier, magnifying glass, stop, warning, alert, error, anomaly, lens, locate, explore, discover, enlarge, zoom |
| `SearchCheckIcon` | `@mdevs/icons/controls/search-check` | [search-check.svg](../../svg/controls/search-check.svg) | [TSX](../../src/icons/controls/search-check.tsx) | lucide | find, scan, magnifier, magnifying glass, found, correct, complete, tick, lens, locate, explore, discover, enlarge, zoom |
| `SearchCodeIcon` | `@mdevs/icons/controls/search-code` | [search-code.svg](../../svg/controls/search-code.svg) | [TSX](../../src/icons/controls/search-code.tsx) | lucide | find, scan, magnifier, magnifying glass, grep, chevrons, <>, lens, locate, explore, discover, enlarge, zoom |
| `SearchSlashIcon` | `@mdevs/icons/controls/search-slash` | [search-slash.svg](../../svg/controls/search-slash.svg) | [TSX](../../src/icons/controls/search-slash.tsx) | lucide | find, scan, magnifier, magnifying glass, stop, clear, cancel, abort, /, lens, locate, explore, discover, enlarge, zoom |
| `SearchXIcon` | `@mdevs/icons/controls/search-x` | [search-x.svg](../../svg/controls/search-x.svg) | [TSX](../../src/icons/controls/search-x.tsx) | lucide | find, scan, magnifier, magnifying glass, stop, clear, cancel, abort, lens, locate, explore, discover, enlarge, zoom |
| `SettingsIcon` | `@mdevs/icons/controls/settings` | [settings.svg](../../svg/controls/settings.svg) | [TSX](../../src/icons/controls/settings.tsx) | lucide | cog, edit, gear, preferences |
| `Settings2Icon` | `@mdevs/icons/controls/settings-2` | [settings-2.svg](../../svg/controls/settings-2.svg) | [TSX](../../src/icons/controls/settings-2.tsx) | lucide | cog, edit, gear, preferences, slider |
| `SlidersHorizontalIcon` | `@mdevs/icons/controls/sliders-horizontal` | [sliders-horizontal.svg](../../svg/controls/sliders-horizontal.svg) | [TSX](../../src/icons/controls/sliders-horizontal.tsx) | lucide | settings, filters, controls |
| `SlidersVerticalIcon` | `@mdevs/icons/controls/sliders-vertical` | [sliders-vertical.svg](../../svg/controls/sliders-vertical.svg) | [TSX](../../src/icons/controls/sliders-vertical.tsx) | lucide | settings, controls |
| `SwitchCameraIcon` | `@mdevs/icons/controls/switch-camera` | [switch-camera.svg](../../svg/controls/switch-camera.svg) | [TSX](../../src/icons/controls/switch-camera.tsx) | lucide | photo, selfie, front, back |
| `ToggleLeftIcon` | `@mdevs/icons/controls/toggle-left` | [toggle-left.svg](../../svg/controls/toggle-left.svg) | [TSX](../../src/icons/controls/toggle-left.tsx) | lucide | on, off, switch, boolean |
| `ToggleRightIcon` | `@mdevs/icons/controls/toggle-right` | [toggle-right.svg](../../svg/controls/toggle-right.svg) | [TSX](../../src/icons/controls/toggle-right.tsx) | lucide | on, off, switch, boolean |
| `XIcon` | `@mdevs/icons/controls/x` | [x.svg](../../svg/controls/x.svg) | [TSX](../../src/icons/controls/x.tsx) | lucide | cancel, close, cross, delete, ex, remove, times, clear, math, multiply, multiplication |
| `XLineTopIcon` | `@mdevs/icons/controls/x-line-top` | [x-line-top.svg](../../svg/controls/x-line-top.svg) | [TSX](../../src/icons/controls/x-line-top.tsx) | lucide | line, top, arrow, navigation, up, pointer, direction, vector, symbol, cancel, close, delete, remove, times, clear, math, multiply, multiplication, mean, median, average, x̄ |

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
