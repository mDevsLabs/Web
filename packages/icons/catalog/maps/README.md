# Cartes et position — icônes

31 icônes de la catégorie `maps`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (30), tabler (1). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {CompassIcon} from '@mdevs/icons';
// Alternatives :
import {CompassIcon} from '@mdevs/icons/maps';
import {CompassIcon} from '@mdevs/icons/maps/compass';
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
import {CompassIcon} from '@mdevs/icons/maps/compass';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><CompassIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <CompassIcon size={32} title="Cartes et position" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `CompassIcon` | `@mdevs/icons/maps/compass` | [compass.svg](../../svg/maps/compass.svg) | [TSX](../../src/icons/maps/compass.tsx) | lucide | direction, north, east, south, west, browser |
| `CompassOffIcon` | `@mdevs/icons/maps/compass-off` | [compass-off.svg](../../svg/maps/compass-off.svg) | [TSX](../../src/icons/maps/compass-off.tsx) | tabler | navigation, safari, travel, direction, discover, compass, off, location, disabled, inactive |
| `LocateIcon` | `@mdevs/icons/maps/locate` | [locate.svg](../../svg/maps/locate.svg) | [TSX](../../src/icons/maps/locate.tsx) | lucide | map, gps, location, cross |
| `LocateFixedIcon` | `@mdevs/icons/maps/locate-fixed` | [locate-fixed.svg](../../svg/maps/locate-fixed.svg) | [TSX](../../src/icons/maps/locate-fixed.tsx) | lucide | map, gps, location, cross |
| `LocateOffIcon` | `@mdevs/icons/maps/locate-off` | [locate-off.svg](../../svg/maps/locate-off.svg) | [TSX](../../src/icons/maps/locate-off.tsx) | lucide | map, gps, location, cross |
| `MapIcon` | `@mdevs/icons/maps/map` | [map.svg](../../svg/maps/map.svg) | [TSX](../../src/icons/maps/map.tsx) | lucide | location, navigation, travel |
| `MapMinusIcon` | `@mdevs/icons/maps/map-minus` | [map-minus.svg](../../svg/maps/map-minus.svg) | [TSX](../../src/icons/maps/map-minus.tsx) | lucide | location, navigation, travel, drop, delete, remove, erase |
| `MapPinIcon` | `@mdevs/icons/maps/map-pin` | [map-pin.svg](../../svg/maps/map-pin.svg) | [TSX](../../src/icons/maps/map-pin.tsx) | lucide | location, waypoint, marker, drop |
| `MapPinCheckIcon` | `@mdevs/icons/maps/map-pin-check` | [map-pin-check.svg](../../svg/maps/map-pin-check.svg) | [TSX](../../src/icons/maps/map-pin-check.tsx) | lucide | location, waypoint, marker, drop, done, tick, complete, task, added |
| `MapPinCheckInsideIcon` | `@mdevs/icons/maps/map-pin-check-inside` | [map-pin-check-inside.svg](../../svg/maps/map-pin-check-inside.svg) | [TSX](../../src/icons/maps/map-pin-check-inside.tsx) | lucide | location, waypoint, marker, drop, done, tick, complete, task, added |
| `MapPinHouseIcon` | `@mdevs/icons/maps/map-pin-house` | [map-pin-house.svg](../../svg/maps/map-pin-house.svg) | [TSX](../../src/icons/maps/map-pin-house.tsx) | lucide | location, waypoint, marker, drop, home, living, building, residence, architecture, address, poi, real estate, property, navigation, destination, geolocation, place, landmark |
| `MapPinMinusIcon` | `@mdevs/icons/maps/map-pin-minus` | [map-pin-minus.svg](../../svg/maps/map-pin-minus.svg) | [TSX](../../src/icons/maps/map-pin-minus.tsx) | lucide | location, waypoint, marker, drop, delete, remove, erase |
| `MapPinMinusInsideIcon` | `@mdevs/icons/maps/map-pin-minus-inside` | [map-pin-minus-inside.svg](../../svg/maps/map-pin-minus-inside.svg) | [TSX](../../src/icons/maps/map-pin-minus-inside.tsx) | lucide | location, waypoint, marker, drop, delete, remove, erase |
| `MapPinOffIcon` | `@mdevs/icons/maps/map-pin-off` | [map-pin-off.svg](../../svg/maps/map-pin-off.svg) | [TSX](../../src/icons/maps/map-pin-off.tsx) | lucide | location, waypoint, marker, remove |
| `MapPinPlusIcon` | `@mdevs/icons/maps/map-pin-plus` | [map-pin-plus.svg](../../svg/maps/map-pin-plus.svg) | [TSX](../../src/icons/maps/map-pin-plus.tsx) | lucide | location, waypoint, marker, drop, add, create, new |
| `MapPinPlusInsideIcon` | `@mdevs/icons/maps/map-pin-plus-inside` | [map-pin-plus-inside.svg](../../svg/maps/map-pin-plus-inside.svg) | [TSX](../../src/icons/maps/map-pin-plus-inside.tsx) | lucide | location, waypoint, marker, drop, add, create, new |
| `MapPinSearchIcon` | `@mdevs/icons/maps/map-pin-search` | [map-pin-search.svg](../../svg/maps/map-pin-search.svg) | [TSX](../../src/icons/maps/map-pin-search.tsx) | lucide | location, navigation, travel, waypoint, marker, drop |
| `MapPinXIcon` | `@mdevs/icons/maps/map-pin-x` | [map-pin-x.svg](../../svg/maps/map-pin-x.svg) | [TSX](../../src/icons/maps/map-pin-x.tsx) | lucide | location, waypoint, marker, drop, delete, remove, erase |
| `MapPinXInsideIcon` | `@mdevs/icons/maps/map-pin-x-inside` | [map-pin-x-inside.svg](../../svg/maps/map-pin-x-inside.svg) | [TSX](../../src/icons/maps/map-pin-x-inside.tsx) | lucide | location, waypoint, marker, drop, delete, remove, erase |
| `MapPinnedIcon` | `@mdevs/icons/maps/map-pinned` | [map-pinned.svg](../../svg/maps/map-pinned.svg) | [TSX](../../src/icons/maps/map-pinned.tsx) | lucide | location, waypoint, marker, drop |
| `MapPlusIcon` | `@mdevs/icons/maps/map-plus` | [map-plus.svg](../../svg/maps/map-plus.svg) | [TSX](../../src/icons/maps/map-plus.tsx) | lucide | location, navigation, travel, new, add, create |
| `NavigationIcon` | `@mdevs/icons/maps/navigation` | [navigation.svg](../../svg/maps/navigation.svg) | [TSX](../../src/icons/maps/navigation.tsx) | lucide | location, travel |
| `Navigation2Icon` | `@mdevs/icons/maps/navigation-2` | [navigation-2.svg](../../svg/maps/navigation-2.svg) | [TSX](../../src/icons/maps/navigation-2.tsx) | lucide | location, travel |
| `Navigation2OffIcon` | `@mdevs/icons/maps/navigation-2-off` | [navigation-2-off.svg](../../svg/maps/navigation-2-off.svg) | [TSX](../../src/icons/maps/navigation-2-off.tsx) | lucide | location, travel |
| `NavigationOffIcon` | `@mdevs/icons/maps/navigation-off` | [navigation-off.svg](../../svg/maps/navigation-off.svg) | [TSX](../../src/icons/maps/navigation-off.tsx) | lucide | location, travel |
| `PinIcon` | `@mdevs/icons/maps/pin` | [pin.svg](../../svg/maps/pin.svg) | [TSX](../../src/icons/maps/pin.tsx) | lucide | save, map, lock, fix |
| `PinOffIcon` | `@mdevs/icons/maps/pin-off` | [pin-off.svg](../../svg/maps/pin-off.svg) | [TSX](../../src/icons/maps/pin-off.tsx) | lucide | unpin, map, unlock, unfix, unsave, remove |
| `RouteIcon` | `@mdevs/icons/maps/route` | [route.svg](../../svg/maps/route.svg) | [TSX](../../src/icons/maps/route.tsx) | lucide | path, journey, planner, points, stops, stations |
| `RouteOffIcon` | `@mdevs/icons/maps/route-off` | [route-off.svg](../../svg/maps/route-off.svg) | [TSX](../../src/icons/maps/route-off.tsx) | lucide | path, journey, planner, points, stops, stations, reset, clear, cancelled, closed, blocked |
| `SignpostIcon` | `@mdevs/icons/maps/signpost` | [signpost.svg](../../svg/maps/signpost.svg) | [TSX](../../src/icons/maps/signpost.tsx) | lucide | navigation, direction, arrow, wayfinding, guide, location, pointer, route, indicator, marker, bidirectional, left, right, east, west |
| `SignpostBigIcon` | `@mdevs/icons/maps/signpost-big` | [signpost-big.svg](../../svg/maps/signpost-big.svg) | [TSX](../../src/icons/maps/signpost-big.tsx) | lucide | bidirectional, left, right, east, west |

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
