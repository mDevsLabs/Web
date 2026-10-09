# Bâtiments — icônes

35 icônes de la catégorie `buildings`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (21), tabler (14). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {BuildingIcon} from '@mdevs/icons';
// Alternatives :
import {BuildingIcon} from '@mdevs/icons/buildings';
import {BuildingIcon} from '@mdevs/icons/buildings/building';
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
import {BuildingIcon} from '@mdevs/icons/buildings/building';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><BuildingIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <BuildingIcon size={32} title="Bâtiments" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `BuildingIcon` | `@mdevs/icons/buildings/building` | [building.svg](../../svg/buildings/building.svg) | [TSX](../../src/icons/buildings/building.tsx) | lucide | organisation, organization |
| `Building2Icon` | `@mdevs/icons/buildings/building-2` | [building-2.svg](../../svg/buildings/building-2.svg) | [TSX](../../src/icons/buildings/building-2.tsx) | lucide | — |
| `BuildingAirportIcon` | `@mdevs/icons/buildings/building-airport` | [building-airport.svg](../../svg/buildings/building-airport.svg) | [TSX](../../src/icons/buildings/building-airport.tsx) | tabler | terminal, flight, travel, aviation, hub, transportation, aircraft, facility, runway, airport |
| `BuildingArchIcon` | `@mdevs/icons/buildings/building-arch` | [building-arch.svg](../../svg/buildings/building-arch.svg) | [TSX](../../src/icons/buildings/building-arch.tsx) | tabler | arc, curve, dome, monument, history, architecture, building, arch, structure, construction |
| `BuildingBankIcon` | `@mdevs/icons/buildings/building-bank` | [building-bank.svg](../../svg/buildings/building-bank.svg) | [TSX](../../src/icons/buildings/building-bank.tsx) | tabler | architecture, city, urban, construction, money, credit, loan, workplace, building, bank |
| `BuildingBridgeIcon` | `@mdevs/icons/buildings/building-bridge` | [building-bridge.svg](../../svg/buildings/building-bridge.svg) | [TSX](../../src/icons/buildings/building-bridge.tsx) | tabler | architecture, urban, river, overpass, city, countryside, building, bridge, structure, construction |
| `BuildingBridge2Icon` | `@mdevs/icons/buildings/building-bridge-2` | [building-bridge-2.svg](../../svg/buildings/building-bridge-2.svg) | [TSX](../../src/icons/buildings/building-bridge-2.tsx) | tabler | architecture, urban, river, overpass, city, countryside, building, bridge, structure, construction |
| `BuildingBroadcastTowerIcon` | `@mdevs/icons/buildings/building-broadcast-tower` | [building-broadcast-tower.svg](../../svg/buildings/building-broadcast-tower.svg) | [TSX](../../src/icons/buildings/building-broadcast-tower.tsx) | tabler | communication, internet, signal, building, broadcast, tower, architecture, structure, construction, property |
| `BuildingBurjAlArabIcon` | `@mdevs/icons/buildings/building-burj-al-arab` | [building-burj-al-arab.svg](../../svg/buildings/building-burj-al-arab.svg) | [TSX](../../src/icons/buildings/building-burj-al-arab.tsx) | tabler | hotel, dubai, landmark, luxury, architecture, sail, iconic, resort, skyline, tourism |
| `BuildingCarouselIcon` | `@mdevs/icons/buildings/building-carousel` | [building-carousel.svg](../../svg/buildings/building-carousel.svg) | [TSX](../../src/icons/buildings/building-carousel.tsx) | tabler | amusement, park, fair, merry-go-round, fun, entertaianment, building, carousel, architecture, structure |
| `BuildingCastleIcon` | `@mdevs/icons/buildings/building-castle` | [building-castle.svg](../../svg/buildings/building-castle.svg) | [TSX](../../src/icons/buildings/building-castle.tsx) | tabler | king, queen, royal, architecture, medieval, middle, ages, nobility, tower, fortress, fort, fortification, princess, prince |
| `BuildingChurchIcon` | `@mdevs/icons/buildings/building-church` | [building-church.svg](../../svg/buildings/building-church.svg) | [TSX](../../src/icons/buildings/building-church.tsx) | tabler | religion, chapel, sanctuary, temple, cathedral, pray, prayer, building, church, architecture |
| `BuildingCircusIcon` | `@mdevs/icons/buildings/building-circus` | [building-circus.svg](../../svg/buildings/building-circus.svg) | [TSX](../../src/icons/buildings/building-circus.tsx) | tabler | tent, show, carnival, clown, building, circus, architecture, structure, construction, property |
| `BuildingCogIcon` | `@mdevs/icons/buildings/building-cog` | [building-cog.svg](../../svg/buildings/building-cog.svg) | [TSX](../../src/icons/buildings/building-cog.tsx) | tabler | flat, office, city, urban, scyscraper, architecture, construction, building, cog, structure |
| `BuildingCommunityIcon` | `@mdevs/icons/buildings/building-community` | [building-community.svg](../../svg/buildings/building-community.svg) | [TSX](../../src/icons/buildings/building-community.tsx) | tabler | place, skyscraper, district neighborhood, area, building, community, architecture, structure, construction, property |
| `BuildingComplexPlusIcon` | `@mdevs/icons/buildings/building-complex-plus` | [building-complex-plus.svg](../../svg/buildings/building-complex-plus.svg) | [TSX](../../src/icons/buildings/building-complex-plus.tsx) | lucide | business, company, enterprise, skyscraper, organisation, organization, city, new, add, create, increase, office, headquarters, startup, registration, onboarding, realestate, property |
| `BuildingCottageIcon` | `@mdevs/icons/buildings/building-cottage` | [building-cottage.svg](../../svg/buildings/building-cottage.svg) | [TSX](../../src/icons/buildings/building-cottage.tsx) | tabler | small, house, countryside, live, farm, rural, outskirts, building, cottage, architecture |
| `CastleIcon` | `@mdevs/icons/buildings/castle` | [castle.svg](../../svg/buildings/castle.svg) | [TSX](../../src/icons/buildings/castle.tsx) | lucide | fortress, stronghold, palace, chateau, building |
| `ChurchIcon` | `@mdevs/icons/buildings/church` | [church.svg](../../svg/buildings/church.svg) | [TSX](../../src/icons/buildings/church.tsx) | lucide | temple, building |
| `DoorClosedIcon` | `@mdevs/icons/buildings/door-closed` | [door-closed.svg](../../svg/buildings/door-closed.svg) | [TSX](../../src/icons/buildings/door-closed.tsx) | lucide | entrance, entry, exit, ingress, egress, gate, gateway, emergency exit |
| `DoorClosedCogIcon` | `@mdevs/icons/buildings/door-closed-cog` | [door-closed-cog.svg](../../svg/buildings/door-closed-cog.svg) | [TSX](../../src/icons/buildings/door-closed-cog.tsx) | lucide | room, entrance, entry, settings, gear, access, automation |
| `DoorClosedLockedIcon` | `@mdevs/icons/buildings/door-closed-locked` | [door-closed-locked.svg](../../svg/buildings/door-closed-locked.svg) | [TSX](../../src/icons/buildings/door-closed-locked.tsx) | lucide | entrance, entry, exit, ingress, egress, gate, gateway, emergency exit, lock |
| `DoorClosedPackageIcon` | `@mdevs/icons/buildings/door-closed-package` | [door-closed-package.svg](../../svg/buildings/door-closed-package.svg) | [TSX](../../src/icons/buildings/door-closed-package.tsx) | lucide | delivery, parcel, doorstep, shipping, drop-off, courier |
| `DoorOpenIcon` | `@mdevs/icons/buildings/door-open` | [door-open.svg](../../svg/buildings/door-open.svg) | [TSX](../../src/icons/buildings/door-open.tsx) | lucide | entrance, entry, exit, ingress, egress, gate, gateway, emergency exit |
| `DoorStairwellIcon` | `@mdevs/icons/buildings/door-stairwell` | [door-stairwell.svg](../../svg/buildings/door-stairwell.svg) | [TSX](../../src/icons/buildings/door-stairwell.tsx) | lucide | staircase, stairway, stairs, steps, ladder, transition, access, structure, spiral, building, vertical, movement, floor, level, entrance, entry, exit, egress, route, indoor, emergency exit |
| `FactoryIcon` | `@mdevs/icons/buildings/factory` | [factory.svg](../../svg/buildings/factory.svg) | [TSX](../../src/icons/buildings/factory.tsx) | lucide | building, business, energy, industry, manufacture, sector |
| `FenceIcon` | `@mdevs/icons/buildings/fence` | [fence.svg](../../svg/buildings/fence.svg) | [TSX](../../src/icons/buildings/fence.tsx) | lucide | picket, panels, woodwork, diy, materials, suburban, garden, property, territory |
| `HomeIcon` | `@mdevs/icons/buildings/home` | [home.svg](../../svg/buildings/home.svg) | [TSX](../../src/icons/buildings/home.tsx) | lucide | — |
| `HouseCogIcon` | `@mdevs/icons/buildings/house-cog` | [house-cog.svg](../../svg/buildings/house-cog.svg) | [TSX](../../src/icons/buildings/house-cog.tsx) | lucide | home, building, residence, settings, gear, configuration, property, automation |
| `HouseHeartIcon` | `@mdevs/icons/buildings/house-heart` | [house-heart.svg](../../svg/buildings/house-heart.svg) | [TSX](../../src/icons/buildings/house-heart.tsx) | lucide | home sweet home, abode, building, residence, healthy living, lifestyle |
| `HousePlugIcon` | `@mdevs/icons/buildings/house-plug` | [house-plug.svg](../../svg/buildings/house-plug.svg) | [TSX](../../src/icons/buildings/house-plug.tsx) | lucide | home, living, building, residence, architecture, autarky, energy |
| `HousePlusIcon` | `@mdevs/icons/buildings/house-plus` | [house-plus.svg](../../svg/buildings/house-plus.svg) | [TSX](../../src/icons/buildings/house-plus.tsx) | lucide | home, living, medical, new, addition, building, residence, architecture |
| `HouseWifiIcon` | `@mdevs/icons/buildings/house-wifi` | [house-wifi.svg](../../svg/buildings/house-wifi.svg) | [TSX](../../src/icons/buildings/house-wifi.tsx) | lucide | home, living, building, wifi, connectivity |
| `LandmarkIcon` | `@mdevs/icons/buildings/landmark` | [landmark.svg](../../svg/buildings/landmark.svg) | [TSX](../../src/icons/buildings/landmark.tsx) | lucide | bank, building, capitol, finance, money, museum, art gallery, hall, institute, pediment, portico, doric, columns, pillars, classical, architecture, government, institution, monument, site, history, historic, library, temple, ancient, structure |
| `WarehouseIcon` | `@mdevs/icons/buildings/warehouse` | [warehouse.svg](../../svg/buildings/warehouse.svg) | [TSX](../../src/icons/buildings/warehouse.tsx) | lucide | storage, storehouse, depot, depository, repository, stockroom, logistics, building |

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
