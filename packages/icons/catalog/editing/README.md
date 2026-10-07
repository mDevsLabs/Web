# Édition — icônes

19 icônes de la catégorie `editing`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (19). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {BrushIcon} from '@mdevs/icons';
// Alternatives :
import {BrushIcon} from '@mdevs/icons/editing';
import {BrushIcon} from '@mdevs/icons/editing/brush';
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
import {BrushIcon} from '@mdevs/icons/editing/brush';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><BrushIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <BrushIcon size={32} title="Édition" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `BrushIcon` | `@mdevs/icons/editing/brush` | [brush.svg](../../svg/editing/brush.svg) | [TSX](../../src/icons/editing/brush.tsx) | lucide | clean, sweep, refactor, remove, draw, paint, color, artist |
| `BrushCleaningIcon` | `@mdevs/icons/editing/brush-cleaning` | [brush-cleaning.svg](../../svg/editing/brush-cleaning.svg) | [TSX](../../src/icons/editing/brush-cleaning.tsx) | lucide | cleaning, utensil, housekeeping, tool, sweeping, scrubbing, hygiene, maintenance, household, cleaner, chores, equipment, sanitation, bristles, handle, home care, sanitize, purify, wash, disinfect, sterilize, scrub, polish, decontaminate, wipe, spotless, remove, empty, erase, purge, eliminate |
| `CropIcon` | `@mdevs/icons/editing/crop` | [crop.svg](../../svg/editing/crop.svg) | [TSX](../../src/icons/editing/crop.tsx) | lucide | photo, image |
| `EraserIcon` | `@mdevs/icons/editing/eraser` | [eraser.svg](../../svg/editing/eraser.svg) | [TSX](../../src/icons/editing/eraser.tsx) | lucide | pencil, drawing, undo, delete, clear, trash, remove |
| `HighlighterIcon` | `@mdevs/icons/editing/highlighter` | [highlighter.svg](../../svg/editing/highlighter.svg) | [TSX](../../src/icons/editing/highlighter.tsx) | lucide | mark, text |
| `PaintBucketIcon` | `@mdevs/icons/editing/paint-bucket` | [paint-bucket.svg](../../svg/editing/paint-bucket.svg) | [TSX](../../src/icons/editing/paint-bucket.tsx) | lucide | fill, paint, bucket, color, colour |
| `PaintRollerIcon` | `@mdevs/icons/editing/paint-roller` | [paint-roller.svg](../../svg/editing/paint-roller.svg) | [TSX](../../src/icons/editing/paint-roller.tsx) | lucide | brush, color, colour, decoration, diy |
| `PaletteIcon` | `@mdevs/icons/editing/palette` | [palette.svg](../../svg/editing/palette.svg) | [TSX](../../src/icons/editing/palette.tsx) | lucide | colors, colours, theme, scheme, paint, watercolor, watercolour, artist |
| `PenOffIcon` | `@mdevs/icons/editing/pen-off` | [pen-off.svg](../../svg/editing/pen-off.svg) | [TSX](../../src/icons/editing/pen-off.tsx) | lucide | disabled, inactive, non-editable, locked, read-only, unmodifiable, frozen, restricted, pencil, change, create, draw, writer, writing, biro, ink, marker, felt tip, stationery, artist |
| `PenToolIcon` | `@mdevs/icons/editing/pen-tool` | [pen-tool.svg](../../svg/editing/pen-tool.svg) | [TSX](../../src/icons/editing/pen-tool.tsx) | lucide | vector, drawing, path |
| `PencilIcon` | `@mdevs/icons/editing/pencil` | [pencil.svg](../../svg/editing/pencil.svg) | [TSX](../../src/icons/editing/pencil.tsx) | lucide | rubber, edit, create, draw, sketch, draft, writer, writing, stationery, artist |
| `PencilLineIcon` | `@mdevs/icons/editing/pencil-line` | [pencil-line.svg](../../svg/editing/pencil-line.svg) | [TSX](../../src/icons/editing/pencil-line.tsx) | lucide | pencil, change, create, draw, sketch, draft, writer, writing, biro, ink, marker, felt tip, stationery, artist |
| `PencilOffIcon` | `@mdevs/icons/editing/pencil-off` | [pencil-off.svg](../../svg/editing/pencil-off.svg) | [TSX](../../src/icons/editing/pencil-off.tsx) | lucide | disabled, inactive, non-editable, locked, read-only, unmodifiable, frozen, restricted, rubber, edit, create, draw, sketch, draft, writer, writing, stationery, artist |
| `PencilRulerIcon` | `@mdevs/icons/editing/pencil-ruler` | [pencil-ruler.svg](../../svg/editing/pencil-ruler.svg) | [TSX](../../src/icons/editing/pencil-ruler.tsx) | lucide | edit, create, draw, sketch, draft, writer, writing, stationery, artist, measurements, centimeters, cm, millimeters, mm, metre, foot, feet, inches, units, size, length, width, height, dimensions, depth, breadth, extent |
| `PencilSparklesIcon` | `@mdevs/icons/editing/pencil-sparkles` | [pencil-sparkles.svg](../../svg/editing/pencil-sparkles.svg) | [TSX](../../src/icons/editing/pencil-sparkles.tsx) | lucide | edit, ai, tools, smart, create, draw, sketch, draft, writer, writing, stationery, artist, magic, wizard, magician |
| `RulerIcon` | `@mdevs/icons/editing/ruler` | [ruler.svg](../../svg/editing/ruler.svg) | [TSX](../../src/icons/editing/ruler.tsx) | lucide | measurements, centimeters, cm, millimeters, mm, metre, foot, feet, inches, units, size, length, width, height, dimensions, depth, breadth, extent, stationery |
| `RulerDimensionLineIcon` | `@mdevs/icons/editing/ruler-dimension-line` | [ruler-dimension-line.svg](../../svg/editing/ruler-dimension-line.svg) | [TSX](../../src/icons/editing/ruler-dimension-line.tsx) | lucide | measurements, centimeters, cm, millimeters, mm, metre, foot, feet, inches, units, size, length, width, height, dimensions, depth, breadth, extent, stationery |
| `WandIcon` | `@mdevs/icons/editing/wand` | [wand.svg](../../svg/editing/wand.svg) | [TSX](../../src/icons/editing/wand.tsx) | lucide | magic, selection |
| `Wand2Icon` | `@mdevs/icons/editing/wand-2` | [wand-2.svg](../../svg/editing/wand-2.svg) | [TSX](../../src/icons/editing/wand-2.tsx) | lucide | — |

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
