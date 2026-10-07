# Outils — icônes

12 icônes de la catégorie `tools`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (11), tabler (1). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {AnvilIcon} from '@mdevs/icons';
// Alternatives :
import {AnvilIcon} from '@mdevs/icons/tools';
import {AnvilIcon} from '@mdevs/icons/tools/anvil';
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
import {AnvilIcon} from '@mdevs/icons/tools/anvil';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><AnvilIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <AnvilIcon size={32} title="Outils" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `AnvilIcon` | `@mdevs/icons/tools/anvil` | [anvil.svg](../../svg/tools/anvil.svg) | [TSX](../../src/icons/tools/anvil.tsx) | lucide | metal, iron, alloy, materials, heavy, weight, blacksmith, forge, acme |
| `BoltIcon` | `@mdevs/icons/tools/bolt` | [bolt.svg](../../svg/tools/bolt.svg) | [TSX](../../src/icons/tools/bolt.tsx) | lucide | nut, screw, settings, preferences, configuration, controls, edit, diy, fixed, build, construction, parts |
| `BoltOffIcon` | `@mdevs/icons/tools/bolt-off` | [bolt-off.svg](../../svg/tools/bolt-off.svg) | [TSX](../../src/icons/tools/bolt-off.tsx) | tabler | energy, power, electricity, storm, lightning, flash, bolt, off, disabled, inactive |
| `CogIcon` | `@mdevs/icons/tools/cog` | [cog.svg](../../svg/tools/cog.svg) | [TSX](../../src/icons/tools/cog.tsx) | lucide | computing, settings, cog, edit, gear, preferences, controls, configuration, fixed, build, construction, parts |
| `DrillIcon` | `@mdevs/icons/tools/drill` | [drill.svg](../../svg/tools/drill.svg) | [TSX](../../src/icons/tools/drill.tsx) | lucide | power, bit, head, hole, diy, toolbox, build, construction |
| `HammerIcon` | `@mdevs/icons/tools/hammer` | [hammer.svg](../../svg/tools/hammer.svg) | [TSX](../../src/icons/tools/hammer.tsx) | lucide | mallet, nails, diy, toolbox, build, construction |
| `NutIcon` | `@mdevs/icons/tools/nut` | [nut.svg](../../svg/tools/nut.svg) | [TSX](../../src/icons/tools/nut.tsx) | lucide | hazelnut, acorn, food, diet |
| `NutOffIcon` | `@mdevs/icons/tools/nut-off` | [nut-off.svg](../../svg/tools/nut-off.svg) | [TSX](../../src/icons/tools/nut-off.tsx) | lucide | hazelnut, acorn, food, allergy, intolerance, diet |
| `PickaxeIcon` | `@mdevs/icons/tools/pickaxe` | [pickaxe.svg](../../svg/tools/pickaxe.svg) | [TSX](../../src/icons/tools/pickaxe.tsx) | lucide | mining, mine, land worker, extraction, labor, construction, progress, advancement, crafting, building, creation |
| `ToolCaseIcon` | `@mdevs/icons/tools/tool-case` | [tool-case.svg](../../svg/tools/tool-case.svg) | [TSX](../../src/icons/tools/tool-case.tsx) | lucide | tools, maintenance, repair |
| `WrenchIcon` | `@mdevs/icons/tools/wrench` | [wrench.svg](../../svg/tools/wrench.svg) | [TSX](../../src/icons/tools/wrench.tsx) | lucide | account, settings, spanner, diy, toolbox, build, construction |
| `WrenchOffIcon` | `@mdevs/icons/tools/wrench-off` | [wrench-off.svg](../../svg/tools/wrench-off.svg) | [TSX](../../src/icons/tools/wrench-off.tsx) | lucide | account, settings, spanner, diy, toolbox, build, construction, off, service, maintenance, disabled |

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
