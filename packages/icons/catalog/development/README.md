# Développement — icônes

61 icônes de la catégorie `development`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : tabler (23), lucide (38). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {ApiIcon} from '@mdevs/icons';
// Alternatives :
import {ApiIcon} from '@mdevs/icons/development';
import {ApiIcon} from '@mdevs/icons/development/api';
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
import {ApiIcon} from '@mdevs/icons/development/api';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><ApiIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <ApiIcon size={32} title="Développement" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `ApiIcon` | `@mdevs/icons/development/api` | [api.svg](../../svg/development/api.svg) | [TSX](../../src/icons/development/api.tsx) | tabler | programming, coding, program, code, configuration, api, software, technical, developer, interface |
| `ApiAppIcon` | `@mdevs/icons/development/api-app` | [api-app.svg](../../svg/development/api-app.svg) | [TSX](../../src/icons/development/api-app.tsx) | tabler | development, software, developer, platform, api, app, programming, coding, technical, application |
| `ApiAppOffIcon` | `@mdevs/icons/development/api-app-off` | [api-app-off.svg](../../svg/development/api-app-off.svg) | [TSX](../../src/icons/development/api-app-off.tsx) | tabler | development, software, developer, platform, api, app, off, programming, disabled, inactive |
| `ApiBookIcon` | `@mdevs/icons/development/api-book` | [api-book.svg](../../svg/development/api-book.svg) | [TSX](../../src/icons/development/api-book.tsx) | tabler | programming, coding, program, code, configuration, api, software, technical, developer, interface |
| `ApiOffIcon` | `@mdevs/icons/development/api-off` | [api-off.svg](../../svg/development/api-off.svg) | [TSX](../../src/icons/development/api-off.tsx) | tabler | programming, coding, program, code, configuration, api, off, software, disabled, inactive |
| `BinaryIcon` | `@mdevs/icons/development/binary` | [binary.svg](../../svg/development/binary.svg) | [TSX](../../src/icons/development/binary.tsx) | lucide | code, digits, computer, zero, one, boolean |
| `BinaryOffIcon` | `@mdevs/icons/development/binary-off` | [binary-off.svg](../../svg/development/binary-off.svg) | [TSX](../../src/icons/development/binary-off.tsx) | tabler | binary, off, disabled, inactive, code, digital, computer, programming, data, bit |
| `BinaryTreeIcon` | `@mdevs/icons/development/binary-tree` | [binary-tree.svg](../../svg/development/binary-tree.svg) | [TSX](../../src/icons/development/binary-tree.tsx) | tabler | data, diversity, it, math, binary, tree, code, digital, computer, programming |
| `BinaryTree2Icon` | `@mdevs/icons/development/binary-tree-2` | [binary-tree-2.svg](../../svg/development/binary-tree-2.svg) | [TSX](../../src/icons/development/binary-tree-2.tsx) | tabler | data, diversity, it, math, binary, tree, code, digital, computer, programming |
| `BracesIcon` | `@mdevs/icons/development/braces` | [braces.svg](../../svg/development/braces.svg) | [TSX](../../src/icons/development/braces.tsx) | lucide | json, code, token, curly brackets, data, {, } |
| `BracesOffIcon` | `@mdevs/icons/development/braces-off` | [braces-off.svg](../../svg/development/braces-off.svg) | [TSX](../../src/icons/development/braces-off.tsx) | tabler | punctuation, additional, information, braces, off, calculation, equation, disabled, inactive, mathematics |
| `BracketsIcon` | `@mdevs/icons/development/brackets` | [brackets.svg](../../svg/development/brackets.svg) | [TSX](../../src/icons/development/brackets.tsx) | lucide | code, token, array, list, square, [, ] |
| `BracketsContainIcon` | `@mdevs/icons/development/brackets-contain` | [brackets-contain.svg](../../svg/development/brackets-contain.svg) | [TSX](../../src/icons/development/brackets-contain.tsx) | tabler | word, regex, find, brackets, contain, calculation, equation, mathematics, numeric, formula |
| `BracketsContainEndIcon` | `@mdevs/icons/development/brackets-contain-end` | [brackets-contain-end.svg](../../svg/development/brackets-contain-end.svg) | [TSX](../../src/icons/development/brackets-contain-end.tsx) | tabler | word, regex, find, brackets, contain, end, calculation, equation, mathematics, numeric |
| `BracketsContainStartIcon` | `@mdevs/icons/development/brackets-contain-start` | [brackets-contain-start.svg](../../svg/development/brackets-contain-start.svg) | [TSX](../../src/icons/development/brackets-contain-start.tsx) | tabler | word, regex, find, brackets, contain, start, calculation, equation, favorite, rating |
| `BracketsOffIcon` | `@mdevs/icons/development/brackets-off` | [brackets-off.svg](../../svg/development/brackets-off.svg) | [TSX](../../src/icons/development/brackets-off.tsx) | tabler | punctuation, additional, information, brackets, off, calculation, equation, disabled, inactive, mathematics |
| `BugIcon` | `@mdevs/icons/development/bug` | [bug.svg](../../svg/development/bug.svg) | [TSX](../../src/icons/development/bug.tsx) | lucide | issue, error, defect, testing, troubleshoot, problem, report, debug, code, insect, beetle |
| `BugOffIcon` | `@mdevs/icons/development/bug-off` | [bug-off.svg](../../svg/development/bug-off.svg) | [TSX](../../src/icons/development/bug-off.tsx) | lucide | issue, fixed, resolved, testing, debug, code, insect, kill, exterminate, pest control |
| `BugPlayIcon` | `@mdevs/icons/development/bug-play` | [bug-play.svg](../../svg/development/bug-play.svg) | [TSX](../../src/icons/development/bug-play.tsx) | lucide | issue, testing, debug, reproduce, code, insect |
| `CodeIcon` | `@mdevs/icons/development/code` | [code.svg](../../svg/development/code.svg) | [TSX](../../src/icons/development/code.tsx) | lucide | source, programming, html, xml |
| `Code2Icon` | `@mdevs/icons/development/code-2` | [code-2.svg](../../svg/development/code-2.svg) | [TSX](../../src/icons/development/code-2.tsx) | lucide | — |
| `CodeAiIcon` | `@mdevs/icons/development/code-ai` | [code-ai.svg](../../svg/development/code-ai.svg) | [TSX](../../src/icons/development/code-ai.tsx) | tabler | ai, artificial intelligence, code, programming, assistant, copilot, autocomplete, snippet, editor, development |
| `CodeSquareIcon` | `@mdevs/icons/development/code-square` | [code-square.svg](../../svg/development/code-square.svg) | [TSX](../../src/icons/development/code-square.tsx) | lucide | — |
| `GitBranchIcon` | `@mdevs/icons/development/git-branch` | [git-branch.svg](../../svg/development/git-branch.svg) | [TSX](../../src/icons/development/git-branch.tsx) | lucide | code, version control, vcs, repository |
| `GitBranchCheckIcon` | `@mdevs/icons/development/git-branch-check` | [git-branch-check.svg](../../svg/development/git-branch-check.svg) | [TSX](../../src/icons/development/git-branch-check.tsx) | tabler | code, version control, git, branch, check, approve, verified, merged, success, repository |
| `GitBranchDeletedIcon` | `@mdevs/icons/development/git-branch-deleted` | [git-branch-deleted.svg](../../svg/development/git-branch-deleted.svg) | [TSX](../../src/icons/development/git-branch-deleted.tsx) | tabler | code, version control, command, git, branch, deleted, versioning, repository, tracking, revision |
| `GitBranchMinusIcon` | `@mdevs/icons/development/git-branch-minus` | [git-branch-minus.svg](../../svg/development/git-branch-minus.svg) | [TSX](../../src/icons/development/git-branch-minus.tsx) | lucide | code, version control, vcs, repository, delete, remove, - |
| `GitBranchPlusIcon` | `@mdevs/icons/development/git-branch-plus` | [git-branch-plus.svg](../../svg/development/git-branch-plus.svg) | [TSX](../../src/icons/development/git-branch-plus.tsx) | lucide | code, version control, vcs, repository, add, create, + |
| `GitBranchXIcon` | `@mdevs/icons/development/git-branch-x` | [git-branch-x.svg](../../svg/development/git-branch-x.svg) | [TSX](../../src/icons/development/git-branch-x.tsx) | tabler | code, version control, git, branch, delete, remove, cancel, close, reject, repository |
| `GitCherryPickIcon` | `@mdevs/icons/development/git-cherry-pick` | [git-cherry-pick.svg](../../svg/development/git-cherry-pick.svg) | [TSX](../../src/icons/development/git-cherry-pick.tsx) | tabler | code, version control, command, git, cherry, pick, versioning, repository, tracking, revision |
| `GitCommitIcon` | `@mdevs/icons/development/git-commit` | [git-commit.svg](../../svg/development/git-commit.svg) | [TSX](../../src/icons/development/git-commit.tsx) | tabler | code, version control, command, git, commit, versioning, repository, tracking, revision |
| `GitCommitHorizontalIcon` | `@mdevs/icons/development/git-commit-horizontal` | [git-commit-horizontal.svg](../../svg/development/git-commit-horizontal.svg) | [TSX](../../src/icons/development/git-commit-horizontal.tsx) | lucide | code, version control, waypoint, stop, station |
| `GitCommitVerticalIcon` | `@mdevs/icons/development/git-commit-vertical` | [git-commit-vertical.svg](../../svg/development/git-commit-vertical.svg) | [TSX](../../src/icons/development/git-commit-vertical.tsx) | lucide | code, version control, waypoint, stop, station |
| `GitCompareIcon` | `@mdevs/icons/development/git-compare` | [git-compare.svg](../../svg/development/git-compare.svg) | [TSX](../../src/icons/development/git-compare.tsx) | lucide | code, version control, diff |
| `GitCompareArrowsIcon` | `@mdevs/icons/development/git-compare-arrows` | [git-compare-arrows.svg](../../svg/development/git-compare-arrows.svg) | [TSX](../../src/icons/development/git-compare-arrows.tsx) | lucide | code, version control, diff |
| `GitForkIcon` | `@mdevs/icons/development/git-fork` | [git-fork.svg](../../svg/development/git-fork.svg) | [TSX](../../src/icons/development/git-fork.tsx) | lucide | code, version control |
| `GitGraphIcon` | `@mdevs/icons/development/git-graph` | [git-graph.svg](../../svg/development/git-graph.svg) | [TSX](../../src/icons/development/git-graph.tsx) | lucide | code, version control, commit graph, commits, gitlens |
| `GitMergeIcon` | `@mdevs/icons/development/git-merge` | [git-merge.svg](../../svg/development/git-merge.svg) | [TSX](../../src/icons/development/git-merge.tsx) | lucide | code, version control |
| `GitMergeConflictIcon` | `@mdevs/icons/development/git-merge-conflict` | [git-merge-conflict.svg](../../svg/development/git-merge-conflict.svg) | [TSX](../../src/icons/development/git-merge-conflict.tsx) | lucide | code, version control, commits, diff, error, conflict |
| `GitMergeQueueIcon` | `@mdevs/icons/development/git-merge-queue` | [git-merge-queue.svg](../../svg/development/git-merge-queue.svg) | [TSX](../../src/icons/development/git-merge-queue.tsx) | tabler | code, version control, git, merge, queue, pipeline, ci, automation, list, repository |
| `GitPullRequestIcon` | `@mdevs/icons/development/git-pull-request` | [git-pull-request.svg](../../svg/development/git-pull-request.svg) | [TSX](../../src/icons/development/git-pull-request.tsx) | lucide | code, version control, open |
| `GitPullRequestArrowIcon` | `@mdevs/icons/development/git-pull-request-arrow` | [git-pull-request-arrow.svg](../../svg/development/git-pull-request-arrow.svg) | [TSX](../../src/icons/development/git-pull-request-arrow.tsx) | lucide | code, version control, open |
| `GitPullRequestClosedIcon` | `@mdevs/icons/development/git-pull-request-closed` | [git-pull-request-closed.svg](../../svg/development/git-pull-request-closed.svg) | [TSX](../../src/icons/development/git-pull-request-closed.tsx) | lucide | code, version control, rejected, closed, cancelled, x |
| `GitPullRequestConflictIcon` | `@mdevs/icons/development/git-pull-request-conflict` | [git-pull-request-conflict.svg](../../svg/development/git-pull-request-conflict.svg) | [TSX](../../src/icons/development/git-pull-request-conflict.tsx) | tabler | git, pull request, conflict, merge, code, repository, version control, branch, rebase, versioning |
| `GitPullRequestCreateIcon` | `@mdevs/icons/development/git-pull-request-create` | [git-pull-request-create.svg](../../svg/development/git-pull-request-create.svg) | [TSX](../../src/icons/development/git-pull-request-create.tsx) | lucide | code, version control, open, plus, add, + |
| `GitPullRequestCreateArrowIcon` | `@mdevs/icons/development/git-pull-request-create-arrow` | [git-pull-request-create-arrow.svg](../../svg/development/git-pull-request-create-arrow.svg) | [TSX](../../src/icons/development/git-pull-request-create-arrow.tsx) | lucide | code, version control, open, plus, add, + |
| `GitPullRequestDraftIcon` | `@mdevs/icons/development/git-pull-request-draft` | [git-pull-request-draft.svg](../../svg/development/git-pull-request-draft.svg) | [TSX](../../src/icons/development/git-pull-request-draft.tsx) | lucide | code, version control, open, draft, dashed |
| `GitPullRequestLockedIcon` | `@mdevs/icons/development/git-pull-request-locked` | [git-pull-request-locked.svg](../../svg/development/git-pull-request-locked.svg) | [TSX](../../src/icons/development/git-pull-request-locked.tsx) | tabler | code, version control, git, pull, request, locked, lock, secure, protected, repository |
| `GitPullRequestUnlistedIcon` | `@mdevs/icons/development/git-pull-request-unlisted` | [git-pull-request-unlisted.svg](../../svg/development/git-pull-request-unlisted.svg) | [TSX](../../src/icons/development/git-pull-request-unlisted.tsx) | tabler | code, version control, git, pull, request, unlisted, hidden, private, draft, repository |
| `PackageIcon` | `@mdevs/icons/development/package` | [package.svg](../../svg/development/package.svg) | [TSX](../../src/icons/development/package.tsx) | lucide | box, container, storage, sealed, delivery, undelivered, unopened, packed, archive, zip, module |
| `Package2Icon` | `@mdevs/icons/development/package-2` | [package-2.svg](../../svg/development/package-2.svg) | [TSX](../../src/icons/development/package-2.tsx) | lucide | box, container, storage, sealed, packed, unopened, undelivered, archive, zip |
| `PackageCheckIcon` | `@mdevs/icons/development/package-check` | [package-check.svg](../../svg/development/package-check.svg) | [TSX](../../src/icons/development/package-check.tsx) | lucide | confirm, verified, done, todo, tick, complete, task, delivered |
| `PackageMinusIcon` | `@mdevs/icons/development/package-minus` | [package-minus.svg](../../svg/development/package-minus.svg) | [TSX](../../src/icons/development/package-minus.tsx) | lucide | delete, remove |
| `PackageOpenIcon` | `@mdevs/icons/development/package-open` | [package-open.svg](../../svg/development/package-open.svg) | [TSX](../../src/icons/development/package-open.tsx) | lucide | box, container, storage, unpack, unarchive, unzip, opened, delivered |
| `PackagePlusIcon` | `@mdevs/icons/development/package-plus` | [package-plus.svg](../../svg/development/package-plus.svg) | [TSX](../../src/icons/development/package-plus.tsx) | lucide | new, add, create |
| `PackageSearchIcon` | `@mdevs/icons/development/package-search` | [package-search.svg](../../svg/development/package-search.svg) | [TSX](../../src/icons/development/package-search.tsx) | lucide | find, product process, lens |
| `PackageXIcon` | `@mdevs/icons/development/package-x` | [package-x.svg](../../svg/development/package-x.svg) | [TSX](../../src/icons/development/package-x.tsx) | lucide | delete, remove |
| `RegexIcon` | `@mdevs/icons/development/regex` | [regex.svg](../../svg/development/regex.svg) | [TSX](../../src/icons/development/regex.tsx) | lucide | search, text, code |
| `TerminalIcon` | `@mdevs/icons/development/terminal` | [terminal.svg](../../svg/development/terminal.svg) | [TSX](../../src/icons/development/terminal.tsx) | lucide | code, command line, prompt, shell |
| `WebhookIcon` | `@mdevs/icons/development/webhook` | [webhook.svg](../../svg/development/webhook.svg) | [TSX](../../src/icons/development/webhook.tsx) | lucide | push api, interface, callback |
| `WebhookOffIcon` | `@mdevs/icons/development/webhook-off` | [webhook-off.svg](../../svg/development/webhook-off.svg) | [TSX](../../src/icons/development/webhook-off.tsx) | lucide | push api, interface, callback |

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
