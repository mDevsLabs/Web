# Objets — icônes

62 icônes de la catégorie `objects`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (40), tabler (22). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {ArmchairIcon} from '@mdevs/icons';
// Alternatives :
import {ArmchairIcon} from '@mdevs/icons/objects';
import {ArmchairIcon} from '@mdevs/icons/objects/armchair';
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
import {ArmchairIcon} from '@mdevs/icons/objects/armchair';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><ArmchairIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <ArmchairIcon size={32} title="Objets" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `ArmchairIcon` | `@mdevs/icons/objects/armchair` | [armchair.svg](../../svg/objects/armchair.svg) | [TSX](../../src/icons/objects/armchair.tsx) | lucide | sofa, furniture, leisure, lounge, loveseat, couch |
| `Armchair2Icon` | `@mdevs/icons/objects/armchair-2` | [armchair-2.svg](../../svg/objects/armchair-2.svg) | [TSX](../../src/icons/objects/armchair-2.tsx) | tabler | seat, chair, sofa, home, furniture, armchair, 2, comfort, relax |
| `Armchair2OffIcon` | `@mdevs/icons/objects/armchair-2-off` | [armchair-2-off.svg](../../svg/objects/armchair-2-off.svg) | [TSX](../../src/icons/objects/armchair-2-off.tsx) | tabler | seat, chair, sofa, home, furniture, armchair, off, disabled, inactive, 2 |
| `ArmchairOffIcon` | `@mdevs/icons/objects/armchair-off` | [armchair-off.svg](../../svg/objects/armchair-off.svg) | [TSX](../../src/icons/objects/armchair-off.tsx) | tabler | seat, chair, sofa, home, furniture, armchair, off, disabled, inactive, comfort |
| `BackpackIcon` | `@mdevs/icons/objects/backpack` | [backpack.svg](../../svg/objects/backpack.svg) | [TSX](../../src/icons/objects/backpack.tsx) | lucide | bag, hiking, travel, camping, school, childhood |
| `BackpackOffIcon` | `@mdevs/icons/objects/backpack-off` | [backpack-off.svg](../../svg/objects/backpack-off.svg) | [TSX](../../src/icons/objects/backpack-off.tsx) | tabler | education, school, learning, adventure, travel, backpack, off, store, purchase, disabled |
| `BathIcon` | `@mdevs/icons/objects/bath` | [bath.svg](../../svg/objects/bath.svg) | [TSX](../../src/icons/objects/bath.tsx) | lucide | amenities, services, bathroom, shower |
| `BathOffIcon` | `@mdevs/icons/objects/bath-off` | [bath-off.svg](../../svg/objects/bath-off.svg) | [TSX](../../src/icons/objects/bath-off.tsx) | tabler | water, clean, hygiene, bathroom, tub, bath, off, disabled, inactive |
| `BedIcon` | `@mdevs/icons/objects/bed` | [bed.svg](../../svg/objects/bed.svg) | [TSX](../../src/icons/objects/bed.tsx) | lucide | sleep, hotel, furniture |
| `BedDoubleIcon` | `@mdevs/icons/objects/bed-double` | [bed-double.svg](../../svg/objects/bed-double.svg) | [TSX](../../src/icons/objects/bed-double.tsx) | lucide | sleep, hotel, furniture |
| `BedFlatIcon` | `@mdevs/icons/objects/bed-flat` | [bed-flat.svg](../../svg/objects/bed-flat.svg) | [TSX](../../src/icons/objects/bed-flat.tsx) | tabler | mattress, sofa, couch, futon, sleeping, restful, horizontal, recline, lying, horizontal-bed |
| `BedOffIcon` | `@mdevs/icons/objects/bed-off` | [bed-off.svg](../../svg/objects/bed-off.svg) | [TSX](../../src/icons/objects/bed-off.tsx) | tabler | furniture, sleeping, comfortable, bedroom, mattress, resting, relax, sleep, futon, cozy |
| `BedSingleIcon` | `@mdevs/icons/objects/bed-single` | [bed-single.svg](../../svg/objects/bed-single.svg) | [TSX](../../src/icons/objects/bed-single.tsx) | lucide | sleep, hotel, furniture |
| `BellIcon` | `@mdevs/icons/objects/bell` | [bell.svg](../../svg/objects/bell.svg) | [TSX](../../src/icons/objects/bell.tsx) | lucide | alarm, notification, sound, reminder |
| `BellCheckIcon` | `@mdevs/icons/objects/bell-check` | [bell-check.svg](../../svg/objects/bell-check.svg) | [TSX](../../src/icons/objects/bell-check.tsx) | lucide | alarm, notification, sound, reminder |
| `BellDotIcon` | `@mdevs/icons/objects/bell-dot` | [bell-dot.svg](../../svg/objects/bell-dot.svg) | [TSX](../../src/icons/objects/bell-dot.tsx) | lucide | alarm, notification, sound, reminder, unread |
| `BellElectricIcon` | `@mdevs/icons/objects/bell-electric` | [bell-electric.svg](../../svg/objects/bell-electric.svg) | [TSX](../../src/icons/objects/bell-electric.tsx) | lucide | fire alarm, flames, smoke, firefighter, fireman, department, brigade, station, emergency, alert, safety, school bell, period break, recess, doorbell, entrance, entry, ring, reception |
| `BellMinusIcon` | `@mdevs/icons/objects/bell-minus` | [bell-minus.svg](../../svg/objects/bell-minus.svg) | [TSX](../../src/icons/objects/bell-minus.tsx) | lucide | alarm, notification, silent, reminder, delete, remove, erase |
| `BellOffIcon` | `@mdevs/icons/objects/bell-off` | [bell-off.svg](../../svg/objects/bell-off.svg) | [TSX](../../src/icons/objects/bell-off.tsx) | lucide | alarm, notification, silent, reminder |
| `BellPlusIcon` | `@mdevs/icons/objects/bell-plus` | [bell-plus.svg](../../svg/objects/bell-plus.svg) | [TSX](../../src/icons/objects/bell-plus.tsx) | lucide | notification, silent, reminder, add, create, new |
| `BellRingIcon` | `@mdevs/icons/objects/bell-ring` | [bell-ring.svg](../../svg/objects/bell-ring.svg) | [TSX](../../src/icons/objects/bell-ring.tsx) | lucide | alarm, notification, sound, reminder |
| `BellSchoolIcon` | `@mdevs/icons/objects/bell-school` | [bell-school.svg](../../svg/objects/bell-school.svg) | [TSX](../../src/icons/objects/bell-school.tsx) | tabler | alarm, education, alert, sound, notification, study, bell, school |
| `BoxIcon` | `@mdevs/icons/objects/box` | [box.svg](../../svg/objects/box.svg) | [TSX](../../src/icons/objects/box.tsx) | lucide | cube, package, container, storage, geometry, 3d, isometric |
| `BoxMultiple0Icon` | `@mdevs/icons/objects/box-multiple-0` | [box-multiple-0.svg](../../svg/objects/box-multiple-0.svg) | [TSX](../../src/icons/objects/box-multiple-0.tsx) | tabler | css, cascading, style, sheet, background, section, zero, website, layer, box |
| `BoxMultiple1Icon` | `@mdevs/icons/objects/box-multiple-1` | [box-multiple-1.svg](../../svg/objects/box-multiple-1.svg) | [TSX](../../src/icons/objects/box-multiple-1.tsx) | tabler | css, cascading, style, sheet, background, section, one, website, layer, box |
| `BoxMultiple2Icon` | `@mdevs/icons/objects/box-multiple-2` | [box-multiple-2.svg](../../svg/objects/box-multiple-2.svg) | [TSX](../../src/icons/objects/box-multiple-2.tsx) | tabler | css, cascading, style, sheet, background, section, two, website, layer, box |
| `BoxMultiple3Icon` | `@mdevs/icons/objects/box-multiple-3` | [box-multiple-3.svg](../../svg/objects/box-multiple-3.svg) | [TSX](../../src/icons/objects/box-multiple-3.tsx) | tabler | css, cascading, style, sheet, background, section, three, website, layer, box |
| `BoxMultiple4Icon` | `@mdevs/icons/objects/box-multiple-4` | [box-multiple-4.svg](../../svg/objects/box-multiple-4.svg) | [TSX](../../src/icons/objects/box-multiple-4.tsx) | tabler | css, cascading, style, sheet, background, section, four, website, layer, box |
| `BoxMultiple5Icon` | `@mdevs/icons/objects/box-multiple-5` | [box-multiple-5.svg](../../svg/objects/box-multiple-5.svg) | [TSX](../../src/icons/objects/box-multiple-5.tsx) | tabler | css, cascading, style, sheet, background, section, five, website, layer, box |
| `BoxMultiple6Icon` | `@mdevs/icons/objects/box-multiple-6` | [box-multiple-6.svg](../../svg/objects/box-multiple-6.svg) | [TSX](../../src/icons/objects/box-multiple-6.tsx) | tabler | css, cascading, style, sheet, background, section, six, website, layer, box |
| `BoxMultiple7Icon` | `@mdevs/icons/objects/box-multiple-7` | [box-multiple-7.svg](../../svg/objects/box-multiple-7.svg) | [TSX](../../src/icons/objects/box-multiple-7.tsx) | tabler | css, cascading, style, sheet, background, section, seven, website, layer, box |
| `BoxMultiple8Icon` | `@mdevs/icons/objects/box-multiple-8` | [box-multiple-8.svg](../../svg/objects/box-multiple-8.svg) | [TSX](../../src/icons/objects/box-multiple-8.tsx) | tabler | css, cascading, style, sheet, background, section, eight, website, layer, box |
| `BoxMultiple9Icon` | `@mdevs/icons/objects/box-multiple-9` | [box-multiple-9.svg](../../svg/objects/box-multiple-9.svg) | [TSX](../../src/icons/objects/box-multiple-9.tsx) | tabler | css, cascading, style, sheet, background, section, nine, website, layer, box |
| `BoxSelectIcon` | `@mdevs/icons/objects/box-select` | [box-select.svg](../../svg/objects/box-select.svg) | [TSX](../../src/icons/objects/box-select.tsx) | lucide | — |
| `BriefcaseIcon` | `@mdevs/icons/objects/briefcase` | [briefcase.svg](../../svg/objects/briefcase.svg) | [TSX](../../src/icons/objects/briefcase.tsx) | lucide | work, bag, baggage, folder |
| `BriefcaseBusinessIcon` | `@mdevs/icons/objects/briefcase-business` | [briefcase-business.svg](../../svg/objects/briefcase-business.svg) | [TSX](../../src/icons/objects/briefcase-business.tsx) | lucide | work, bag, baggage, folder, portfolio |
| `BriefcaseConveyorBeltIcon` | `@mdevs/icons/objects/briefcase-conveyor-belt` | [briefcase-conveyor-belt.svg](../../svg/objects/briefcase-conveyor-belt.svg) | [TSX](../../src/icons/objects/briefcase-conveyor-belt.tsx) | lucide | baggage, luggage, travel, suitcase, conveyor, carousel |
| `BriefcaseMedicalIcon` | `@mdevs/icons/objects/briefcase-medical` | [briefcase-medical.svg](../../svg/objects/briefcase-medical.svg) | [TSX](../../src/icons/objects/briefcase-medical.tsx) | lucide | doctor, medicine, first aid |
| `BriefcasePlusIcon` | `@mdevs/icons/objects/briefcase-plus` | [briefcase-plus.svg](../../svg/objects/briefcase-plus.svg) | [TSX](../../src/icons/objects/briefcase-plus.tsx) | lucide | work, bag, baggage, folder, new, add, create, increase, briefcase, portfolio, business, career, employment, professional, plus |
| `FlagIcon` | `@mdevs/icons/objects/flag` | [flag.svg](../../svg/objects/flag.svg) | [TSX](../../src/icons/objects/flag.tsx) | lucide | report, marker, notification, warning, milestone, goal, notice, signal, attention, banner |
| `Flag2Icon` | `@mdevs/icons/objects/flag-2` | [flag-2.svg](../../svg/objects/flag-2.svg) | [TSX](../../src/icons/objects/flag-2.tsx) | tabler | banner, pin, report, map, warning, alert, flag, location, navigation, geography |
| `Flag2OffIcon` | `@mdevs/icons/objects/flag-2-off` | [flag-2-off.svg](../../svg/objects/flag-2-off.svg) | [TSX](../../src/icons/objects/flag-2-off.tsx) | tabler | banner, pin, report, map, warning, alert, flag, off, location, navigation |
| `Flag3Icon` | `@mdevs/icons/objects/flag-3` | [flag-3.svg](../../svg/objects/flag-3.svg) | [TSX](../../src/icons/objects/flag-3.tsx) | tabler | banner, pin, report, map, warning, alert, flag, location, navigation, geography |
| `FlagBoltIcon` | `@mdevs/icons/objects/flag-bolt` | [flag-bolt.svg](../../svg/objects/flag-bolt.svg) | [TSX](../../src/icons/objects/flag-bolt.tsx) | tabler | electricity, energy, power, speed, charge, thunder, zap, storm, blast, current |
| `FlagOffIcon` | `@mdevs/icons/objects/flag-off` | [flag-off.svg](../../svg/objects/flag-off.svg) | [TSX](../../src/icons/objects/flag-off.tsx) | lucide | unflag, unmark, report, marker, notification, warning, milestone, goal, notice, signal, attention, banner |
| `FlagTriangleLeftIcon` | `@mdevs/icons/objects/flag-triangle-left` | [flag-triangle-left.svg](../../svg/objects/flag-triangle-left.svg) | [TSX](../../src/icons/objects/flag-triangle-left.tsx) | lucide | report, timeline, marker, pin |
| `FlagTriangleRightIcon` | `@mdevs/icons/objects/flag-triangle-right` | [flag-triangle-right.svg](../../svg/objects/flag-triangle-right.svg) | [TSX](../../src/icons/objects/flag-triangle-right.tsx) | lucide | report, timeline, marker, pin |
| `InboxIcon` | `@mdevs/icons/objects/inbox` | [inbox.svg](../../svg/objects/inbox.svg) | [TSX](../../src/icons/objects/inbox.tsx) | lucide | email |
| `LampIcon` | `@mdevs/icons/objects/lamp` | [lamp.svg](../../svg/objects/lamp.svg) | [TSX](../../src/icons/objects/lamp.tsx) | lucide | lighting, household, home, furniture |
| `LampCeilingIcon` | `@mdevs/icons/objects/lamp-ceiling` | [lamp-ceiling.svg](../../svg/objects/lamp-ceiling.svg) | [TSX](../../src/icons/objects/lamp-ceiling.tsx) | lucide | lighting, household, home, furniture |
| `LampDeskIcon` | `@mdevs/icons/objects/lamp-desk` | [lamp-desk.svg](../../svg/objects/lamp-desk.svg) | [TSX](../../src/icons/objects/lamp-desk.tsx) | lucide | lighting, household, office, desk, home, furniture |
| `LampFloorIcon` | `@mdevs/icons/objects/lamp-floor` | [lamp-floor.svg](../../svg/objects/lamp-floor.svg) | [TSX](../../src/icons/objects/lamp-floor.tsx) | lucide | lighting, household, floor, home, furniture |
| `LampWallDownIcon` | `@mdevs/icons/objects/lamp-wall-down` | [lamp-wall-down.svg](../../svg/objects/lamp-wall-down.svg) | [TSX](../../src/icons/objects/lamp-wall-down.tsx) | lucide | lighting, household, wall, home, furniture |
| `LampWallUpIcon` | `@mdevs/icons/objects/lamp-wall-up` | [lamp-wall-up.svg](../../svg/objects/lamp-wall-up.svg) | [TSX](../../src/icons/objects/lamp-wall-up.tsx) | lucide | lighting, household, wall, home, furniture |
| `LightbulbIcon` | `@mdevs/icons/objects/lightbulb` | [lightbulb.svg](../../svg/objects/lightbulb.svg) | [TSX](../../src/icons/objects/lightbulb.tsx) | lucide | idea, bright, lights |
| `LightbulbOffIcon` | `@mdevs/icons/objects/lightbulb-off` | [lightbulb-off.svg](../../svg/objects/lightbulb-off.svg) | [TSX](../../src/icons/objects/lightbulb-off.tsx) | lucide | lights |
| `LuggageIcon` | `@mdevs/icons/objects/luggage` | [luggage.svg](../../svg/objects/luggage.svg) | [TSX](../../src/icons/objects/luggage.tsx) | lucide | baggage, luggage, travel, suitcase |
| `SofaIcon` | `@mdevs/icons/objects/sofa` | [sofa.svg](../../svg/objects/sofa.svg) | [TSX](../../src/icons/objects/sofa.tsx) | lucide | armchair, furniture, leisure, lounge, loveseat, couch |
| `Trash2Icon` | `@mdevs/icons/objects/trash-2` | [trash-2.svg](../../svg/objects/trash-2.svg) | [TSX](../../src/icons/objects/trash-2.tsx) | lucide | — |
| `TrashOffIcon` | `@mdevs/icons/objects/trash-off` | [trash-off.svg](../../svg/objects/trash-off.svg) | [TSX](../../src/icons/objects/trash-off.tsx) | lucide | empty, deletion, cleanup, junk, clear, garbage, delete, remove, bin, trash, waste, recycle, discard, rubbish, disabled, off, prevent, locked, unavailable, protected |
| `UmbrellaIcon` | `@mdevs/icons/objects/umbrella` | [umbrella.svg](../../svg/objects/umbrella.svg) | [TSX](../../src/icons/objects/umbrella.tsx) | lucide | rain, weather |
| `UmbrellaOffIcon` | `@mdevs/icons/objects/umbrella-off` | [umbrella-off.svg](../../svg/objects/umbrella-off.svg) | [TSX](../../src/icons/objects/umbrella-off.tsx) | lucide | rain, weather, uncovered, uninsured, antivirus, unprotected, risky |

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
