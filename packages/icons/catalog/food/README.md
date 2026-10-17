# Alimentation — icônes

35 icônes de la catégorie `food`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (29), tabler (6). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {AppleIcon} from '@mdevs/icons';
// Alternatives :
import {AppleIcon} from '@mdevs/icons/food';
import {AppleIcon} from '@mdevs/icons/food/apple';
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
import {AppleIcon} from '@mdevs/icons/food/apple';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><AppleIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <AppleIcon size={32} title="Alimentation" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `AppleIcon` | `@mdevs/icons/food/apple` | [apple.svg](../../svg/food/apple.svg) | [TSX](../../src/icons/food/apple.tsx) | lucide | fruit, food, healthy, snack, nutrition, fresh, produce, grocery, organic, harvest, vitamin, red, green, juicy, sweet, tart, bite, orchard, plant, core, raw, diet |
| `BananaIcon` | `@mdevs/icons/food/banana` | [banana.svg](../../svg/food/banana.svg) | [TSX](../../src/icons/food/banana.tsx) | lucide | fruit, food |
| `BeefIcon` | `@mdevs/icons/food/beef` | [beef.svg](../../svg/food/beef.svg) | [TSX](../../src/icons/food/beef.tsx) | lucide | food, dish, restaurant, course, meal, meat, bbq, steak |
| `BeefOffIcon` | `@mdevs/icons/food/beef-off` | [beef-off.svg](../../svg/food/beef-off.svg) | [TSX](../../src/icons/food/beef-off.tsx) | lucide | food, dish, restaurant, course, meal, meat, bbq, steak, vegetarian |
| `BeerIcon` | `@mdevs/icons/food/beer` | [beer.svg](../../svg/food/beer.svg) | [TSX](../../src/icons/food/beer.tsx) | lucide | alcohol, bar, beverage, brewery, drink |
| `BeerOffIcon` | `@mdevs/icons/food/beer-off` | [beer-off.svg](../../svg/food/beer-off.svg) | [TSX](../../src/icons/food/beer-off.tsx) | lucide | alcohol, bar, beverage, brewery, drink |
| `BottleIcon` | `@mdevs/icons/food/bottle` | [bottle.svg](../../svg/food/bottle.svg) | [TSX](../../src/icons/food/bottle.tsx) | tabler | water, drink, beer, energy, wine, bottle, meal, cuisine, eating, nutrition |
| `BottleOffIcon` | `@mdevs/icons/food/bottle-off` | [bottle-off.svg](../../svg/food/bottle-off.svg) | [TSX](../../src/icons/food/bottle-off.tsx) | tabler | water, drink, beer, energy, wine, bottle, off, meal, cuisine, disabled |
| `BottleWineIcon` | `@mdevs/icons/food/bottle-wine` | [bottle-wine.svg](../../svg/food/bottle-wine.svg) | [TSX](../../src/icons/food/bottle-wine.tsx) | lucide | alcohol, drink, glass, goblet, chalice, vineyard, winery, red, white, rose, dry, sparkling, bar, party, nightclub, nightlife, sommelier, restaurant, dinner, meal |
| `CakeIcon` | `@mdevs/icons/food/cake` | [cake.svg](../../svg/food/cake.svg) | [TSX](../../src/icons/food/cake.tsx) | lucide | birthday, birthdate, celebration, party, surprise, gateaux, dessert, fondant, icing sugar, sweet, baking |
| `CakeOffIcon` | `@mdevs/icons/food/cake-off` | [cake-off.svg](../../svg/food/cake-off.svg) | [TSX](../../src/icons/food/cake-off.tsx) | tabler | baking, birthday, party, chocolate, sweet, cake, off, meal, cuisine, disabled |
| `CakeRollIcon` | `@mdevs/icons/food/cake-roll` | [cake-roll.svg](../../svg/food/cake-roll.svg) | [TSX](../../src/icons/food/cake-roll.tsx) | tabler | dessert, pastry, roll, sweet, delicacy, treat, bake, confection, culinary, indulgence |
| `CakeSliceIcon` | `@mdevs/icons/food/cake-slice` | [cake-slice.svg](../../svg/food/cake-slice.svg) | [TSX](../../src/icons/food/cake-slice.tsx) | lucide | birthday, birthdate, celebration, party, surprise, gateaux, dessert, candles, wish, fondant, icing sugar, sweet, baking |
| `CandyIcon` | `@mdevs/icons/food/candy` | [candy.svg](../../svg/food/candy.svg) | [TSX](../../src/icons/food/candy.tsx) | lucide | sugar, food, sweet |
| `CandyCaneIcon` | `@mdevs/icons/food/candy-cane` | [candy-cane.svg](../../svg/food/candy-cane.svg) | [TSX](../../src/icons/food/candy-cane.tsx) | lucide | sugar, food, sweet, christmas, xmas |
| `CandyOffIcon` | `@mdevs/icons/food/candy-off` | [candy-off.svg](../../svg/food/candy-off.svg) | [TSX](../../src/icons/food/candy-off.tsx) | lucide | sugar free, food, sweet, allergy, intolerance, diet |
| `CarrotIcon` | `@mdevs/icons/food/carrot` | [carrot.svg](../../svg/food/carrot.svg) | [TSX](../../src/icons/food/carrot.tsx) | lucide | orange, healthy, nature, fresh, root, produce, organic, nutrition, vegetable, food, eat |
| `CarrotOffIcon` | `@mdevs/icons/food/carrot-off` | [carrot-off.svg](../../svg/food/carrot-off.svg) | [TSX](../../src/icons/food/carrot-off.tsx) | tabler | food, healthy, rabbit, vegetable, carrot, off, meal, cuisine, disabled, inactive |
| `ChefHatIcon` | `@mdevs/icons/food/chef-hat` | [chef-hat.svg](../../svg/food/chef-hat.svg) | [TSX](../../src/icons/food/chef-hat.tsx) | lucide | cooking, food, kitchen, restaurant |
| `ChefHatOffIcon` | `@mdevs/icons/food/chef-hat-off` | [chef-hat-off.svg](../../svg/food/chef-hat-off.svg) | [TSX](../../src/icons/food/chef-hat-off.tsx) | tabler | cooking, kitchen, restaurant, food, job, chef, hat, off, meal, cuisine |
| `CherryIcon` | `@mdevs/icons/food/cherry` | [cherry.svg](../../svg/food/cherry.svg) | [TSX](../../src/icons/food/cherry.tsx) | lucide | fruit, food |
| `CoffeeIcon` | `@mdevs/icons/food/coffee` | [coffee.svg](../../svg/food/coffee.svg) | [TSX](../../src/icons/food/coffee.tsx) | lucide | drink, cup, mug, tea, cafe, hot, beverage |
| `CookieIcon` | `@mdevs/icons/food/cookie` | [cookie.svg](../../svg/food/cookie.svg) | [TSX](../../src/icons/food/cookie.tsx) | lucide | biscuit, snack, dessert, food, sweet, bakery, consent, privacy, legal, tracking, browser, website |
| `CupSodaIcon` | `@mdevs/icons/food/cup-soda` | [cup-soda.svg](../../svg/food/cup-soda.svg) | [TSX](../../src/icons/food/cup-soda.tsx) | lucide | beverage, cup, drink, soda, straw, water |
| `EggIcon` | `@mdevs/icons/food/egg` | [egg.svg](../../svg/food/egg.svg) | [TSX](../../src/icons/food/egg.tsx) | lucide | bird, chicken, nest, hatch, shell, incubate, soft boiled, hard, breakfast, brunch, morning, easter |
| `EggFriedIcon` | `@mdevs/icons/food/egg-fried` | [egg-fried.svg](../../svg/food/egg-fried.svg) | [TSX](../../src/icons/food/egg-fried.tsx) | lucide | food, breakfast |
| `EggOffIcon` | `@mdevs/icons/food/egg-off` | [egg-off.svg](../../svg/food/egg-off.svg) | [TSX](../../src/icons/food/egg-off.tsx) | lucide | egg free, vegan, hatched, bad egg |
| `ForkKnifeIcon` | `@mdevs/icons/food/fork-knife` | [fork-knife.svg](../../svg/food/fork-knife.svg) | [TSX](../../src/icons/food/fork-knife.tsx) | lucide | — |
| `ForkKnifeCrossedIcon` | `@mdevs/icons/food/fork-knife-crossed` | [fork-knife-crossed.svg](../../svg/food/fork-knife-crossed.svg) | [TSX](../../src/icons/food/fork-knife-crossed.tsx) | lucide | — |
| `GrapeIcon` | `@mdevs/icons/food/grape` | [grape.svg](../../svg/food/grape.svg) | [TSX](../../src/icons/food/grape.tsx) | lucide | fruit, wine, food |
| `PizzaIcon` | `@mdevs/icons/food/pizza` | [pizza.svg](../../svg/food/pizza.svg) | [TSX](../../src/icons/food/pizza.tsx) | lucide | pie, quiche, food |
| `SaladIcon` | `@mdevs/icons/food/salad` | [salad.svg](../../svg/food/salad.svg) | [TSX](../../src/icons/food/salad.tsx) | lucide | food, vegetarian, dish, restaurant, course, meal, side, vegetables, health |
| `SoupIcon` | `@mdevs/icons/food/soup` | [soup.svg](../../svg/food/soup.svg) | [TSX](../../src/icons/food/soup.tsx) | lucide | food, dish, restaurant, course, meal, bowl, starter |
| `WineIcon` | `@mdevs/icons/food/wine` | [wine.svg](../../svg/food/wine.svg) | [TSX](../../src/icons/food/wine.tsx) | lucide | alcohol, beverage, bar, drink, glass, sommelier, vineyard, winery |
| `WineOffIcon` | `@mdevs/icons/food/wine-off` | [wine-off.svg](../../svg/food/wine-off.svg) | [TSX](../../src/icons/food/wine-off.tsx) | lucide | alcohol, beverage, drink, glass, alcohol free, abstinence, abstaining, teetotalism, allergy, intolerance |

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
