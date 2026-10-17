# Temps et calendrier — icônes

54 icônes de la catégorie `time`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (54). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {AlarmCheckIcon} from '@mdevs/icons';
// Alternatives :
import {AlarmCheckIcon} from '@mdevs/icons/time';
import {AlarmCheckIcon} from '@mdevs/icons/time/alarm-check';
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
import {AlarmCheckIcon} from '@mdevs/icons/time/alarm-check';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><AlarmCheckIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <AlarmCheckIcon size={32} title="Temps et calendrier" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `AlarmCheckIcon` | `@mdevs/icons/time/alarm-check` | [alarm-check.svg](../../svg/time/alarm-check.svg) | [TSX](../../src/icons/time/alarm-check.tsx) | lucide | — |
| `AlarmClockIcon` | `@mdevs/icons/time/alarm-clock` | [alarm-clock.svg](../../svg/time/alarm-clock.svg) | [TSX](../../src/icons/time/alarm-clock.tsx) | lucide | morning |
| `AlarmClockMinusIcon` | `@mdevs/icons/time/alarm-clock-minus` | [alarm-clock-minus.svg](../../svg/time/alarm-clock-minus.svg) | [TSX](../../src/icons/time/alarm-clock-minus.tsx) | lucide | remove |
| `AlarmClockOffIcon` | `@mdevs/icons/time/alarm-clock-off` | [alarm-clock-off.svg](../../svg/time/alarm-clock-off.svg) | [TSX](../../src/icons/time/alarm-clock-off.tsx) | lucide | morning, turn-off |
| `AlarmClockPlusIcon` | `@mdevs/icons/time/alarm-clock-plus` | [alarm-clock-plus.svg](../../svg/time/alarm-clock-plus.svg) | [TSX](../../src/icons/time/alarm-clock-plus.tsx) | lucide | add |
| `AlarmSmokeIcon` | `@mdevs/icons/time/alarm-smoke` | [alarm-smoke.svg](../../svg/time/alarm-smoke.svg) | [TSX](../../src/icons/time/alarm-smoke.tsx) | lucide | fire, alert, warning, detector, carbon monoxide, safety, equipment, amenities |
| `CalendarIcon` | `@mdevs/icons/time/calendar` | [calendar.svg](../../svg/time/calendar.svg) | [TSX](../../src/icons/time/calendar.tsx) | lucide | date, month, year, event, birthday, birthdate |
| `Calendar1Icon` | `@mdevs/icons/time/calendar-1` | [calendar-1.svg](../../svg/time/calendar-1.svg) | [TSX](../../src/icons/time/calendar-1.tsx) | lucide | date, month, year, event, single, singular, once, 1, first |
| `CalendarArrowDownIcon` | `@mdevs/icons/time/calendar-arrow-down` | [calendar-arrow-down.svg](../../svg/time/calendar-arrow-down.svg) | [TSX](../../src/icons/time/calendar-arrow-down.tsx) | lucide | date, month, year, event, sort, order, ascending, descending, increasing, decreasing, rising, falling |
| `CalendarArrowUpIcon` | `@mdevs/icons/time/calendar-arrow-up` | [calendar-arrow-up.svg](../../svg/time/calendar-arrow-up.svg) | [TSX](../../src/icons/time/calendar-arrow-up.tsx) | lucide | date, month, year, event, sort, order, ascending, descending, increasing, decreasing, rising, falling |
| `CalendarCheckIcon` | `@mdevs/icons/time/calendar-check` | [calendar-check.svg](../../svg/time/calendar-check.svg) | [TSX](../../src/icons/time/calendar-check.tsx) | lucide | date, day, month, year, event, confirm, subscribe, schedule, done, todo, tick, complete, task |
| `CalendarCheck2Icon` | `@mdevs/icons/time/calendar-check-2` | [calendar-check-2.svg](../../svg/time/calendar-check-2.svg) | [TSX](../../src/icons/time/calendar-check-2.tsx) | lucide | date, day, month, year, event, confirm, subscribe, schedule, done, todo, tick, complete, task |
| `CalendarChevronsRightIcon` | `@mdevs/icons/time/calendar-chevrons-right` | [calendar-chevrons-right.svg](../../svg/time/calendar-chevrons-right.svg) | [TSX](../../src/icons/time/calendar-chevrons-right.tsx) | lucide | navigation, arrow, right, chevron, direction, symbol, pointer, indicator, next, menu, date, day, month, year, events, chevrons |
| `CalendarClockIcon` | `@mdevs/icons/time/calendar-clock` | [calendar-clock.svg](../../svg/time/calendar-clock.svg) | [TSX](../../src/icons/time/calendar-clock.tsx) | lucide | date, day, month, year, event, clock, hour |
| `CalendarCogIcon` | `@mdevs/icons/time/calendar-cog` | [calendar-cog.svg](../../svg/time/calendar-cog.svg) | [TSX](../../src/icons/time/calendar-cog.tsx) | lucide | date, day, month, year, events, settings, gear, cog |
| `CalendarDaysIcon` | `@mdevs/icons/time/calendar-days` | [calendar-days.svg](../../svg/time/calendar-days.svg) | [TSX](../../src/icons/time/calendar-days.tsx) | lucide | date, month, year, event |
| `CalendarFoldIcon` | `@mdevs/icons/time/calendar-fold` | [calendar-fold.svg](../../svg/time/calendar-fold.svg) | [TSX](../../src/icons/time/calendar-fold.tsx) | lucide | date, month, year, event, birthday, birthdate, ics |
| `CalendarHeartIcon` | `@mdevs/icons/time/calendar-heart` | [calendar-heart.svg](../../svg/time/calendar-heart.svg) | [TSX](../../src/icons/time/calendar-heart.tsx) | lucide | date, month, year, event, heart, favourite, subscribe, valentines day |
| `CalendarMinusIcon` | `@mdevs/icons/time/calendar-minus` | [calendar-minus.svg](../../svg/time/calendar-minus.svg) | [TSX](../../src/icons/time/calendar-minus.tsx) | lucide | date, day, month, year, event, delete, remove |
| `CalendarMinus2Icon` | `@mdevs/icons/time/calendar-minus-2` | [calendar-minus-2.svg](../../svg/time/calendar-minus-2.svg) | [TSX](../../src/icons/time/calendar-minus-2.tsx) | lucide | date, day, month, year, event, delete, remove |
| `CalendarOffIcon` | `@mdevs/icons/time/calendar-off` | [calendar-off.svg](../../svg/time/calendar-off.svg) | [TSX](../../src/icons/time/calendar-off.tsx) | lucide | date, day, month, year, event, delete, remove |
| `CalendarPlusIcon` | `@mdevs/icons/time/calendar-plus` | [calendar-plus.svg](../../svg/time/calendar-plus.svg) | [TSX](../../src/icons/time/calendar-plus.tsx) | lucide | date, day, month, year, event, add, subscribe, create, new |
| `CalendarPlus2Icon` | `@mdevs/icons/time/calendar-plus-2` | [calendar-plus-2.svg](../../svg/time/calendar-plus-2.svg) | [TSX](../../src/icons/time/calendar-plus-2.tsx) | lucide | date, day, month, year, event, add, subscribe, create, new |
| `CalendarRangeIcon` | `@mdevs/icons/time/calendar-range` | [calendar-range.svg](../../svg/time/calendar-range.svg) | [TSX](../../src/icons/time/calendar-range.tsx) | lucide | date, day, month, year, event, range, period |
| `CalendarSearchIcon` | `@mdevs/icons/time/calendar-search` | [calendar-search.svg](../../svg/time/calendar-search.svg) | [TSX](../../src/icons/time/calendar-search.tsx) | lucide | date, day, month, year, events, search, lens |
| `CalendarSyncIcon` | `@mdevs/icons/time/calendar-sync` | [calendar-sync.svg](../../svg/time/calendar-sync.svg) | [TSX](../../src/icons/time/calendar-sync.tsx) | lucide | repeat, refresh, reconnect, transfer, backup, date, month, year, event, subscribe, recurring, schedule, reminder, automatic, auto |
| `CalendarXIcon` | `@mdevs/icons/time/calendar-x` | [calendar-x.svg](../../svg/time/calendar-x.svg) | [TSX](../../src/icons/time/calendar-x.tsx) | lucide | date, day, month, year, event, remove, busy |
| `CalendarX2Icon` | `@mdevs/icons/time/calendar-x-2` | [calendar-x-2.svg](../../svg/time/calendar-x-2.svg) | [TSX](../../src/icons/time/calendar-x-2.tsx) | lucide | date, day, month, year, event, remove |
| `Clock1Icon` | `@mdevs/icons/time/clock-1` | [clock-1.svg](../../svg/time/clock-1.svg) | [TSX](../../src/icons/time/clock-1.tsx) | lucide | time, watch, alarm |
| `Clock10Icon` | `@mdevs/icons/time/clock-10` | [clock-10.svg](../../svg/time/clock-10.svg) | [TSX](../../src/icons/time/clock-10.tsx) | lucide | time, watch, alarm |
| `Clock11Icon` | `@mdevs/icons/time/clock-11` | [clock-11.svg](../../svg/time/clock-11.svg) | [TSX](../../src/icons/time/clock-11.tsx) | lucide | time, watch, alarm |
| `Clock12Icon` | `@mdevs/icons/time/clock-12` | [clock-12.svg](../../svg/time/clock-12.svg) | [TSX](../../src/icons/time/clock-12.tsx) | lucide | time, watch, alarm, noon, midnight |
| `Clock2Icon` | `@mdevs/icons/time/clock-2` | [clock-2.svg](../../svg/time/clock-2.svg) | [TSX](../../src/icons/time/clock-2.tsx) | lucide | time, watch, alarm |
| `Clock3Icon` | `@mdevs/icons/time/clock-3` | [clock-3.svg](../../svg/time/clock-3.svg) | [TSX](../../src/icons/time/clock-3.tsx) | lucide | time, watch, alarm |
| `Clock4Icon` | `@mdevs/icons/time/clock-4` | [clock-4.svg](../../svg/time/clock-4.svg) | [TSX](../../src/icons/time/clock-4.tsx) | lucide | time, watch, alarm |
| `Clock5Icon` | `@mdevs/icons/time/clock-5` | [clock-5.svg](../../svg/time/clock-5.svg) | [TSX](../../src/icons/time/clock-5.tsx) | lucide | time, watch, alarm |
| `Clock6Icon` | `@mdevs/icons/time/clock-6` | [clock-6.svg](../../svg/time/clock-6.svg) | [TSX](../../src/icons/time/clock-6.tsx) | lucide | time, watch, alarm |
| `Clock7Icon` | `@mdevs/icons/time/clock-7` | [clock-7.svg](../../svg/time/clock-7.svg) | [TSX](../../src/icons/time/clock-7.tsx) | lucide | time, watch, alarm |
| `Clock8Icon` | `@mdevs/icons/time/clock-8` | [clock-8.svg](../../svg/time/clock-8.svg) | [TSX](../../src/icons/time/clock-8.tsx) | lucide | time, watch, alarm |
| `Clock9Icon` | `@mdevs/icons/time/clock-9` | [clock-9.svg](../../svg/time/clock-9.svg) | [TSX](../../src/icons/time/clock-9.tsx) | lucide | time, watch, alarm |
| `ClockAlertIcon` | `@mdevs/icons/time/clock-alert` | [clock-alert.svg](../../svg/time/clock-alert.svg) | [TSX](../../src/icons/time/clock-alert.tsx) | lucide | time, watch, alarm, warning, wrong |
| `ClockArrowDownIcon` | `@mdevs/icons/time/clock-arrow-down` | [clock-arrow-down.svg](../../svg/time/clock-arrow-down.svg) | [TSX](../../src/icons/time/clock-arrow-down.tsx) | lucide | time, watch, alarm, sort, order, ascending, descending, increasing, decreasing, rising, falling |
| `ClockArrowLeftIcon` | `@mdevs/icons/time/clock-arrow-left` | [clock-arrow-left.svg](../../svg/time/clock-arrow-left.svg) | [TSX](../../src/icons/time/clock-arrow-left.tsx) | lucide | time, watch, alarm, assign, range |
| `ClockArrowRightIcon` | `@mdevs/icons/time/clock-arrow-right` | [clock-arrow-right.svg](../../svg/time/clock-arrow-right.svg) | [TSX](../../src/icons/time/clock-arrow-right.tsx) | lucide | time, watch, alarm, range, unassign |
| `ClockArrowUpIcon` | `@mdevs/icons/time/clock-arrow-up` | [clock-arrow-up.svg](../../svg/time/clock-arrow-up.svg) | [TSX](../../src/icons/time/clock-arrow-up.tsx) | lucide | time, watch, alarm, sort, order, ascending, descending, increasing, decreasing, rising, falling |
| `ClockCheckIcon` | `@mdevs/icons/time/clock-check` | [clock-check.svg](../../svg/time/clock-check.svg) | [TSX](../../src/icons/time/clock-check.tsx) | lucide | time, watch, alarm |
| `ClockFadingIcon` | `@mdevs/icons/time/clock-fading` | [clock-fading.svg](../../svg/time/clock-fading.svg) | [TSX](../../src/icons/time/clock-fading.tsx) | lucide | time, watch, alarm |
| `ClockPlusIcon` | `@mdevs/icons/time/clock-plus` | [clock-plus.svg](../../svg/time/clock-plus.svg) | [TSX](../../src/icons/time/clock-plus.tsx) | lucide | time, watch, alarm, add, create, new |
| `HistoryIcon` | `@mdevs/icons/time/history` | [history.svg](../../svg/time/history.svg) | [TSX](../../src/icons/time/history.tsx) | lucide | — |
| `HourglassIcon` | `@mdevs/icons/time/hourglass` | [hourglass.svg](../../svg/time/hourglass.svg) | [TSX](../../src/icons/time/hourglass.tsx) | lucide | timer, time, sandglass |
| `HourglassCogIcon` | `@mdevs/icons/time/hourglass-cog` | [hourglass-cog.svg](../../svg/time/hourglass-cog.svg) | [TSX](../../src/icons/time/hourglass-cog.tsx) | lucide | timer, time, sandglass, duration, settings, gear, cog, edit, configuration, countdown, timeout, expiration |
| `TimerIcon` | `@mdevs/icons/time/timer` | [timer.svg](../../svg/time/timer.svg) | [TSX](../../src/icons/time/timer.tsx) | lucide | time, timer, stopwatch |
| `TimerOffIcon` | `@mdevs/icons/time/timer-off` | [timer-off.svg](../../svg/time/timer-off.svg) | [TSX](../../src/icons/time/timer-off.tsx) | lucide | time, timer, stopwatch |
| `TimerResetIcon` | `@mdevs/icons/time/timer-reset` | [timer-reset.svg](../../svg/time/timer-reset.svg) | [TSX](../../src/icons/time/timer-reset.tsx) | lucide | time, timer, stopwatch |

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
