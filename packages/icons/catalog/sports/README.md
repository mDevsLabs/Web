# Sports — icônes

16 icônes de la catégorie `sports`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : tabler (9), lucide (7). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {BallAmericanFootballIcon} from '@mdevs/icons';
// Alternatives :
import {BallAmericanFootballIcon} from '@mdevs/icons/sports';
import {BallAmericanFootballIcon} from '@mdevs/icons/sports/ball-american-football';
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
import {BallAmericanFootballIcon} from '@mdevs/icons/sports/ball-american-football';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><BallAmericanFootballIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <BallAmericanFootballIcon size={32} title="Sports" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `BallAmericanFootballIcon` | `@mdevs/icons/sports/ball-american-football` | [ball-american-football.svg](../../svg/sports/ball-american-football.svg) | [TSX](../../src/icons/sports/ball-american-football.tsx) | tabler | sport, game, sportsman, play, match, pitch, ball, american, football, athletic |
| `BallAmericanFootballOffIcon` | `@mdevs/icons/sports/ball-american-football-off` | [ball-american-football-off.svg](../../svg/sports/ball-american-football-off.svg) | [TSX](../../src/icons/sports/ball-american-football-off.tsx) | tabler | sport, game, sportsman, play, match, pitch, ball, american, football, off |
| `BallBaseballIcon` | `@mdevs/icons/sports/ball-baseball` | [ball-baseball.svg](../../svg/sports/ball-baseball.svg) | [TSX](../../src/icons/sports/ball-baseball.tsx) | tabler | sport, game, competition, pitch, ball, baseball, athletic, fitness, exercise, physical |
| `BallBasketballIcon` | `@mdevs/icons/sports/ball-basketball` | [ball-basketball.svg](../../svg/sports/ball-basketball.svg) | [TSX](../../src/icons/sports/ball-basketball.tsx) | tabler | game, round, quarter, basket, nba, ball, basketball, athletic, fitness, exercise |
| `BallBowlingIcon` | `@mdevs/icons/sports/ball-bowling` | [ball-bowling.svg](../../svg/sports/ball-bowling.svg) | [TSX](../../src/icons/sports/ball-bowling.tsx) | tabler | round, strike, spare, pin, ball, bowling, athletic, fitness, exercise, game |
| `BallFootballIcon` | `@mdevs/icons/sports/ball-football` | [ball-football.svg](../../svg/sports/ball-football.svg) | [TSX](../../src/icons/sports/ball-football.tsx) | tabler | sport, game, sportsman, play, match, pitch, ball, football, athletic, fitness |
| `BallFootballOffIcon` | `@mdevs/icons/sports/ball-football-off` | [ball-football-off.svg](../../svg/sports/ball-football-off.svg) | [TSX](../../src/icons/sports/ball-football-off.tsx) | tabler | sport, game, sportsman, play, match, pitch, ball, football, off, athletic |
| `BallTennisIcon` | `@mdevs/icons/sports/ball-tennis` | [ball-tennis.svg](../../svg/sports/ball-tennis.svg) | [TSX](../../src/icons/sports/ball-tennis.tsx) | tabler | game, set, match, court, racket, ball, tennis, athletic, fitness, exercise |
| `BallVolleyballIcon` | `@mdevs/icons/sports/ball-volleyball` | [ball-volleyball.svg](../../svg/sports/ball-volleyball.svg) | [TSX](../../src/icons/sports/ball-volleyball.tsx) | tabler | point, set, match, attacker, ace, setter, serve, ball, volleyball, athletic |
| `DumbbellIcon` | `@mdevs/icons/sports/dumbbell` | [dumbbell.svg](../../svg/sports/dumbbell.svg) | [TSX](../../src/icons/sports/dumbbell.tsx) | lucide | barbell, weight, workout, gym |
| `GoalIcon` | `@mdevs/icons/sports/goal` | [goal.svg](../../svg/sports/goal.svg) | [TSX](../../src/icons/sports/goal.tsx) | lucide | flag, bullseye |
| `MedalIcon` | `@mdevs/icons/sports/medal` | [medal.svg](../../svg/sports/medal.svg) | [TSX](../../src/icons/sports/medal.tsx) | lucide | prize, sports, winner, trophy, award, achievement |
| `SportShoeIcon` | `@mdevs/icons/sports/sport-shoe` | [sport-shoe.svg](../../svg/sports/sport-shoe.svg) | [TSX](../../src/icons/sports/sport-shoe.tsx) | lucide | footwear, sports, running, athletic, shoe, sneaker, training, exercise, fitness |
| `SwordsIcon` | `@mdevs/icons/sports/swords` | [swords.svg](../../svg/sports/swords.svg) | [TSX](../../src/icons/sports/swords.tsx) | lucide | battle, challenge, combat, conflict, crossed, duel, faction, fantasy, game, melee, medieval, opponent, rivalry, rpg, versus, weapon, war, warrior |
| `TargetIcon` | `@mdevs/icons/sports/target` | [target.svg](../../svg/sports/target.svg) | [TSX](../../src/icons/sports/target.tsx) | lucide | logo, bullseye, deadline, projects, overview, work, productivity |
| `TrophyIcon` | `@mdevs/icons/sports/trophy` | [trophy.svg](../../svg/sports/trophy.svg) | [TSX](../../src/icons/sports/trophy.tsx) | lucide | prize, sports, winner, achievement, award, champion, celebration, victory, competition, tournament, leaderboard, ranking, success, reward, cup, first, gold |

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
