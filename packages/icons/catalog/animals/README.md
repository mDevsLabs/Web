# Animaux — icônes

17 icônes de la catégorie `animals`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : tabler (7), lucide (10). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {BatIcon} from '@mdevs/icons';
// Alternatives :
import {BatIcon} from '@mdevs/icons/animals';
import {BatIcon} from '@mdevs/icons/animals/bat';
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
import {BatIcon} from '@mdevs/icons/animals/bat';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><BatIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <BatIcon size={32} title="Animaux" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `BatIcon` | `@mdevs/icons/animals/bat` | [bat.svg](../../svg/animals/bat.svg) | [TSX](../../src/icons/animals/bat.tsx) | tabler | animal, halloween, vampire, scary, blood, bat, creature, wildlife, nature, living |
| `BirdIcon` | `@mdevs/icons/animals/bird` | [bird.svg](../../svg/animals/bird.svg) | [TSX](../../src/icons/animals/bird.tsx) | lucide | peace, freedom, wing, avian, tweet |
| `CatIcon` | `@mdevs/icons/animals/cat` | [cat.svg](../../svg/animals/cat.svg) | [TSX](../../src/icons/animals/cat.tsx) | lucide | animal, pet, kitten, feline |
| `DogIcon` | `@mdevs/icons/animals/dog` | [dog.svg](../../svg/animals/dog.svg) | [TSX](../../src/icons/animals/dog.tsx) | lucide | animal, pet, puppy, hound, canine |
| `FishIcon` | `@mdevs/icons/animals/fish` | [fish.svg](../../svg/animals/fish.svg) | [TSX](../../src/icons/animals/fish.tsx) | lucide | dish, restaurant, course, meal, seafood, pet, sea, marine |
| `FishBoneIcon` | `@mdevs/icons/animals/fish-bone` | [fish-bone.svg](../../svg/animals/fish-bone.svg) | [TSX](../../src/icons/animals/fish-bone.tsx) | tabler | food, skeleton, cat, sea, fish, bone, creature, wildlife, nature, living |
| `FishChristianityIcon` | `@mdevs/icons/animals/fish-christianity` | [fish-christianity.svg](../../svg/animals/fish-christianity.svg) | [TSX](../../src/icons/animals/fish-christianity.tsx) | tabler | religion, jesus, faith, christian, fish, christianity, sign, mark, emblem, representation |
| `FishHookIcon` | `@mdevs/icons/animals/fish-hook` | [fish-hook.svg](../../svg/animals/fish-hook.svg) | [TSX](../../src/icons/animals/fish-hook.tsx) | tabler | fishing, bait, hanging, catch, water, fish, hook |
| `FishHookOffIcon` | `@mdevs/icons/animals/fish-hook-off` | [fish-hook-off.svg](../../svg/animals/fish-hook-off.svg) | [TSX](../../src/icons/animals/fish-hook-off.tsx) | tabler | fishing, bait, hanging, catch, water, fish, hook, off, disabled, inactive |
| `FishOffIcon` | `@mdevs/icons/animals/fish-off` | [fish-off.svg](../../svg/animals/fish-off.svg) | [TSX](../../src/icons/animals/fish-off.tsx) | lucide | food, dish, restaurant, course, meal, seafood, animal, pet, sea, marine, allergy, intolerance, diet |
| `FishSymbolIcon` | `@mdevs/icons/animals/fish-symbol` | [fish-symbol.svg](../../svg/animals/fish-symbol.svg) | [TSX](../../src/icons/animals/fish-symbol.tsx) | lucide | dish, restaurant, course, meal, seafood, pet, sea, marine |
| `PawIcon` | `@mdevs/icons/animals/paw` | [paw.svg](../../svg/animals/paw.svg) | [TSX](../../src/icons/animals/paw.tsx) | tabler | animal, dog, cat, foot, pets, paw |
| `PawOffIcon` | `@mdevs/icons/animals/paw-off` | [paw-off.svg](../../svg/animals/paw-off.svg) | [TSX](../../src/icons/animals/paw-off.tsx) | tabler | animal, dog, cat, foot, pets, paw, off, disabled, inactive |
| `PawPrintIcon` | `@mdevs/icons/animals/paw-print` | [paw-print.svg](../../svg/animals/paw-print.svg) | [TSX](../../src/icons/animals/paw-print.tsx) | lucide | pets, vets, veterinarian, domesticated, cat, dog, bear |
| `RabbitIcon` | `@mdevs/icons/animals/rabbit` | [rabbit.svg](../../svg/animals/rabbit.svg) | [TSX](../../src/icons/animals/rabbit.tsx) | lucide | animal, rodent, pet, pest, bunny, hare, fast, speed, hop |
| `SquirrelIcon` | `@mdevs/icons/animals/squirrel` | [squirrel.svg](../../svg/animals/squirrel.svg) | [TSX](../../src/icons/animals/squirrel.tsx) | lucide | animal, rodent, pet, pest, nuts, retrieve, updates, storage, stash |
| `TurtleIcon` | `@mdevs/icons/animals/turtle` | [turtle.svg](../../svg/animals/turtle.svg) | [TSX](../../src/icons/animals/turtle.tsx) | lucide | animal, pet, tortoise, slow, speed |

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
