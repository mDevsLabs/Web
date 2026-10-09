# Santé — icônes

23 icônes de la catégorie `health`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (20), tabler (3). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {ActivityIcon} from '@mdevs/icons';
// Alternatives :
import {ActivityIcon} from '@mdevs/icons/health';
import {ActivityIcon} from '@mdevs/icons/health/activity';
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
import {ActivityIcon} from '@mdevs/icons/health/activity';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><ActivityIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <ActivityIcon size={32} title="Santé" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `ActivityIcon` | `@mdevs/icons/health/activity` | [activity.svg](../../svg/health/activity.svg) | [TSX](../../src/icons/health/activity.tsx) | lucide | pulse, action, motion, movement, exercise, fitness, healthcare, heart rate monitor, vital signs, vitals, emergency room, er, intensive care, hospital, defibrillator, earthquake, seismic, magnitude, richter scale, aftershock, tremor, shockwave, audio, waveform, synthesizer, synthesiser, music |
| `ActivityHeartbeatIcon` | `@mdevs/icons/health/activity-heartbeat` | [activity-heartbeat.svg](../../svg/health/activity-heartbeat.svg) | [TSX](../../src/icons/health/activity-heartbeat.tsx) | tabler | pulse, lifeline, impuls, hospital, heartrate, activity, heartbeat, love, like, motion |
| `ActivitySquareIcon` | `@mdevs/icons/health/activity-square` | [activity-square.svg](../../svg/health/activity-square.svg) | [TSX](../../src/icons/health/activity-square.tsx) | lucide | — |
| `BandageIcon` | `@mdevs/icons/health/bandage` | [bandage.svg](../../svg/health/bandage.svg) | [TSX](../../src/icons/health/bandage.tsx) | lucide | plaster, band-aid, first aid, medical, health, wound, injury, care, treatment, healing, protection, emergency, aid, safety, patch |
| `BandageOffIcon` | `@mdevs/icons/health/bandage-off` | [bandage-off.svg](../../svg/health/bandage-off.svg) | [TSX](../../src/icons/health/bandage-off.tsx) | tabler | patch, wound, cut, pain, bandage, off, medical, wellness, disabled, inactive |
| `BrainIcon` | `@mdevs/icons/health/brain` | [brain.svg](../../svg/health/brain.svg) | [TSX](../../src/icons/health/brain.tsx) | lucide | medical, mind, mental, intellect, cerebral, consciousness, genius, artificial intelligence, ai, think, thought, insight, intelligent, smart |
| `BrainCircuitIcon` | `@mdevs/icons/health/brain-circuit` | [brain-circuit.svg](../../svg/health/brain-circuit.svg) | [TSX](../../src/icons/health/brain-circuit.tsx) | lucide | mind, intellect, artificial intelligence, ai, deep learning, machine learning, computing |
| `BrainCogIcon` | `@mdevs/icons/health/brain-cog` | [brain-cog.svg](../../svg/health/brain-cog.svg) | [TSX](../../src/icons/health/brain-cog.tsx) | lucide | mind, intellect, artificial intelligence, ai, deep learning, machine learning, computing |
| `CrossIcon` | `@mdevs/icons/health/cross` | [cross.svg](../../svg/health/cross.svg) | [TSX](../../src/icons/health/cross.tsx) | lucide | healthcare, first aid |
| `CrossOffIcon` | `@mdevs/icons/health/cross-off` | [cross-off.svg](../../svg/health/cross-off.svg) | [TSX](../../src/icons/health/cross-off.tsx) | tabler | prayer, church, catholic, jezus, religion, cross, off, disabled, inactive, sign |
| `HeartIcon` | `@mdevs/icons/health/heart` | [heart.svg](../../svg/health/heart.svg) | [TSX](../../src/icons/health/heart.tsx) | lucide | like, love, emotion, suit, playing, cards |
| `HeartCrackIcon` | `@mdevs/icons/health/heart-crack` | [heart-crack.svg](../../svg/health/heart-crack.svg) | [TSX](../../src/icons/health/heart-crack.tsx) | lucide | heartbreak, sadness, emotion |
| `HeartHandshakeIcon` | `@mdevs/icons/health/heart-handshake` | [heart-handshake.svg](../../svg/health/heart-handshake.svg) | [TSX](../../src/icons/health/heart-handshake.tsx) | lucide | agreement, charity, help, deal, terms, emotion, together, handshake |
| `HeartMinusIcon` | `@mdevs/icons/health/heart-minus` | [heart-minus.svg](../../svg/health/heart-minus.svg) | [TSX](../../src/icons/health/heart-minus.tsx) | lucide | unlike, unfavorite, remove, delete, damage |
| `HeartOffIcon` | `@mdevs/icons/health/heart-off` | [heart-off.svg](../../svg/health/heart-off.svg) | [TSX](../../src/icons/health/heart-off.tsx) | lucide | unlike, dislike, hate, emotion |
| `HeartPlusIcon` | `@mdevs/icons/health/heart-plus` | [heart-plus.svg](../../svg/health/heart-plus.svg) | [TSX](../../src/icons/health/heart-plus.tsx) | lucide | plus, like, favorite, add, health, support |
| `HeartPulseIcon` | `@mdevs/icons/health/heart-pulse` | [heart-pulse.svg](../../svg/health/heart-pulse.svg) | [TSX](../../src/icons/health/heart-pulse.tsx) | lucide | heartbeat, pulse, health, medical, blood pressure, cardiac, systole, diastole |
| `HeartXIcon` | `@mdevs/icons/health/heart-x` | [heart-x.svg](../../svg/health/heart-x.svg) | [TSX](../../src/icons/health/heart-x.tsx) | lucide | unlike, unfavorite, remove, reject, dismiss, delete, clear |
| `HospitalIcon` | `@mdevs/icons/health/hospital` | [hospital.svg](../../svg/health/hospital.svg) | [TSX](../../src/icons/health/hospital.tsx) | lucide | infirmary, sanatorium, healthcare, doctor, hospice, clinic, emergency room, ward, building, medical, vet |
| `PillIcon` | `@mdevs/icons/health/pill` | [pill.svg](../../svg/health/pill.svg) | [TSX](../../src/icons/health/pill.tsx) | lucide | medicine, medication, drug, prescription, tablet, pharmacy |
| `PillBottleIcon` | `@mdevs/icons/health/pill-bottle` | [pill-bottle.svg](../../svg/health/pill-bottle.svg) | [TSX](../../src/icons/health/pill-bottle.tsx) | lucide | medicine, medication, prescription, drug, supplement, vitamin, capsule, jar, container, healthcare, pharmaceutical, tablet |
| `StethoscopeIcon` | `@mdevs/icons/health/stethoscope` | [stethoscope.svg](../../svg/health/stethoscope.svg) | [TSX](../../src/icons/health/stethoscope.tsx) | lucide | phonendoscope, medical, heart, lungs, sound |
| `SyringeIcon` | `@mdevs/icons/health/syringe` | [syringe.svg](../../svg/health/syringe.svg) | [TSX](../../src/icons/health/syringe.tsx) | lucide | medicine, medical, needle, pump, plunger, nozzle, blood |

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
