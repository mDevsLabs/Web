# Transport — icônes

35 icônes de la catégorie `transport`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (23), tabler (12). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {AmbulanceIcon} from '@mdevs/icons';
// Alternatives :
import {AmbulanceIcon} from '@mdevs/icons/transport';
import {AmbulanceIcon} from '@mdevs/icons/transport/ambulance';
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
import {AmbulanceIcon} from '@mdevs/icons/transport/ambulance';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><AmbulanceIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <AmbulanceIcon size={32} title="Transport" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `AmbulanceIcon` | `@mdevs/icons/transport/ambulance` | [ambulance.svg](../../svg/transport/ambulance.svg) | [TSX](../../src/icons/transport/ambulance.tsx) | lucide | ambulance, emergency, medical, vehicle, siren, healthcare, transportation, rescue, urgent, first aid |
| `BikeIcon` | `@mdevs/icons/transport/bike` | [bike.svg](../../svg/transport/bike.svg) | [TSX](../../src/icons/transport/bike.tsx) | lucide | bicycle, transport, trip |
| `BikeOffIcon` | `@mdevs/icons/transport/bike-off` | [bike-off.svg](../../svg/transport/bike-off.svg) | [TSX](../../src/icons/transport/bike-off.tsx) | tabler | cycling, bicycle, sport, wheel, bike, off, transport, travel, disabled, inactive |
| `BusIcon` | `@mdevs/icons/transport/bus` | [bus.svg](../../svg/transport/bus.svg) | [TSX](../../src/icons/transport/bus.tsx) | lucide | bus, vehicle, transport, trip |
| `BusFrontIcon` | `@mdevs/icons/transport/bus-front` | [bus-front.svg](../../svg/transport/bus-front.svg) | [TSX](../../src/icons/transport/bus-front.tsx) | lucide | coach, vehicle, trip, road |
| `BusOffIcon` | `@mdevs/icons/transport/bus-off` | [bus-off.svg](../../svg/transport/bus-off.svg) | [TSX](../../src/icons/transport/bus-off.tsx) | tabler | vehicle, drive, driver, engine, motor, journey, trip, bus, off, transport |
| `BusStopIcon` | `@mdevs/icons/transport/bus-stop` | [bus-stop.svg](../../svg/transport/bus-stop.svg) | [TSX](../../src/icons/transport/bus-stop.tsx) | tabler | transport, station, city, travel, bus, stop, vehicle, automobile, mobility |
| `CarIcon` | `@mdevs/icons/transport/car` | [car.svg](../../svg/transport/car.svg) | [TSX](../../src/icons/transport/car.tsx) | lucide | vehicle, drive, trip, journey |
| `Car4wdIcon` | `@mdevs/icons/transport/car-4wd` | [car-4wd.svg](../../svg/transport/car-4wd.svg) | [TSX](../../src/icons/transport/car-4wd.tsx) | tabler | vehicle, off-road, traction, adventure, drive, power, automobile, transport, four-wheel, terrain |
| `CarBatteryIcon` | `@mdevs/icons/transport/car-battery` | [car-battery.svg](../../svg/transport/car-battery.svg) | [TSX](../../src/icons/transport/car-battery.tsx) | lucide | battery, automobile, powercell, electric, power, electricity, energy, accumulator, charge, transport, vehicle, car |
| `CarCraneIcon` | `@mdevs/icons/transport/car-crane` | [car-crane.svg](../../svg/transport/car-crane.svg) | [TSX](../../src/icons/transport/car-crane.tsx) | tabler | transport, truck, machine, lifter, car, crane, travel, vehicle, automobile, mobility |
| `CarCrashIcon` | `@mdevs/icons/transport/car-crash` | [car-crash.svg](../../svg/transport/car-crash.svg) | [TSX](../../src/icons/transport/car-crash.tsx) | tabler | accident, collision, damage, insurance, car, crash, transport, travel, vehicle, automobile |
| `CarDoorIcon` | `@mdevs/icons/transport/car-door` | [car-door.svg](../../svg/transport/car-door.svg) | [TSX](../../src/icons/transport/car-door.tsx) | tabler | car, door, vehicle, auto, automobile, transport, travel, hatch, panel, garage |
| `CarFanIcon` | `@mdevs/icons/transport/car-fan` | [car-fan.svg](../../svg/transport/car-fan.svg) | [TSX](../../src/icons/transport/car-fan.tsx) | tabler | vehicle, ventilation, cooling, airflow, automobile, automotive, auto, drive, climate, mechanic |
| `CarFan1Icon` | `@mdevs/icons/transport/car-fan-1` | [car-fan-1.svg](../../svg/transport/car-fan-1.svg) | [TSX](../../src/icons/transport/car-fan-1.tsx) | tabler | vehicle, ventilation, cooling, airflow, auto, automobile, drive, mechanic, transport, climate |
| `CarFan2Icon` | `@mdevs/icons/transport/car-fan-2` | [car-fan-2.svg](../../svg/transport/car-fan-2.svg) | [TSX](../../src/icons/transport/car-fan-2.tsx) | tabler | vehicle, ventilation, cooling, circulation, automobile, drive, auto, mechanic, fan, airflow |
| `CarFan3Icon` | `@mdevs/icons/transport/car-fan-3` | [car-fan-3.svg](../../svg/transport/car-fan-3.svg) | [TSX](../../src/icons/transport/car-fan-3.tsx) | tabler | vehicle, airflow, cooling, ventilation, drive, auto, automobile, fan, mechanic, climate |
| `CarFanAutoIcon` | `@mdevs/icons/transport/car-fan-auto` | [car-fan-auto.svg](../../svg/transport/car-fan-auto.svg) | [TSX](../../src/icons/transport/car-fan-auto.tsx) | tabler | vehicle, ventilation, automatic, auto, cooling, airflow, driving, automobile, mechanic, climate |
| `CarFrontIcon` | `@mdevs/icons/transport/car-front` | [car-front.svg](../../svg/transport/car-front.svg) | [TSX](../../src/icons/transport/car-front.tsx) | lucide | vehicle, drive, trip, journey |
| `CarTaxiFrontIcon` | `@mdevs/icons/transport/car-taxi-front` | [car-taxi-front.svg](../../svg/transport/car-taxi-front.svg) | [TSX](../../src/icons/transport/car-taxi-front.tsx) | lucide | cab, vehicle, drive, trip, journey |
| `PlaneIcon` | `@mdevs/icons/transport/plane` | [plane.svg](../../svg/transport/plane.svg) | [TSX](../../src/icons/transport/plane.tsx) | lucide | plane, trip, airplane |
| `PlaneLandingIcon` | `@mdevs/icons/transport/plane-landing` | [plane-landing.svg](../../svg/transport/plane-landing.svg) | [TSX](../../src/icons/transport/plane-landing.tsx) | lucide | arrival, plane, trip, airplane, landing |
| `PlaneTakeoffIcon` | `@mdevs/icons/transport/plane-takeoff` | [plane-takeoff.svg](../../svg/transport/plane-takeoff.svg) | [TSX](../../src/icons/transport/plane-takeoff.tsx) | lucide | departure, plane, trip, airplane, takeoff |
| `RocketIcon` | `@mdevs/icons/transport/rocket` | [rocket.svg](../../svg/transport/rocket.svg) | [TSX](../../src/icons/transport/rocket.tsx) | lucide | release, boost, launch, space, version |
| `SailboatIcon` | `@mdevs/icons/transport/sailboat` | [sailboat.svg](../../svg/transport/sailboat.svg) | [TSX](../../src/icons/transport/sailboat.tsx) | lucide | ship, boat, harbor, harbour, dock |
| `ShipIcon` | `@mdevs/icons/transport/ship` | [ship.svg](../../svg/transport/ship.svg) | [TSX](../../src/icons/transport/ship.tsx) | lucide | boat, knots, nautical mile, maritime, sailing, yacht, cruise, ocean liner, tanker, vessel, navy, trip, releases |
| `ShipCargoIcon` | `@mdevs/icons/transport/ship-cargo` | [ship-cargo.svg](../../svg/transport/ship-cargo.svg) | [TSX](../../src/icons/transport/ship-cargo.tsx) | lucide | boat, knots, nautical mile, maritime, sailing, cruise, ocean liner, tanker, vessel, navy, cargo, container, freighter, freight, shipping, port, harbor, dock, logistics, import, export |
| `ShipWheelIcon` | `@mdevs/icons/transport/ship-wheel` | [ship-wheel.svg](../../svg/transport/ship-wheel.svg) | [TSX](../../src/icons/transport/ship-wheel.tsx) | lucide | steering, rudder, boat, knots, nautical mile, maritime, sailing, yacht, cruise, ocean liner, tanker, vessel, navy, trip |
| `TractorIcon` | `@mdevs/icons/transport/tractor` | [tractor.svg](../../svg/transport/tractor.svg) | [TSX](../../src/icons/transport/tractor.tsx) | lucide | farming, farmer, ranch, harvest, equipment, vehicle |
| `TrainIcon` | `@mdevs/icons/transport/train` | [train.svg](../../svg/transport/train.svg) | [TSX](../../src/icons/transport/train.tsx) | lucide | — |
| `TrainFrontIcon` | `@mdevs/icons/transport/train-front` | [train-front.svg](../../svg/transport/train-front.svg) | [TSX](../../src/icons/transport/train-front.tsx) | lucide | railway, metro, subway, underground, high-speed, bullet, fast, track, line |
| `TrainFrontTunnelIcon` | `@mdevs/icons/transport/train-front-tunnel` | [train-front-tunnel.svg](../../svg/transport/train-front-tunnel.svg) | [TSX](../../src/icons/transport/train-front-tunnel.tsx) | lucide | railway, metro, subway, underground, speed, bullet, fast, track, line |
| `TrainTrackIcon` | `@mdevs/icons/transport/train-track` | [train-track.svg](../../svg/transport/train-track.svg) | [TSX](../../src/icons/transport/train-track.tsx) | lucide | railway, line |
| `TruckIcon` | `@mdevs/icons/transport/truck` | [truck.svg](../../svg/transport/truck.svg) | [TSX](../../src/icons/transport/truck.tsx) | lucide | delivery, van, shipping, haulage, lorry |
| `TruckElectricIcon` | `@mdevs/icons/transport/truck-electric` | [truck-electric.svg](../../svg/transport/truck-electric.svg) | [TSX](../../src/icons/transport/truck-electric.tsx) | lucide | delivery, van, shipping, haulage, lorry, electric |

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
