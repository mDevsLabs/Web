# Graphiques — icônes

44 icônes de la catégorie `charts`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (24), tabler (20). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {Axis3DIcon} from '@mdevs/icons';
// Alternatives :
import {Axis3DIcon} from '@mdevs/icons/charts';
import {Axis3DIcon} from '@mdevs/icons/charts/axis-3-d';
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
import {Axis3DIcon} from '@mdevs/icons/charts/axis-3-d';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><Axis3DIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <Axis3DIcon size={32} title="Graphiques" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `Axis3DIcon` | `@mdevs/icons/charts/axis-3-d` | [axis-3-d.svg](../../svg/charts/axis-3-d.svg) | [TSX](../../src/icons/charts/axis-3-d.tsx) | lucide | — |
| `ChartArcsIcon` | `@mdevs/icons/charts/chart-arcs` | [chart-arcs.svg](../../svg/charts/chart-arcs.svg) | [TSX](../../src/icons/charts/chart-arcs.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, arcs, visualization, analytics |
| `ChartArcs3Icon` | `@mdevs/icons/charts/chart-arcs-3` | [chart-arcs-3.svg](../../svg/charts/chart-arcs-3.svg) | [TSX](../../src/icons/charts/chart-arcs-3.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, arcs, visualization, analytics |
| `ChartAreaIcon` | `@mdevs/icons/charts/chart-area` | [chart-area.svg](../../svg/charts/chart-area.svg) | [TSX](../../src/icons/charts/chart-area.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, area, visualization, analytics |
| `ChartAreaLineIcon` | `@mdevs/icons/charts/chart-area-line` | [chart-area-line.svg](../../svg/charts/chart-area-line.svg) | [TSX](../../src/icons/charts/chart-area-line.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, area, line, visualization |
| `ChartArrowsIcon` | `@mdevs/icons/charts/chart-arrows` | [chart-arrows.svg](../../svg/charts/chart-arrows.svg) | [TSX](../../src/icons/charts/chart-arrows.tsx) | tabler | statistics, data, value, variable, scale, statistical, level, increase, decrease, chart |
| `ChartArrowsVerticalIcon` | `@mdevs/icons/charts/chart-arrows-vertical` | [chart-arrows-vertical.svg](../../svg/charts/chart-arrows-vertical.svg) | [TSX](../../src/icons/charts/chart-arrows-vertical.tsx) | tabler | statistics, data, value, variable, scale, statistical, level, increase, decrease, chart |
| `ChartBarIcon` | `@mdevs/icons/charts/chart-bar` | [chart-bar.svg](../../svg/charts/chart-bar.svg) | [TSX](../../src/icons/charts/chart-bar.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, bar, visualization, analytics |
| `ChartBarDecreasingIcon` | `@mdevs/icons/charts/chart-bar-decreasing` | [chart-bar-decreasing.svg](../../svg/charts/chart-bar-decreasing.svg) | [TSX](../../src/icons/charts/chart-bar-decreasing.tsx) | lucide | statistics, analytics, diagram, graph, trending down |
| `ChartBarIncreasingIcon` | `@mdevs/icons/charts/chart-bar-increasing` | [chart-bar-increasing.svg](../../svg/charts/chart-bar-increasing.svg) | [TSX](../../src/icons/charts/chart-bar-increasing.tsx) | lucide | statistics, analytics, diagram, graph, trending up |
| `ChartBarOffIcon` | `@mdevs/icons/charts/chart-bar-off` | [chart-bar-off.svg](../../svg/charts/chart-bar-off.svg) | [TSX](../../src/icons/charts/chart-bar-off.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, bar, off, visualization |
| `ChartBarPopularIcon` | `@mdevs/icons/charts/chart-bar-popular` | [chart-bar-popular.svg](../../svg/charts/chart-bar-popular.svg) | [TSX](../../src/icons/charts/chart-bar-popular.tsx) | tabler | analytics, trending, data, statistics, visualization, graph, preference, rating, ranking, chart |
| `ChartBarStackedIcon` | `@mdevs/icons/charts/chart-bar-stacked` | [chart-bar-stacked.svg](../../svg/charts/chart-bar-stacked.svg) | [TSX](../../src/icons/charts/chart-bar-stacked.tsx) | lucide | statistics, analytics, diagram, graph, multivariate, categorical, comparison |
| `ChartBubbleIcon` | `@mdevs/icons/charts/chart-bubble` | [chart-bubble.svg](../../svg/charts/chart-bubble.svg) | [TSX](../../src/icons/charts/chart-bubble.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, bubble, visualization, analytics |
| `ChartCandleIcon` | `@mdevs/icons/charts/chart-candle` | [chart-candle.svg](../../svg/charts/chart-candle.svg) | [TSX](../../src/icons/charts/chart-candle.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, candle, visualization, analytics |
| `ChartCirclesIcon` | `@mdevs/icons/charts/chart-circles` | [chart-circles.svg](../../svg/charts/chart-circles.svg) | [TSX](../../src/icons/charts/chart-circles.tsx) | tabler | statistics, analysis, analyse, graph, chart, circles, visualization, round, circular, analytics |
| `ChartCohortIcon` | `@mdevs/icons/charts/chart-cohort` | [chart-cohort.svg](../../svg/charts/chart-cohort.svg) | [TSX](../../src/icons/charts/chart-cohort.tsx) | tabler | analytics, group, data, visualization, statistics, cluster, demographic, analysis, set, aggregation |
| `ChartColumnIcon` | `@mdevs/icons/charts/chart-column` | [chart-column.svg](../../svg/charts/chart-column.svg) | [TSX](../../src/icons/charts/chart-column.tsx) | tabler | analytics, data, visualization, bar, statistics, vertical, graph, comparison, display, presentation |
| `ChartColumnDecreasingIcon` | `@mdevs/icons/charts/chart-column-decreasing` | [chart-column-decreasing.svg](../../svg/charts/chart-column-decreasing.svg) | [TSX](../../src/icons/charts/chart-column-decreasing.tsx) | lucide | statistics, analytics, diagram, graph, trending down |
| `ChartColumnStackedIcon` | `@mdevs/icons/charts/chart-column-stacked` | [chart-column-stacked.svg](../../svg/charts/chart-column-stacked.svg) | [TSX](../../src/icons/charts/chart-column-stacked.tsx) | lucide | statistics, analytics, diagram, graph, multivariate, categorical, comparison |
| `ChartCovariateIcon` | `@mdevs/icons/charts/chart-covariate` | [chart-covariate.svg](../../svg/charts/chart-covariate.svg) | [TSX](../../src/icons/charts/chart-covariate.tsx) | tabler | analytics, variable, data, statistics, analysis, correlation, relationship, dependency, visualization, graph |
| `ChartDonutIcon` | `@mdevs/icons/charts/chart-donut` | [chart-donut.svg](../../svg/charts/chart-donut.svg) | [TSX](../../src/icons/charts/chart-donut.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, donut, visualization, analytics |
| `ChartDonut2Icon` | `@mdevs/icons/charts/chart-donut-2` | [chart-donut-2.svg](../../svg/charts/chart-donut-2.svg) | [TSX](../../src/icons/charts/chart-donut-2.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, donut, visualization, analytics |
| `ChartDonut3Icon` | `@mdevs/icons/charts/chart-donut-3` | [chart-donut-3.svg](../../svg/charts/chart-donut-3.svg) | [TSX](../../src/icons/charts/chart-donut-3.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, donut, visualization, analytics |
| `ChartDonut4Icon` | `@mdevs/icons/charts/chart-donut-4` | [chart-donut-4.svg](../../svg/charts/chart-donut-4.svg) | [TSX](../../src/icons/charts/chart-donut-4.tsx) | tabler | statistics, diagram, graph, rhythm, data, analysis, chart, donut, visualization, analytics |
| `ChartDotsIcon` | `@mdevs/icons/charts/chart-dots` | [chart-dots.svg](../../svg/charts/chart-dots.svg) | [TSX](../../src/icons/charts/chart-dots.tsx) | tabler | statistics, data, value, variable, scale, statistical, chart, dots, visualization, analytics |
| `ChartGanttIcon` | `@mdevs/icons/charts/chart-gantt` | [chart-gantt.svg](../../svg/charts/chart-gantt.svg) | [TSX](../../src/icons/charts/chart-gantt.tsx) | lucide | diagram, graph, timeline, planning |
| `ChartLineIcon` | `@mdevs/icons/charts/chart-line` | [chart-line.svg](../../svg/charts/chart-line.svg) | [TSX](../../src/icons/charts/chart-line.tsx) | lucide | statistics, analytics, diagram, graph |
| `ChartNetworkIcon` | `@mdevs/icons/charts/chart-network` | [chart-network.svg](../../svg/charts/chart-network.svg) | [TSX](../../src/icons/charts/chart-network.tsx) | lucide | statistics, analytics, diagram, graph, topology, cluster, web, nodes, connections, edges |
| `ChartNoAxesColumnDecreasingIcon` | `@mdevs/icons/charts/chart-no-axes-column-decreasing` | [chart-no-axes-column-decreasing.svg](../../svg/charts/chart-no-axes-column-decreasing.svg) | [TSX](../../src/icons/charts/chart-no-axes-column-decreasing.tsx) | lucide | statistics, analytics, diagram, graph, trending down |
| `ChartNoAxesCombinedIcon` | `@mdevs/icons/charts/chart-no-axes-combined` | [chart-no-axes-combined.svg](../../svg/charts/chart-no-axes-combined.svg) | [TSX](../../src/icons/charts/chart-no-axes-combined.tsx) | lucide | statistics, analytics, diagram, graph, trending up |
| `ChartNoAxesGanttIcon` | `@mdevs/icons/charts/chart-no-axes-gantt` | [chart-no-axes-gantt.svg](../../svg/charts/chart-no-axes-gantt.svg) | [TSX](../../src/icons/charts/chart-no-axes-gantt.tsx) | lucide | projects, manage, overview, roadmap, plan, intentions, timeline, deadline, date, event, range, period, productivity, work, agile, code, coding |
| `ChartPieIcon` | `@mdevs/icons/charts/chart-pie` | [chart-pie.svg](../../svg/charts/chart-pie.svg) | [TSX](../../src/icons/charts/chart-pie.tsx) | lucide | statistics, analytics, diagram, presentation |
| `ChartScatterIcon` | `@mdevs/icons/charts/chart-scatter` | [chart-scatter.svg](../../svg/charts/chart-scatter.svg) | [TSX](../../src/icons/charts/chart-scatter.tsx) | lucide | statistics, analytics, diagram, graph |
| `ChartSplineIcon` | `@mdevs/icons/charts/chart-spline` | [chart-spline.svg](../../svg/charts/chart-spline.svg) | [TSX](../../src/icons/charts/chart-spline.tsx) | lucide | statistics, analytics, diagram, graph, curve, continuous, smooth, polynomial, quadratic, function, interpolation |
| `PercentIcon` | `@mdevs/icons/charts/percent` | [percent.svg](../../svg/charts/percent.svg) | [TSX](../../src/icons/charts/percent.tsx) | lucide | percentage, modulo, modulus, remainder, %, sale, discount, offer, marketing |
| `PercentSquareIcon` | `@mdevs/icons/charts/percent-square` | [percent-square.svg](../../svg/charts/percent-square.svg) | [TSX](../../src/icons/charts/percent-square.tsx) | lucide | — |
| `PiIcon` | `@mdevs/icons/charts/pi` | [pi.svg](../../svg/charts/pi.svg) | [TSX](../../src/icons/charts/pi.tsx) | lucide | constant, code, coding, programming, symbol, trigonometry, geometry, formula |
| `PiSquareIcon` | `@mdevs/icons/charts/pi-square` | [pi-square.svg](../../svg/charts/pi-square.svg) | [TSX](../../src/icons/charts/pi-square.tsx) | lucide | — |
| `SigmaIcon` | `@mdevs/icons/charts/sigma` | [sigma.svg](../../svg/charts/sigma.svg) | [TSX](../../src/icons/charts/sigma.tsx) | lucide | sum, calculate, formula, math, enumeration, enumerate |
| `SigmaSquareIcon` | `@mdevs/icons/charts/sigma-square` | [sigma-square.svg](../../svg/charts/sigma-square.svg) | [TSX](../../src/icons/charts/sigma-square.tsx) | lucide | — |
| `TrendingDownIcon` | `@mdevs/icons/charts/trending-down` | [trending-down.svg](../../svg/charts/trending-down.svg) | [TSX](../../src/icons/charts/trending-down.tsx) | lucide | statistics |
| `TrendingUpIcon` | `@mdevs/icons/charts/trending-up` | [trending-up.svg](../../svg/charts/trending-up.svg) | [TSX](../../src/icons/charts/trending-up.tsx) | lucide | statistics |
| `TrendingUpDownIcon` | `@mdevs/icons/charts/trending-up-down` | [trending-up-down.svg](../../svg/charts/trending-up-down.svg) | [TSX](../../src/icons/charts/trending-up-down.tsx) | lucide | arrows, estimated, indeterminate, data fluctuation, uncertain, forecast, variable, prediction, dynamic, volatile |

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
