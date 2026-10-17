# Personnes — icônes

56 icônes de la catégorie `people`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (37), tabler (19). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {AccessibilityIcon} from '@mdevs/icons';
// Alternatives :
import {AccessibilityIcon} from '@mdevs/icons/people';
import {AccessibilityIcon} from '@mdevs/icons/people/accessibility';
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
import {AccessibilityIcon} from '@mdevs/icons/people/accessibility';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><AccessibilityIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <AccessibilityIcon size={32} title="Personnes" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `AccessibilityIcon` | `@mdevs/icons/people/accessibility` | [accessibility.svg](../../svg/people/accessibility.svg) | [TSX](../../src/icons/people/accessibility.tsx) | lucide | disability, disabled, dda, wheelchair |
| `BabyIcon` | `@mdevs/icons/people/baby` | [baby.svg](../../svg/people/baby.svg) | [TSX](../../src/icons/people/baby.tsx) | lucide | child, childproof, children |
| `BabyBottleIcon` | `@mdevs/icons/people/baby-bottle` | [baby-bottle.svg](../../svg/people/baby-bottle.svg) | [TSX](../../src/icons/people/baby-bottle.tsx) | tabler | kid, milk, child, food, drink, feeding, baby, bottle, medical, wellness |
| `BabyCarriageIcon` | `@mdevs/icons/people/baby-carriage` | [baby-carriage.svg](../../svg/people/baby-carriage.svg) | [TSX](../../src/icons/people/baby-carriage.tsx) | tabler | child, infant, cradle, pram, baby, carriage, medical, wellness, healthcare, treatment |
| `ContactIcon` | `@mdevs/icons/people/contact` | [contact.svg](../../svg/people/contact.svg) | [TSX](../../src/icons/people/contact.tsx) | lucide | user, person, family, friend, acquaintance, listing, networking |
| `Contact2Icon` | `@mdevs/icons/people/contact-2` | [contact-2.svg](../../svg/people/contact-2.svg) | [TSX](../../src/icons/people/contact-2.tsx) | lucide | — |
| `FootprintsIcon` | `@mdevs/icons/people/footprints` | [footprints.svg](../../svg/people/footprints.svg) | [TSX](../../src/icons/people/footprints.tsx) | lucide | steps, walking, foot, feet, trail, shoe |
| `HandIcon` | `@mdevs/icons/people/hand` | [hand.svg](../../svg/people/hand.svg) | [TSX](../../src/icons/people/hand.tsx) | lucide | wave, move, mouse, grab |
| `HandClickIcon` | `@mdevs/icons/people/hand-click` | [hand-click.svg](../../svg/people/hand-click.svg) | [TSX](../../src/icons/people/hand-click.tsx) | tabler | gesture, touch, press, phone, finger, index, forefinger, hand, mouse, click |
| `HandClickOffIcon` | `@mdevs/icons/people/hand-click-off` | [hand-click-off.svg](../../svg/people/hand-click-off.svg) | [TSX](../../src/icons/people/hand-click-off.tsx) | tabler | gesture, touch, press, phone, finger, index, forefinger, hand, mouse, click |
| `HandCoinsIcon` | `@mdevs/icons/people/hand-coins` | [hand-coins.svg](../../svg/people/hand-coins.svg) | [TSX](../../src/icons/people/hand-coins.tsx) | lucide | savings, banking, money, finance, offers, mortgage, payment, received, wage, payroll, allowance, pocket money, handout, pennies |
| `HandFingerIcon` | `@mdevs/icons/people/hand-finger` | [hand-finger.svg](../../svg/people/hand-finger.svg) | [TSX](../../src/icons/people/hand-finger.tsx) | tabler | point, show, index, forefinger, body, human, palm, click, press, touch, mouse, pointer |
| `HandFingerDownIcon` | `@mdevs/icons/people/hand-finger-down` | [hand-finger-down.svg](../../svg/people/hand-finger-down.svg) | [TSX](../../src/icons/people/hand-finger-down.tsx) | tabler | gesture, point, direction, indicate, signal, motion, guide, move, show, pointing |
| `HandFingerLeftIcon` | `@mdevs/icons/people/hand-finger-left` | [hand-finger-left.svg](../../svg/people/hand-finger-left.svg) | [TSX](../../src/icons/people/hand-finger-left.tsx) | tabler | indicate, gesture, point, motion, signal, guide, direction, leftward, show, indicator |
| `HandFingerOffIcon` | `@mdevs/icons/people/hand-finger-off` | [hand-finger-off.svg](../../svg/people/hand-finger-off.svg) | [TSX](../../src/icons/people/hand-finger-off.tsx) | tabler | point, show, index, forefinger, body, human, palm, click, press, touch, mouse, pointer |
| `HandFingerRightIcon` | `@mdevs/icons/people/hand-finger-right` | [hand-finger-right.svg](../../svg/people/hand-finger-right.svg) | [TSX](../../src/icons/people/hand-finger-right.tsx) | tabler | point, gesture, direction, indicate, motion, signal, show, guide, rightward, indicator |
| `HandFistIcon` | `@mdevs/icons/people/hand-fist` | [hand-fist.svg](../../svg/people/hand-fist.svg) | [TSX](../../src/icons/people/hand-fist.tsx) | lucide | clench, strength, power, unity, solidarity, rebellion, victory, triumph, support, fight, combat, brawl |
| `HandGrabIcon` | `@mdevs/icons/people/hand-grab` | [hand-grab.svg](../../svg/people/hand-grab.svg) | [TSX](../../src/icons/people/hand-grab.tsx) | tabler | hold, fist, drop, catch, hand, grab, touch, action, motion, interaction |
| `HandHeartIcon` | `@mdevs/icons/people/hand-heart` | [hand-heart.svg](../../svg/people/hand-heart.svg) | [TSX](../../src/icons/people/hand-heart.tsx) | lucide | love, like, emotion |
| `HandHelpingIcon` | `@mdevs/icons/people/hand-helping` | [hand-helping.svg](../../svg/people/hand-helping.svg) | [TSX](../../src/icons/people/hand-helping.tsx) | lucide | agreement, help, proposal, charity, begging, terms |
| `HandLittleFingerIcon` | `@mdevs/icons/people/hand-little-finger` | [hand-little-finger.svg](../../svg/people/hand-little-finger.svg) | [TSX](../../src/icons/people/hand-little-finger.tsx) | tabler | small, body, human, palm, hand, little, finger, touch, action, motion |
| `HandLoveYouIcon` | `@mdevs/icons/people/hand-love-you` | [hand-love-you.svg](../../svg/people/hand-love-you.svg) | [TSX](../../src/icons/people/hand-love-you.tsx) | tabler | heavy, metal, party, concert, rebel, hand, love, you, touch, action |
| `HandMetalIcon` | `@mdevs/icons/people/hand-metal` | [hand-metal.svg](../../svg/people/hand-metal.svg) | [TSX](../../src/icons/people/hand-metal.tsx) | lucide | rock |
| `HandMiddleFingerIcon` | `@mdevs/icons/people/hand-middle-finger` | [hand-middle-finger.svg](../../svg/people/hand-middle-finger.svg) | [TSX](../../src/icons/people/hand-middle-finger.tsx) | tabler | signal, gesture, curse, vulgarism, abuse, hand, middle, finger, touch, action |
| `HandMoveIcon` | `@mdevs/icons/people/hand-move` | [hand-move.svg](../../svg/people/hand-move.svg) | [TSX](../../src/icons/people/hand-move.tsx) | tabler | gesture, swipe, right, left, up, down, hand, move, transfer, shift |
| `HandOffIcon` | `@mdevs/icons/people/hand-off` | [hand-off.svg](../../svg/people/hand-off.svg) | [TSX](../../src/icons/people/hand-off.tsx) | tabler | disclaimer, body, hand, off, disabled, inactive, touch, action, motion, interaction |
| `HandPlatterIcon` | `@mdevs/icons/people/hand-platter` | [hand-platter.svg](../../svg/people/hand-platter.svg) | [TSX](../../src/icons/people/hand-platter.tsx) | lucide | waiter, waitress, restaurant, table service, served, dinner, dining, meal, course, luxury |
| `HandRingFingerIcon` | `@mdevs/icons/people/hand-ring-finger` | [hand-ring-finger.svg](../../svg/people/hand-ring-finger.svg) | [TSX](../../src/icons/people/hand-ring-finger.tsx) | tabler | body, human, palm, hand, ring, finger, touch, action, motion, interaction |
| `HandStopIcon` | `@mdevs/icons/people/hand-stop` | [hand-stop.svg](../../svg/people/hand-stop.svg) | [TSX](../../src/icons/people/hand-stop.tsx) | tabler | forbiddance, nixing, ban, interdicting, hand, stop, touch, action, motion, interaction |
| `HandThreeFingersIcon` | `@mdevs/icons/people/hand-three-fingers` | [hand-three-fingers.svg](../../svg/people/hand-three-fingers.svg) | [TSX](../../src/icons/people/hand-three-fingers.tsx) | tabler | body, human, palm, hand, three, fingers, touch, action, motion, interaction |
| `HandTwoFingersIcon` | `@mdevs/icons/people/hand-two-fingers` | [hand-two-fingers.svg](../../svg/people/hand-two-fingers.svg) | [TSX](../../src/icons/people/hand-two-fingers.tsx) | tabler | body, human, palm, gesture, hand, two, fingers, touch, action, motion |
| `PersonStandingIcon` | `@mdevs/icons/people/person-standing` | [person-standing.svg](../../svg/people/person-standing.svg) | [TSX](../../src/icons/people/person-standing.tsx) | lucide | people, human, accessibility, stick figure |
| `UserIcon` | `@mdevs/icons/people/user` | [user.svg](../../svg/people/user.svg) | [TSX](../../src/icons/people/user.tsx) | lucide | person, account, contact |
| `User2Icon` | `@mdevs/icons/people/user-2` | [user-2.svg](../../svg/people/user-2.svg) | [TSX](../../src/icons/people/user-2.tsx) | lucide | — |
| `UserCheckIcon` | `@mdevs/icons/people/user-check` | [user-check.svg](../../svg/people/user-check.svg) | [TSX](../../src/icons/people/user-check.tsx) | lucide | followed, subscribed, done, todo, tick, complete, task |
| `UserCheck2Icon` | `@mdevs/icons/people/user-check-2` | [user-check-2.svg](../../svg/people/user-check-2.svg) | [TSX](../../src/icons/people/user-check-2.tsx) | lucide | — |
| `UserCogIcon` | `@mdevs/icons/people/user-cog` | [user-cog.svg](../../svg/people/user-cog.svg) | [TSX](../../src/icons/people/user-cog.tsx) | lucide | settings, edit, cog, gear |
| `UserCog2Icon` | `@mdevs/icons/people/user-cog-2` | [user-cog-2.svg](../../svg/people/user-cog-2.svg) | [TSX](../../src/icons/people/user-cog-2.tsx) | lucide | — |
| `UserGroupIcon` | `@mdevs/icons/people/user-group` | [user-group.svg](../../svg/people/user-group.svg) | [TSX](../../src/icons/people/user-group.tsx) | lucide | group, people, team, members, community, membership, collaboration, organization, contacts, directory, staff, family, ancestry, ancestors, lineage, parents |
| `UserKeyIcon` | `@mdevs/icons/people/user-key` | [user-key.svg](../../svg/people/user-key.svg) | [TSX](../../src/icons/people/user-key.tsx) | lucide | passkey, password, login, authentication, authorization, roles, permissions, private, public, security, person, account, contact |
| `UserLockIcon` | `@mdevs/icons/people/user-lock` | [user-lock.svg](../../svg/people/user-lock.svg) | [TSX](../../src/icons/people/user-lock.tsx) | lucide | person, lock, locked, account, secure |
| `UserMinusIcon` | `@mdevs/icons/people/user-minus` | [user-minus.svg](../../svg/people/user-minus.svg) | [TSX](../../src/icons/people/user-minus.tsx) | lucide | delete, remove, unfollow, unsubscribe |
| `UserMinus2Icon` | `@mdevs/icons/people/user-minus-2` | [user-minus-2.svg](../../svg/people/user-minus-2.svg) | [TSX](../../src/icons/people/user-minus-2.tsx) | lucide | — |
| `UserPenIcon` | `@mdevs/icons/people/user-pen` | [user-pen.svg](../../svg/people/user-pen.svg) | [TSX](../../src/icons/people/user-pen.tsx) | lucide | person, account, contact, profile, edit, change |
| `UserPlusIcon` | `@mdevs/icons/people/user-plus` | [user-plus.svg](../../svg/people/user-plus.svg) | [TSX](../../src/icons/people/user-plus.tsx) | lucide | new, add, create, follow, subscribe |
| `UserPlus2Icon` | `@mdevs/icons/people/user-plus-2` | [user-plus-2.svg](../../svg/people/user-plus-2.svg) | [TSX](../../src/icons/people/user-plus-2.tsx) | lucide | — |
| `UserRoundArrowLeftIcon` | `@mdevs/icons/people/user-round-arrow-left` | [user-round-arrow-left.svg](../../svg/people/user-round-arrow-left.svg) | [TSX](../../src/icons/people/user-round-arrow-left.tsx) | lucide | person, assign, move, give, setup, self, me, myself, profile, avatar, incoming, recipient, assignee, inbound |
| `UserRoundGroupIcon` | `@mdevs/icons/people/user-round-group` | [user-round-group.svg](../../svg/people/user-round-group.svg) | [TSX](../../src/icons/people/user-round-group.tsx) | lucide | group, people, team, members, community, membership, collaboration, organization, contacts, directory, staff, family, ancestry, ancestors, lineage, parents |
| `UserRoundKeyIcon` | `@mdevs/icons/people/user-round-key` | [user-round-key.svg](../../svg/people/user-round-key.svg) | [TSX](../../src/icons/people/user-round-key.tsx) | lucide | passkey, password, login, authentication, authorization, roles, permissions, private, public, security, person, account, contact |
| `UserRoundPenIcon` | `@mdevs/icons/people/user-round-pen` | [user-round-pen.svg](../../svg/people/user-round-pen.svg) | [TSX](../../src/icons/people/user-round-pen.tsx) | lucide | person, account, contact, profile, edit, change |
| `UserRoundSearchIcon` | `@mdevs/icons/people/user-round-search` | [user-round-search.svg](../../svg/people/user-round-search.svg) | [TSX](../../src/icons/people/user-round-search.tsx) | lucide | person, account, contact, find, scan, magnifier, magnifying glass, lens |
| `UserRoundXIcon` | `@mdevs/icons/people/user-round-x` | [user-round-x.svg](../../svg/people/user-round-x.svg) | [TSX](../../src/icons/people/user-round-x.tsx) | lucide | delete, remove, unfollow, unsubscribe, unavailable |
| `UserSearchIcon` | `@mdevs/icons/people/user-search` | [user-search.svg](../../svg/people/user-search.svg) | [TSX](../../src/icons/people/user-search.tsx) | lucide | person, account, contact, find, scan, magnifier, magnifying glass, lens |
| `UserShieldIcon` | `@mdevs/icons/people/user-shield` | [user-shield.svg](../../svg/people/user-shield.svg) | [TSX](../../src/icons/people/user-shield.tsx) | lucide | user, shield, admin, protected, guard, profile, security, privacy, permissions, role |
| `UserStarIcon` | `@mdevs/icons/people/user-star` | [user-star.svg](../../svg/people/user-star.svg) | [TSX](../../src/icons/people/user-star.tsx) | lucide | person, account, favorite, contact, like, review, rating, admin |
| `UserXIcon` | `@mdevs/icons/people/user-x` | [user-x.svg](../../svg/people/user-x.svg) | [TSX](../../src/icons/people/user-x.tsx) | lucide | delete, remove, unfollow, unsubscribe, unavailable |

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
