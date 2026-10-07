# Énergie — icônes

27 icônes de la catégorie `energy`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (18), tabler (9). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {BatteryIcon} from '@mdevs/icons';
// Alternatives :
import {BatteryIcon} from '@mdevs/icons/energy';
import {BatteryIcon} from '@mdevs/icons/energy/battery';
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
import {BatteryIcon} from '@mdevs/icons/energy/battery';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><BatteryIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <BatteryIcon size={32} title="Énergie" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `BatteryIcon` | `@mdevs/icons/energy/battery` | [battery.svg](../../svg/energy/battery.svg) | [TSX](../../src/icons/energy/battery.tsx) | lucide | power, electricity, energy, accumulator, charge |
| `Battery1Icon` | `@mdevs/icons/energy/battery-1` | [battery-1.svg](../../svg/energy/battery-1.svg) | [TSX](../../src/icons/energy/battery-1.tsx) | tabler | energy, power, electricity, battery, charge, hardware, technology, electric, electronic, gadget |
| `Battery2Icon` | `@mdevs/icons/energy/battery-2` | [battery-2.svg](../../svg/energy/battery-2.svg) | [TSX](../../src/icons/energy/battery-2.tsx) | tabler | energy, power, electricity, battery, charge, hardware, technology, electric, electronic, gadget |
| `Battery3Icon` | `@mdevs/icons/energy/battery-3` | [battery-3.svg](../../svg/energy/battery-3.svg) | [TSX](../../src/icons/energy/battery-3.tsx) | tabler | energy, power, electricity, battery, charge, hardware, technology, electric, electronic, gadget |
| `Battery4Icon` | `@mdevs/icons/energy/battery-4` | [battery-4.svg](../../svg/energy/battery-4.svg) | [TSX](../../src/icons/energy/battery-4.tsx) | tabler | energy, power, electricity, battery, charge, hardware, technology, electric, electronic, gadget |
| `BatteryAutomotiveIcon` | `@mdevs/icons/energy/battery-automotive` | [battery-automotive.svg](../../svg/energy/battery-automotive.svg) | [TSX](../../src/icons/energy/battery-automotive.tsx) | tabler | vehicle, charge, motor, current, car, electricity, electric, power, battery, automotive |
| `BatteryChargingIcon` | `@mdevs/icons/energy/battery-charging` | [battery-charging.svg](../../svg/energy/battery-charging.svg) | [TSX](../../src/icons/energy/battery-charging.tsx) | lucide | power, electricity, energy, accumulator, charge |
| `BatteryCharging2Icon` | `@mdevs/icons/energy/battery-charging-2` | [battery-charging-2.svg](../../svg/energy/battery-charging-2.svg) | [TSX](../../src/icons/energy/battery-charging-2.tsx) | tabler | charge, energy, power, electricity, battery, charging, hardware, technology, electric, electronic |
| `BatteryEcoIcon` | `@mdevs/icons/energy/battery-eco` | [battery-eco.svg](../../svg/energy/battery-eco.svg) | [TSX](../../src/icons/energy/battery-eco.tsx) | tabler | ecology, charge, energy, power, electricity, battery, eco, hardware, technology, electric |
| `BatteryExclamationIcon` | `@mdevs/icons/energy/battery-exclamation` | [battery-exclamation.svg](../../svg/energy/battery-exclamation.svg) | [TSX](../../src/icons/energy/battery-exclamation.tsx) | tabler | energy, power, electricity, battery, exclamation, charge, hardware, technology, electric, alert |
| `BatteryFullIcon` | `@mdevs/icons/energy/battery-full` | [battery-full.svg](../../svg/energy/battery-full.svg) | [TSX](../../src/icons/energy/battery-full.tsx) | lucide | power, electricity, energy, accumulator, charge |
| `BatteryLowIcon` | `@mdevs/icons/energy/battery-low` | [battery-low.svg](../../svg/energy/battery-low.svg) | [TSX](../../src/icons/energy/battery-low.tsx) | lucide | power, electricity, energy, accumulator, charge |
| `BatteryMediumIcon` | `@mdevs/icons/energy/battery-medium` | [battery-medium.svg](../../svg/energy/battery-medium.svg) | [TSX](../../src/icons/energy/battery-medium.tsx) | lucide | power, electricity, energy, accumulator, charge |
| `BatteryPlusIcon` | `@mdevs/icons/energy/battery-plus` | [battery-plus.svg](../../svg/energy/battery-plus.svg) | [TSX](../../src/icons/energy/battery-plus.tsx) | lucide | power, electricity, energy, accumulator, charge, plus, economy, health, add, new, maximum, upgrade, extra, + |
| `BatteryWarningIcon` | `@mdevs/icons/energy/battery-warning` | [battery-warning.svg](../../svg/energy/battery-warning.svg) | [TSX](../../src/icons/energy/battery-warning.tsx) | lucide | power, electricity, energy, accumulator, charge, exclamation mark |
| `FlameIcon` | `@mdevs/icons/energy/flame` | [flame.svg](../../svg/energy/flame.svg) | [TSX](../../src/icons/energy/flame.tsx) | lucide | heat, burn, light, glow, ignite, passion, ember, fire, lit, burning, spark, embers, smoke, firefighter, fireman, department, brigade, station, emergency |
| `FlameKindlingIcon` | `@mdevs/icons/energy/flame-kindling` | [flame-kindling.svg](../../svg/energy/flame-kindling.svg) | [TSX](../../src/icons/energy/flame-kindling.tsx) | lucide | campfire, camping, wilderness, outdoors, lit, warmth, wood, twigs, sticks |
| `FlameOffIcon` | `@mdevs/icons/energy/flame-off` | [flame-off.svg](../../svg/energy/flame-off.svg) | [TSX](../../src/icons/energy/flame-off.tsx) | tabler | fire, fireplace, light, burn, bonfire, smoke, barbecue, flame, off, disabled |
| `FuelIcon` | `@mdevs/icons/energy/fuel` | [fuel.svg](../../svg/energy/fuel.svg) | [TSX](../../src/icons/energy/fuel.tsx) | lucide | filling-station, gas, petrol, tank |
| `PlugIcon` | `@mdevs/icons/energy/plug` | [plug.svg](../../svg/energy/plug.svg) | [TSX](../../src/icons/energy/plug.tsx) | lucide | electricity, energy, electronics, socket, outlet, power, voltage, current, charger |
| `Plug2Icon` | `@mdevs/icons/energy/plug-2` | [plug-2.svg](../../svg/energy/plug-2.svg) | [TSX](../../src/icons/energy/plug-2.tsx) | lucide | electricity, energy, socket, outlet |
| `PlugZap2Icon` | `@mdevs/icons/energy/plug-zap-2` | [plug-zap-2.svg](../../svg/energy/plug-zap-2.svg) | [TSX](../../src/icons/energy/plug-zap-2.tsx) | lucide | — |
| `PowerIcon` | `@mdevs/icons/energy/power` | [power.svg](../../svg/energy/power.svg) | [TSX](../../src/icons/energy/power.tsx) | lucide | on, off, device, switch, toggle, binary, boolean, reboot, restart, button, keyboard, troubleshoot |
| `PowerOffIcon` | `@mdevs/icons/energy/power-off` | [power-off.svg](../../svg/energy/power-off.svg) | [TSX](../../src/icons/energy/power-off.tsx) | lucide | on, off, device, switch |
| `PowerSquareIcon` | `@mdevs/icons/energy/power-square` | [power-square.svg](../../svg/energy/power-square.svg) | [TSX](../../src/icons/energy/power-square.tsx) | lucide | — |
| `ZapIcon` | `@mdevs/icons/energy/zap` | [zap.svg](../../svg/energy/zap.svg) | [TSX](../../src/icons/energy/zap.tsx) | lucide | flash, camera, lightning, electricity, energy, power, quick |
| `ZapOffIcon` | `@mdevs/icons/energy/zap-off` | [zap-off.svg](../../svg/energy/zap-off.svg) | [TSX](../../src/icons/energy/zap-off.tsx) | lucide | flash, camera, lightning, electricity, energy, power |

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
