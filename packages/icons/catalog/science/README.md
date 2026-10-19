# Sciences — icônes

17 icônes de la catégorie `science`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (13), tabler (4). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {AtomIcon} from '@mdevs/icons';
// Alternatives :
import {AtomIcon} from '@mdevs/icons/science';
import {AtomIcon} from '@mdevs/icons/science/atom';
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
import {AtomIcon} from '@mdevs/icons/science/atom';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><AtomIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <AtomIcon size={32} title="Sciences" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `AtomIcon` | `@mdevs/icons/science/atom` | [atom.svg](../../svg/science/atom.svg) | [TSX](../../src/icons/science/atom.tsx) | lucide | atomic, nuclear, physics, particle, element, molecule, electricity, energy, chemistry |
| `Atom2Icon` | `@mdevs/icons/science/atom-2` | [atom-2.svg](../../svg/science/atom-2.svg) | [TSX](../../src/icons/science/atom-2.tsx) | tabler | unit, part, electrons, protons, neutrons, atom, 2, particle, molecule, science |
| `AtomOffIcon` | `@mdevs/icons/science/atom-off` | [atom-off.svg](../../svg/science/atom-off.svg) | [TSX](../../src/icons/science/atom-off.tsx) | tabler | unit, part, electrons, atom, off, disabled, inactive, particle, molecule, science |
| `BeakerIcon` | `@mdevs/icons/science/beaker` | [beaker.svg](../../svg/science/beaker.svg) | [TSX](../../src/icons/science/beaker.tsx) | lucide | cup, lab, chemistry, experiment, test |
| `DnaIcon` | `@mdevs/icons/science/dna` | [dna.svg](../../svg/science/dna.svg) | [TSX](../../src/icons/science/dna.tsx) | lucide | gene, gmo, helix, heredity, chromosome, nucleic acid |
| `Dna2Icon` | `@mdevs/icons/science/dna-2` | [dna-2.svg](../../svg/science/dna-2.svg) | [TSX](../../src/icons/science/dna-2.tsx) | tabler | genetics, biology, chain, genetic, code, virus, organism, dna, medical, wellness |
| `Dna2OffIcon` | `@mdevs/icons/science/dna-2-off` | [dna-2-off.svg](../../svg/science/dna-2-off.svg) | [TSX](../../src/icons/science/dna-2-off.tsx) | tabler | genetics, biology, chain, genetic, code, virus, organism, dna, off, medical |
| `DnaOffIcon` | `@mdevs/icons/science/dna-off` | [dna-off.svg](../../svg/science/dna-off.svg) | [TSX](../../src/icons/science/dna-off.tsx) | lucide | gene, gmo free, helix, heredity, chromosome, nucleic acid |
| `FlaskConicalIcon` | `@mdevs/icons/science/flask-conical` | [flask-conical.svg](../../svg/science/flask-conical.svg) | [TSX](../../src/icons/science/flask-conical.tsx) | lucide | beaker, erlenmeyer, lab, chemistry, experiment, test |
| `FlaskConicalOffIcon` | `@mdevs/icons/science/flask-conical-off` | [flask-conical-off.svg](../../svg/science/flask-conical-off.svg) | [TSX](../../src/icons/science/flask-conical-off.tsx) | lucide | beaker, erlenmeyer, non toxic, lab, chemistry, experiment, test |
| `FlaskRoundIcon` | `@mdevs/icons/science/flask-round` | [flask-round.svg](../../svg/science/flask-round.svg) | [TSX](../../src/icons/science/flask-round.tsx) | lucide | beaker, lab, chemistry, experiment, test |
| `MagnetIcon` | `@mdevs/icons/science/magnet` | [magnet.svg](../../svg/science/magnet.svg) | [TSX](../../src/icons/science/magnet.tsx) | lucide | horseshoe, lock, science, snap |
| `MicroscopeIcon` | `@mdevs/icons/science/microscope` | [microscope.svg](../../svg/science/microscope.svg) | [TSX](../../src/icons/science/microscope.tsx) | lucide | medical, education, science, imaging, research |
| `OrbitIcon` | `@mdevs/icons/science/orbit` | [orbit.svg](../../svg/science/orbit.svg) | [TSX](../../src/icons/science/orbit.tsx) | lucide | planet, space, physics, satellites, moons |
| `TelescopeIcon` | `@mdevs/icons/science/telescope` | [telescope.svg](../../svg/science/telescope.svg) | [TSX](../../src/icons/science/telescope.tsx) | lucide | astronomy, space, discovery, exploration, explore, vision, perspective, focus, stargazing, observe, view |
| `TestTubeIcon` | `@mdevs/icons/science/test-tube` | [test-tube.svg](../../svg/science/test-tube.svg) | [TSX](../../src/icons/science/test-tube.tsx) | lucide | tube, vial, phial, flask, ampoule, ampule, lab, chemistry, experiment, test |
| `TestTube2Icon` | `@mdevs/icons/science/test-tube-2` | [test-tube-2.svg](../../svg/science/test-tube-2.svg) | [TSX](../../src/icons/science/test-tube-2.tsx) | lucide | — |

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
