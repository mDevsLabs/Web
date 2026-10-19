# Nature — icônes

29 icônes de la catégorie `nature`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (26), tabler (3). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {EarthIcon} from '@mdevs/icons';
// Alternatives :
import {EarthIcon} from '@mdevs/icons/nature';
import {EarthIcon} from '@mdevs/icons/nature/earth';
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
import {EarthIcon} from '@mdevs/icons/nature/earth';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><EarthIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <EarthIcon size={32} title="Nature" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `EarthIcon` | `@mdevs/icons/nature/earth` | [earth.svg](../../svg/nature/earth.svg) | [TSX](../../src/icons/nature/earth.tsx) | lucide | world, browser, language, translate, globe |
| `EarthLockIcon` | `@mdevs/icons/nature/earth-lock` | [earth-lock.svg](../../svg/nature/earth-lock.svg) | [TSX](../../src/icons/nature/earth-lock.tsx) | lucide | vpn, private, privacy, network, world, browser, security, encryption, protection, connection |
| `FlowerIcon` | `@mdevs/icons/nature/flower` | [flower.svg](../../svg/nature/flower.svg) | [TSX](../../src/icons/nature/flower.tsx) | lucide | sustainability, nature, plant, spring |
| `Flower2Icon` | `@mdevs/icons/nature/flower-2` | [flower-2.svg](../../svg/nature/flower-2.svg) | [TSX](../../src/icons/nature/flower-2.tsx) | lucide | sustainability, nature, plant |
| `FlowerOffIcon` | `@mdevs/icons/nature/flower-off` | [flower-off.svg](../../svg/nature/flower-off.svg) | [TSX](../../src/icons/nature/flower-off.tsx) | tabler | plant, garden, rose, lotus, flower, off, environment, natural, disabled, inactive |
| `GlobeIcon` | `@mdevs/icons/nature/globe` | [globe.svg](../../svg/nature/globe.svg) | [TSX](../../src/icons/nature/globe.tsx) | lucide | world, browser, language, translate |
| `GlobeCheckIcon` | `@mdevs/icons/nature/globe-check` | [globe-check.svg](../../svg/nature/globe-check.svg) | [TSX](../../src/icons/nature/globe-check.tsx) | lucide | world, browser, language, translate, internet, web, check, verified, success, valid, available, online, status |
| `GlobeCodeIcon` | `@mdevs/icons/nature/globe-code` | [globe-code.svg](../../svg/nature/globe-code.svg) | [TSX](../../src/icons/nature/globe-code.tsx) | lucide | website, internet, globe, connection, network, digital, access, global, link, world, browser, language, translate |
| `GlobeLockIcon` | `@mdevs/icons/nature/globe-lock` | [globe-lock.svg](../../svg/nature/globe-lock.svg) | [TSX](../../src/icons/nature/globe-lock.tsx) | lucide | vpn, private, privacy, network, world, browser, security, encryption, protection, connection |
| `GlobeOffIcon` | `@mdevs/icons/nature/globe-off` | [globe-off.svg](../../svg/nature/globe-off.svg) | [TSX](../../src/icons/nature/globe-off.tsx) | lucide | globe, earth, planet, disable, mute, off, hide, avoid, world, browser, language, translate, internet, offline, disconnected, network, connection, no connection, network failure, signal off |
| `GlobeXIcon` | `@mdevs/icons/nature/globe-x` | [globe-x.svg](../../svg/nature/globe-x.svg) | [TSX](../../src/icons/nature/globe-x.tsx) | lucide | globe, internet, offline, disconnected, network, connection, world, no connection, network failure, signal off |
| `LeafIcon` | `@mdevs/icons/nature/leaf` | [leaf.svg](../../svg/nature/leaf.svg) | [TSX](../../src/icons/nature/leaf.tsx) | lucide | sustainability, nature, energy, plant, autumn |
| `Leaf2Icon` | `@mdevs/icons/nature/leaf-2` | [leaf-2.svg](../../svg/nature/leaf-2.svg) | [TSX](../../src/icons/nature/leaf-2.tsx) | tabler | nature, plant, green, botany, foliage, tree, garden, growth, leaflet, botanical |
| `LeafMapleIcon` | `@mdevs/icons/nature/leaf-maple` | [leaf-maple.svg](../../svg/nature/leaf-maple.svg) | [TSX](../../src/icons/nature/leaf-maple.tsx) | tabler | maple, leaf, autumn, fall, canada, tree, nature, forest, foliage, botany |
| `MoonIcon` | `@mdevs/icons/nature/moon` | [moon.svg](../../svg/nature/moon.svg) | [TSX](../../src/icons/nature/moon.tsx) | lucide | dark, night |
| `MoonStarIcon` | `@mdevs/icons/nature/moon-star` | [moon-star.svg](../../svg/nature/moon-star.svg) | [TSX](../../src/icons/nature/moon-star.tsx) | lucide | dark, night, star |
| `MountainIcon` | `@mdevs/icons/nature/mountain` | [mountain.svg](../../svg/nature/mountain.svg) | [TSX](../../src/icons/nature/mountain.tsx) | lucide | climb, hike, rock |
| `MountainSnowIcon` | `@mdevs/icons/nature/mountain-snow` | [mountain-snow.svg](../../svg/nature/mountain-snow.svg) | [TSX](../../src/icons/nature/mountain-snow.tsx) | lucide | alpine, climb, snow |
| `SproutIcon` | `@mdevs/icons/nature/sprout` | [sprout.svg](../../svg/nature/sprout.svg) | [TSX](../../src/icons/nature/sprout.tsx) | lucide | eco, green, growth, leaf, nature, plant, seed, spring, sustainability |
| `SunIcon` | `@mdevs/icons/nature/sun` | [sun.svg](../../svg/nature/sun.svg) | [TSX](../../src/icons/nature/sun.tsx) | lucide | brightness, weather, light, summer |
| `SunDimIcon` | `@mdevs/icons/nature/sun-dim` | [sun-dim.svg](../../svg/nature/sun-dim.svg) | [TSX](../../src/icons/nature/sun-dim.tsx) | lucide | brightness, dim, low, brightness low |
| `SunMediumIcon` | `@mdevs/icons/nature/sun-medium` | [sun-medium.svg](../../svg/nature/sun-medium.svg) | [TSX](../../src/icons/nature/sun-medium.tsx) | lucide | brightness, medium |
| `SunMoonIcon` | `@mdevs/icons/nature/sun-moon` | [sun-moon.svg](../../svg/nature/sun-moon.svg) | [TSX](../../src/icons/nature/sun-moon.tsx) | lucide | dark, light, moon, sun, brightness, theme, auto theme, system theme, appearance |
| `SunSnowIcon` | `@mdevs/icons/nature/sun-snow` | [sun-snow.svg](../../svg/nature/sun-snow.svg) | [TSX](../../src/icons/nature/sun-snow.tsx) | lucide | weather, air conditioning, temperature, hot, cold, seasons |
| `TreeDeciduousIcon` | `@mdevs/icons/nature/tree-deciduous` | [tree-deciduous.svg](../../svg/nature/tree-deciduous.svg) | [TSX](../../src/icons/nature/tree-deciduous.tsx) | lucide | tree, forest, park, nature |
| `TreePineIcon` | `@mdevs/icons/nature/tree-pine` | [tree-pine.svg](../../svg/nature/tree-pine.svg) | [TSX](../../src/icons/nature/tree-pine.tsx) | lucide | tree, pine, forest, park, nature |
| `WindIcon` | `@mdevs/icons/nature/wind` | [wind.svg](../../svg/nature/wind.svg) | [TSX](../../src/icons/nature/wind.tsx) | lucide | weather, air, blow |
| `WindArrowDownIcon` | `@mdevs/icons/nature/wind-arrow-down` | [wind-arrow-down.svg](../../svg/nature/wind-arrow-down.svg) | [TSX](../../src/icons/nature/wind-arrow-down.tsx) | lucide | weather, air, pressure, blow |
| `WindArrowUpIcon` | `@mdevs/icons/nature/wind-arrow-up` | [wind-arrow-up.svg](../../svg/nature/wind-arrow-up.svg) | [TSX](../../src/icons/nature/wind-arrow-up.tsx) | lucide | weather, air, pressure, blow, gust, windy, sort, increase |

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
