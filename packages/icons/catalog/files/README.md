# Fichiers et dossiers — icônes

137 icônes de la catégorie `files`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (132), tabler (5). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {ArchiveIcon} from '@mdevs/icons';
// Alternatives :
import {ArchiveIcon} from '@mdevs/icons/files';
import {ArchiveIcon} from '@mdevs/icons/files/archive';
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
import {ArchiveIcon} from '@mdevs/icons/files/archive';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><ArchiveIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <ArchiveIcon size={32} title="Fichiers et dossiers" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `ArchiveIcon` | `@mdevs/icons/files/archive` | [archive.svg](../../svg/files/archive.svg) | [TSX](../../src/icons/files/archive.tsx) | lucide | index, backup, box, storage, records |
| `ArchiveOffIcon` | `@mdevs/icons/files/archive-off` | [archive-off.svg](../../svg/files/archive-off.svg) | [TSX](../../src/icons/files/archive-off.tsx) | tabler | box, index, records, old, collect, archive, off, disabled, inactive, file |
| `ArchiveRestoreIcon` | `@mdevs/icons/files/archive-restore` | [archive-restore.svg](../../svg/files/archive-restore.svg) | [TSX](../../src/icons/files/archive-restore.tsx) | lucide | unarchive, index, backup, box, storage, records |
| `ArchiveXIcon` | `@mdevs/icons/files/archive-x` | [archive-x.svg](../../svg/files/archive-x.svg) | [TSX](../../src/icons/files/archive-x.tsx) | lucide | index, backup, box, storage, records, junk |
| `BookIcon` | `@mdevs/icons/files/book` | [book.svg](../../svg/files/book.svg) | [TSX](../../src/icons/files/book.tsx) | lucide | reading, paperback, booklet, magazine, leaflet, pamphlet, tome, library, writing, written, writer, author, story, script, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, documentation |
| `Book2Icon` | `@mdevs/icons/files/book-2` | [book-2.svg](../../svg/files/book-2.svg) | [TSX](../../src/icons/files/book-2.tsx) | tabler | read, dictionary, magazine, library, booklet, novel, book, file, paper, text |
| `BookAIcon` | `@mdevs/icons/files/book-a` | [book-a.svg](../../svg/files/book-a.svg) | [TSX](../../src/icons/files/book-a.tsx) | lucide | dictionary, define, definition, thesaurus, encyclopedia, encyclopaedia, reading, booklet, magazine, leaflet, pamphlet, tome, library, writing, written, writer, author, story, script, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, language, translate, alphabetical, a-z, ordered |
| `BookAlertIcon` | `@mdevs/icons/files/book-alert` | [book-alert.svg](../../svg/files/book-alert.svg) | [TSX](../../src/icons/files/book-alert.tsx) | lucide | reading, paperback, booklet, magazine, leaflet, pamphlet, tome, library, writing, written, writer, author, story, script, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, documentation, warning, alert, danger, exclamation mark |
| `BookAudioIcon` | `@mdevs/icons/files/book-audio` | [book-audio.svg](../../svg/files/book-audio.svg) | [TSX](../../src/icons/files/book-audio.tsx) | lucide | audiobook, reading, listening, sound, story, fiction, novel, information, knowledge, education, student, study, learning, research |
| `BookBookmarkIcon` | `@mdevs/icons/files/book-bookmark` | [book-bookmark.svg](../../svg/files/book-bookmark.svg) | [TSX](../../src/icons/files/book-bookmark.tsx) | lucide | dictionary, reading, booklet, magazine, leaflet, pamphlet, tome, library, writing, written, writer, author, story, script, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, documentation, saved, later, future, reference, index, code, coding, version control, git, repository |
| `BookCheckIcon` | `@mdevs/icons/files/book-check` | [book-check.svg](../../svg/files/book-check.svg) | [TSX](../../src/icons/files/book-check.tsx) | lucide | read, booklet, magazine, leaflet, pamphlet, library, written, authored, published, informed, knowledgeable, educated, schooled, homework, examined, tested, marked, passed, graduated, studied, learned, lesson, researched, documented, revealed, blank, plain language, true, truth, verified, corrected, task, todo, done, completed, finished, ticked |
| `BookCopyIcon` | `@mdevs/icons/files/book-copy` | [book-copy.svg](../../svg/files/book-copy.svg) | [TSX](../../src/icons/files/book-copy.tsx) | lucide | code, coding, version control, git, repository, clone, fork, duplicate, multiple, books, library, copies, copied, plagiarism, plagiarised, plagiarized, reading list, information, informed, knowledge, knowledgeable, knowledgable, education, high school, university, college, academy, student, study, learning, research, smart, intelligent, intellectual |
| `BookDashedIcon` | `@mdevs/icons/files/book-dashed` | [book-dashed.svg](../../svg/files/book-dashed.svg) | [TSX](../../src/icons/files/book-dashed.tsx) | lucide | code, coding, version control, git, repository, template, draft, script, screenplay, writing, writer, author, unwritten, unpublished, untold |
| `BookDownIcon` | `@mdevs/icons/files/book-down` | [book-down.svg](../../svg/files/book-down.svg) | [TSX](../../src/icons/files/book-down.tsx) | lucide | code, coding, version control, git, repository, pull |
| `BookDownloadIcon` | `@mdevs/icons/files/book-download` | [book-download.svg](../../svg/files/book-download.svg) | [TSX](../../src/icons/files/book-download.tsx) | tabler | education, e-book, digital, book, download, file, paper, text, record, information |
| `BookHeadphonesIcon` | `@mdevs/icons/files/book-headphones` | [book-headphones.svg](../../svg/files/book-headphones.svg) | [TSX](../../src/icons/files/book-headphones.tsx) | lucide | audiobook, reading, listening, sound, story, fiction, novel, information, knowledge, education, student, study, learning, research |
| `BookHeartIcon` | `@mdevs/icons/files/book-heart` | [book-heart.svg](../../svg/files/book-heart.svg) | [TSX](../../src/icons/files/book-heart.tsx) | lucide | diary, romance, novel, journal, entry, entries, personal, private, secret, crush, like, love, emotion, feminine, girls, teens, teenager, therapy, therapeutic, therapist, planner, organizer, organiser, notes, notepad, stationery, sketchbook, writing, written, reading, favorite, favourite, high school |
| `BookImageIcon` | `@mdevs/icons/files/book-image` | [book-image.svg](../../svg/files/book-image.svg) | [TSX](../../src/icons/files/book-image.tsx) | lucide | images, pictures, photos, album, collection, event, magazine, catalog, catalogue, brochure, browse, gallery |
| `BookKeyIcon` | `@mdevs/icons/files/book-key` | [book-key.svg](../../svg/files/book-key.svg) | [TSX](../../src/icons/files/book-key.tsx) | lucide | code, coding, version control, git, repository, private, public, secret, unlocked, hidden, revealed, knowledge, learning |
| `BookLockIcon` | `@mdevs/icons/files/book-lock` | [book-lock.svg](../../svg/files/book-lock.svg) | [TSX](../../src/icons/files/book-lock.tsx) | lucide | code, coding, version control, git, repository, private, secret, hidden, knowledge |
| `BookMinusIcon` | `@mdevs/icons/files/book-minus` | [book-minus.svg](../../svg/files/book-minus.svg) | [TSX](../../src/icons/files/book-minus.tsx) | lucide | code, coding, version control, git, repository, remove, delete, censor, cancel, forbid, prohibit, ban, uneducated, re-educate, unlearn, downgrade |
| `BookOffIcon` | `@mdevs/icons/files/book-off` | [book-off.svg](../../svg/files/book-off.svg) | [TSX](../../src/icons/files/book-off.tsx) | tabler | read, dictionary, magazine, library, booklet, novel, book, off, disabled, inactive |
| `BookOpenIcon` | `@mdevs/icons/files/book-open` | [book-open.svg](../../svg/files/book-open.svg) | [TSX](../../src/icons/files/book-open.tsx) | lucide | reading, pages, booklet, magazine, leaflet, pamphlet, library, writing, written, writer, author, story, script, screenplay, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, documentation, revealed, blank, plain |
| `BookOpenCheckIcon` | `@mdevs/icons/files/book-open-check` | [book-open-check.svg](../../svg/files/book-open-check.svg) | [TSX](../../src/icons/files/book-open-check.tsx) | lucide | read, pages, booklet, magazine, leaflet, pamphlet, library, written, authored, published, informed, knowledgeable, educated, schooled, homework, examined, tested, marked, passed, graduated, studied, learned, lesson, researched, documented, revealed, blank, plain language, true, truth, verified, corrected, task, todo, done, completed, finished, ticked |
| `BookOpenTextIcon` | `@mdevs/icons/files/book-open-text` | [book-open-text.svg](../../svg/files/book-open-text.svg) | [TSX](../../src/icons/files/book-open-text.tsx) | lucide | reading, pages, booklet, magazine, leaflet, pamphlet, library, writing, written, writer, author, story, script, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, documentation, revealed |
| `BookPlusIcon` | `@mdevs/icons/files/book-plus` | [book-plus.svg](../../svg/files/book-plus.svg) | [TSX](../../src/icons/files/book-plus.tsx) | lucide | code, coding, version control, git, repository, remove, delete, read, write, author, publish, inform, graduate, re-educate, study, learn, research, knowledge, improve, upgrade, level up |
| `BookSearchIcon` | `@mdevs/icons/files/book-search` | [book-search.svg](../../svg/files/book-search.svg) | [TSX](../../src/icons/files/book-search.tsx) | lucide | reading, library, study, education, research, knowledge, discover, browsing, lookup, finding, scanning |
| `BookTextIcon` | `@mdevs/icons/files/book-text` | [book-text.svg](../../svg/files/book-text.svg) | [TSX](../../src/icons/files/book-text.tsx) | lucide | reading, booklet, magazine, leaflet, pamphlet, tome, library, writing, written, writer, author, story, script, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, documentation |
| `BookTypeIcon` | `@mdevs/icons/files/book-type` | [book-type.svg](../../svg/files/book-type.svg) | [TSX](../../src/icons/files/book-type.tsx) | lucide | thesaurus, synonym, reading, booklet, magazine, leaflet, pamphlet, tome, library, writing, written, writer, author, story, script, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, language, translate, typography, fonts, collection |
| `BookUpIcon` | `@mdevs/icons/files/book-up` | [book-up.svg](../../svg/files/book-up.svg) | [TSX](../../src/icons/files/book-up.tsx) | lucide | code, coding, version control, git, repository, push |
| `BookUp2Icon` | `@mdevs/icons/files/book-up-2` | [book-up-2.svg](../../svg/files/book-up-2.svg) | [TSX](../../src/icons/files/book-up-2.tsx) | lucide | code, coding, version control, git, repository, push, force |
| `BookUploadIcon` | `@mdevs/icons/files/book-upload` | [book-upload.svg](../../svg/files/book-upload.svg) | [TSX](../../src/icons/files/book-upload.tsx) | tabler | e-book, e-learning, education, reading, book, upload, import, transfer, send, publish |
| `BookUserIcon` | `@mdevs/icons/files/book-user` | [book-user.svg](../../svg/files/book-user.svg) | [TSX](../../src/icons/files/book-user.tsx) | lucide | person, people, family, friends, acquaintances, contacts, details, addresses, phone numbers, directory, listing, networking |
| `BookXIcon` | `@mdevs/icons/files/book-x` | [book-x.svg](../../svg/files/book-x.svg) | [TSX](../../src/icons/files/book-x.tsx) | lucide | code, coding, version control, git, repository, remove, delete, reading, misinformation, disinformation, misinformed, charlatan, sophistry, false, lies, untruth, propaganda, censored, cancelled, forbidden, prohibited, banned, uneducated, re-education, unlearn |
| `ClipboardIcon` | `@mdevs/icons/files/clipboard` | [clipboard.svg](../../svg/files/clipboard.svg) | [TSX](../../src/icons/files/clipboard.tsx) | lucide | copy, paste |
| `ClipboardCheckIcon` | `@mdevs/icons/files/clipboard-check` | [clipboard-check.svg](../../svg/files/clipboard-check.svg) | [TSX](../../src/icons/files/clipboard-check.tsx) | lucide | copied, pasted, done, todo, tick, complete, task |
| `ClipboardClockIcon` | `@mdevs/icons/files/clipboard-clock` | [clipboard-clock.svg](../../svg/files/clipboard-clock.svg) | [TSX](../../src/icons/files/clipboard-clock.tsx) | lucide | copy, paste, history, log, clock, time, watch, alarm, hour, minute, reminder, scheduled, deadline, pending, time tracking, timesheets, appointment, logbook |
| `ClipboardCopyIcon` | `@mdevs/icons/files/clipboard-copy` | [clipboard-copy.svg](../../svg/files/clipboard-copy.svg) | [TSX](../../src/icons/files/clipboard-copy.tsx) | lucide | copy, paste |
| `ClipboardEditIcon` | `@mdevs/icons/files/clipboard-edit` | [clipboard-edit.svg](../../svg/files/clipboard-edit.svg) | [TSX](../../src/icons/files/clipboard-edit.tsx) | lucide | — |
| `ClipboardListIcon` | `@mdevs/icons/files/clipboard-list` | [clipboard-list.svg](../../svg/files/clipboard-list.svg) | [TSX](../../src/icons/files/clipboard-list.tsx) | lucide | copy, paste, tasks |
| `ClipboardMinusIcon` | `@mdevs/icons/files/clipboard-minus` | [clipboard-minus.svg](../../svg/files/clipboard-minus.svg) | [TSX](../../src/icons/files/clipboard-minus.tsx) | lucide | copy, delete, remove, erase, document, medical, report, doctor |
| `ClipboardPasteIcon` | `@mdevs/icons/files/clipboard-paste` | [clipboard-paste.svg](../../svg/files/clipboard-paste.svg) | [TSX](../../src/icons/files/clipboard-paste.tsx) | lucide | copy, paste |
| `ClipboardPenLineIcon` | `@mdevs/icons/files/clipboard-pen-line` | [clipboard-pen-line.svg](../../svg/files/clipboard-pen-line.svg) | [TSX](../../src/icons/files/clipboard-pen-line.tsx) | lucide | paste |
| `ClipboardPlusIcon` | `@mdevs/icons/files/clipboard-plus` | [clipboard-plus.svg](../../svg/files/clipboard-plus.svg) | [TSX](../../src/icons/files/clipboard-plus.tsx) | lucide | copy, paste, add, create, new, document, medical, report, doctor |
| `ClipboardTypeIcon` | `@mdevs/icons/files/clipboard-type` | [clipboard-type.svg](../../svg/files/clipboard-type.svg) | [TSX](../../src/icons/files/clipboard-type.tsx) | lucide | paste, format, text |
| `ClipboardXIcon` | `@mdevs/icons/files/clipboard-x` | [clipboard-x.svg](../../svg/files/clipboard-x.svg) | [TSX](../../src/icons/files/clipboard-x.tsx) | lucide | copy, paste, discard, remove |
| `FileIcon` | `@mdevs/icons/files/file` | [file.svg](../../svg/files/file.svg) | [TSX](../../src/icons/files/file.tsx) | lucide | document |
| `FileArchiveIcon` | `@mdevs/icons/files/file-archive` | [file-archive.svg](../../svg/files/file-archive.svg) | [TSX](../../src/icons/files/file-archive.tsx) | lucide | zip, package, archive |
| `FileAudio2Icon` | `@mdevs/icons/files/file-audio-2` | [file-audio-2.svg](../../svg/files/file-audio-2.svg) | [TSX](../../src/icons/files/file-audio-2.tsx) | lucide | — |
| `FileAxis3DIcon` | `@mdevs/icons/files/file-axis-3-d` | [file-axis-3-d.svg](../../svg/files/file-axis-3-d.svg) | [TSX](../../src/icons/files/file-axis-3-d.tsx) | lucide | — |
| `FileBadge2Icon` | `@mdevs/icons/files/file-badge-2` | [file-badge-2.svg](../../svg/files/file-badge-2.svg) | [TSX](../../src/icons/files/file-badge-2.tsx) | lucide | — |
| `FileBarChartIcon` | `@mdevs/icons/files/file-bar-chart` | [file-bar-chart.svg](../../svg/files/file-bar-chart.svg) | [TSX](../../src/icons/files/file-bar-chart.tsx) | lucide | — |
| `FileBarChart2Icon` | `@mdevs/icons/files/file-bar-chart-2` | [file-bar-chart-2.svg](../../svg/files/file-bar-chart-2.svg) | [TSX](../../src/icons/files/file-bar-chart-2.tsx) | lucide | — |
| `FileBoxIcon` | `@mdevs/icons/files/file-box` | [file-box.svg](../../svg/files/file-box.svg) | [TSX](../../src/icons/files/file-box.tsx) | lucide | document, page, sheet, cube, box, 3d, model, asset, object, geometry, mesh, ar, augmented reality, cad, design, blueprint, draft, package, scene |
| `FileBracesIcon` | `@mdevs/icons/files/file-braces` | [file-braces.svg](../../svg/files/file-braces.svg) | [TSX](../../src/icons/files/file-braces.tsx) | lucide | code, json, curly braces, curly brackets |
| `FileBracesCornerIcon` | `@mdevs/icons/files/file-braces-corner` | [file-braces-corner.svg](../../svg/files/file-braces-corner.svg) | [TSX](../../src/icons/files/file-braces-corner.tsx) | lucide | code, json, curly braces, curly brackets |
| `FileChartLineIcon` | `@mdevs/icons/files/file-chart-line` | [file-chart-line.svg](../../svg/files/file-chart-line.svg) | [TSX](../../src/icons/files/file-chart-line.tsx) | lucide | statistics, analytics, diagram, graph, presentation |
| `FileChartPieIcon` | `@mdevs/icons/files/file-chart-pie` | [file-chart-pie.svg](../../svg/files/file-chart-pie.svg) | [TSX](../../src/icons/files/file-chart-pie.tsx) | lucide | statistics, analytics, diagram, graph, presentation |
| `FileCheckIcon` | `@mdevs/icons/files/file-check` | [file-check.svg](../../svg/files/file-check.svg) | [TSX](../../src/icons/files/file-check.tsx) | lucide | done, document, todo, tick, complete, task |
| `FileCheck2Icon` | `@mdevs/icons/files/file-check-2` | [file-check-2.svg](../../svg/files/file-check-2.svg) | [TSX](../../src/icons/files/file-check-2.tsx) | lucide | — |
| `FileClockIcon` | `@mdevs/icons/files/file-clock` | [file-clock.svg](../../svg/files/file-clock.svg) | [TSX](../../src/icons/files/file-clock.tsx) | lucide | history, log, clock |
| `FileCodeIcon` | `@mdevs/icons/files/file-code` | [file-code.svg](../../svg/files/file-code.svg) | [TSX](../../src/icons/files/file-code.tsx) | lucide | script, document, gist, html, xml, property list, plist |
| `FileCode2Icon` | `@mdevs/icons/files/file-code-2` | [file-code-2.svg](../../svg/files/file-code-2.svg) | [TSX](../../src/icons/files/file-code-2.tsx) | lucide | — |
| `FileCog2Icon` | `@mdevs/icons/files/file-cog-2` | [file-cog-2.svg](../../svg/files/file-cog-2.svg) | [TSX](../../src/icons/files/file-cog-2.tsx) | lucide | — |
| `FileDiffIcon` | `@mdevs/icons/files/file-diff` | [file-diff.svg](../../svg/files/file-diff.svg) | [TSX](../../src/icons/files/file-diff.tsx) | lucide | diff, patch |
| `FileDigitIcon` | `@mdevs/icons/files/file-digit` | [file-digit.svg](../../svg/files/file-digit.svg) | [TSX](../../src/icons/files/file-digit.tsx) | lucide | number, document |
| `FileDownIcon` | `@mdevs/icons/files/file-down` | [file-down.svg](../../svg/files/file-down.svg) | [TSX](../../src/icons/files/file-down.tsx) | lucide | download, import, export |
| `FileEditIcon` | `@mdevs/icons/files/file-edit` | [file-edit.svg](../../svg/files/file-edit.svg) | [TSX](../../src/icons/files/file-edit.tsx) | lucide | — |
| `FileExclamationPointIcon` | `@mdevs/icons/files/file-exclamation-point` | [file-exclamation-point.svg](../../svg/files/file-exclamation-point.svg) | [TSX](../../src/icons/files/file-exclamation-point.tsx) | lucide | hidden, warning, alert, danger, protected, exclamation mark |
| `FileHeartIcon` | `@mdevs/icons/files/file-heart` | [file-heart.svg](../../svg/files/file-heart.svg) | [TSX](../../src/icons/files/file-heart.tsx) | lucide | heart, favourite, bookmark, quick link |
| `FileImageIcon` | `@mdevs/icons/files/file-image` | [file-image.svg](../../svg/files/file-image.svg) | [TSX](../../src/icons/files/file-image.tsx) | lucide | image, graphics, photo, picture |
| `FileInputIcon` | `@mdevs/icons/files/file-input` | [file-input.svg](../../svg/files/file-input.svg) | [TSX](../../src/icons/files/file-input.tsx) | lucide | document |
| `FileKey2Icon` | `@mdevs/icons/files/file-key-2` | [file-key-2.svg](../../svg/files/file-key-2.svg) | [TSX](../../src/icons/files/file-key-2.tsx) | lucide | — |
| `FileLock2Icon` | `@mdevs/icons/files/file-lock-2` | [file-lock-2.svg](../../svg/files/file-lock-2.svg) | [TSX](../../src/icons/files/file-lock-2.tsx) | lucide | — |
| `FileMinusIcon` | `@mdevs/icons/files/file-minus` | [file-minus.svg](../../svg/files/file-minus.svg) | [TSX](../../src/icons/files/file-minus.tsx) | lucide | delete, remove, erase, document |
| `FileMinus2Icon` | `@mdevs/icons/files/file-minus-2` | [file-minus-2.svg](../../svg/files/file-minus-2.svg) | [TSX](../../src/icons/files/file-minus-2.tsx) | lucide | — |
| `FileMusicIcon` | `@mdevs/icons/files/file-music` | [file-music.svg](../../svg/files/file-music.svg) | [TSX](../../src/icons/files/file-music.tsx) | lucide | audio, sound, noise, track, digital, recording, playback, piano, keyboard, keys, notes, chord, midi, octave |
| `FileOutputIcon` | `@mdevs/icons/files/file-output` | [file-output.svg](../../svg/files/file-output.svg) | [TSX](../../src/icons/files/file-output.tsx) | lucide | document |
| `FilePenLineIcon` | `@mdevs/icons/files/file-pen-line` | [file-pen-line.svg](../../svg/files/file-pen-line.svg) | [TSX](../../src/icons/files/file-pen-line.tsx) | lucide | edit |
| `FilePlayIcon` | `@mdevs/icons/files/file-play` | [file-play.svg](../../svg/files/file-play.svg) | [TSX](../../src/icons/files/file-play.tsx) | lucide | movie, video, film |
| `FilePlusIcon` | `@mdevs/icons/files/file-plus` | [file-plus.svg](../../svg/files/file-plus.svg) | [TSX](../../src/icons/files/file-plus.tsx) | lucide | add, create, new, document |
| `FilePlus2Icon` | `@mdevs/icons/files/file-plus-2` | [file-plus-2.svg](../../svg/files/file-plus-2.svg) | [TSX](../../src/icons/files/file-plus-2.tsx) | lucide | — |
| `FileQuestionMarkIcon` | `@mdevs/icons/files/file-question-mark` | [file-question-mark.svg](../../svg/files/file-question-mark.svg) | [TSX](../../src/icons/files/file-question-mark.tsx) | lucide | readme, help, question |
| `FileScanIcon` | `@mdevs/icons/files/file-scan` | [file-scan.svg](../../svg/files/file-scan.svg) | [TSX](../../src/icons/files/file-scan.tsx) | lucide | scan, code, qr-code |
| `FileSearchIcon` | `@mdevs/icons/files/file-search` | [file-search.svg](../../svg/files/file-search.svg) | [TSX](../../src/icons/files/file-search.tsx) | lucide | lost, document, find, browser, lens |
| `FileSearch2Icon` | `@mdevs/icons/files/file-search-2` | [file-search-2.svg](../../svg/files/file-search-2.svg) | [TSX](../../src/icons/files/file-search-2.tsx) | lucide | — |
| `FileSignalIcon` | `@mdevs/icons/files/file-signal` | [file-signal.svg](../../svg/files/file-signal.svg) | [TSX](../../src/icons/files/file-signal.tsx) | lucide | audio, music, volume |
| `FileSlidersIcon` | `@mdevs/icons/files/file-sliders` | [file-sliders.svg](../../svg/files/file-sliders.svg) | [TSX](../../src/icons/files/file-sliders.tsx) | lucide | cogged, gear, mechanical, machinery, configuration, controls, preferences, settings, system, admin, edit, executable |
| `FileSpreadsheetIcon` | `@mdevs/icons/files/file-spreadsheet` | [file-spreadsheet.svg](../../svg/files/file-spreadsheet.svg) | [TSX](../../src/icons/files/file-spreadsheet.tsx) | lucide | spreadsheet, sheet, table |
| `FileStackIcon` | `@mdevs/icons/files/file-stack` | [file-stack.svg](../../svg/files/file-stack.svg) | [TSX](../../src/icons/files/file-stack.tsx) | lucide | versions, multiple, copy, documents, revisions, version control, history |
| `FileSymlinkIcon` | `@mdevs/icons/files/file-symlink` | [file-symlink.svg](../../svg/files/file-symlink.svg) | [TSX](../../src/icons/files/file-symlink.tsx) | lucide | symlink, symbolic, link |
| `FileTerminalIcon` | `@mdevs/icons/files/file-terminal` | [file-terminal.svg](../../svg/files/file-terminal.svg) | [TSX](../../src/icons/files/file-terminal.tsx) | lucide | terminal, bash, script, executable |
| `FileTextIcon` | `@mdevs/icons/files/file-text` | [file-text.svg](../../svg/files/file-text.svg) | [TSX](../../src/icons/files/file-text.tsx) | lucide | data, txt, pdf, document |
| `FileTypeIcon` | `@mdevs/icons/files/file-type` | [file-type.svg](../../svg/files/file-type.svg) | [TSX](../../src/icons/files/file-type.tsx) | lucide | font, text, typography, type |
| `FileType2Icon` | `@mdevs/icons/files/file-type-2` | [file-type-2.svg](../../svg/files/file-type-2.svg) | [TSX](../../src/icons/files/file-type-2.tsx) | lucide | — |
| `FileUpIcon` | `@mdevs/icons/files/file-up` | [file-up.svg](../../svg/files/file-up.svg) | [TSX](../../src/icons/files/file-up.tsx) | lucide | upload, import, export |
| `FileUserIcon` | `@mdevs/icons/files/file-user` | [file-user.svg](../../svg/files/file-user.svg) | [TSX](../../src/icons/files/file-user.tsx) | lucide | person, personal information, people, listing, networking, document, contact, cover letter, resume, cv, curriculum vitae, application form |
| `FileVideo2Icon` | `@mdevs/icons/files/file-video-2` | [file-video-2.svg](../../svg/files/file-video-2.svg) | [TSX](../../src/icons/files/file-video-2.tsx) | lucide | — |
| `FileVolumeIcon` | `@mdevs/icons/files/file-volume` | [file-volume.svg](../../svg/files/file-volume.svg) | [TSX](../../src/icons/files/file-volume.tsx) | lucide | audio, music, volume |
| `FileXIcon` | `@mdevs/icons/files/file-x` | [file-x.svg](../../svg/files/file-x.svg) | [TSX](../../src/icons/files/file-x.tsx) | lucide | lost, delete, remove, document |
| `FileX2Icon` | `@mdevs/icons/files/file-x-2` | [file-x-2.svg](../../svg/files/file-x-2.svg) | [TSX](../../src/icons/files/file-x-2.tsx) | lucide | — |
| `FolderIcon` | `@mdevs/icons/files/folder` | [folder.svg](../../svg/files/folder.svg) | [TSX](../../src/icons/files/folder.tsx) | lucide | directory |
| `FolderArchiveIcon` | `@mdevs/icons/files/folder-archive` | [folder-archive.svg](../../svg/files/folder-archive.svg) | [TSX](../../src/icons/files/folder-archive.tsx) | lucide | archive, zip, package |
| `FolderBookmarkIcon` | `@mdevs/icons/files/folder-bookmark` | [folder-bookmark.svg](../../svg/files/folder-bookmark.svg) | [TSX](../../src/icons/files/folder-bookmark.tsx) | lucide | folder, bookmark, file, mark, storage, archive, directory, project, favorite, save, read later |
| `FolderCheckIcon` | `@mdevs/icons/files/folder-check` | [folder-check.svg](../../svg/files/folder-check.svg) | [TSX](../../src/icons/files/folder-check.tsx) | lucide | done, directory, todo, tick, complete, task |
| `FolderClockIcon` | `@mdevs/icons/files/folder-clock` | [folder-clock.svg](../../svg/files/folder-clock.svg) | [TSX](../../src/icons/files/folder-clock.tsx) | lucide | history, directory, clock |
| `FolderClosedIcon` | `@mdevs/icons/files/folder-closed` | [folder-closed.svg](../../svg/files/folder-closed.svg) | [TSX](../../src/icons/files/folder-closed.tsx) | lucide | directory, closed |
| `FolderCodeIcon` | `@mdevs/icons/files/folder-code` | [folder-code.svg](../../svg/files/folder-code.svg) | [TSX](../../src/icons/files/folder-code.tsx) | lucide | directory, coding, develop, software |
| `FolderCog2Icon` | `@mdevs/icons/files/folder-cog-2` | [folder-cog-2.svg](../../svg/files/folder-cog-2.svg) | [TSX](../../src/icons/files/folder-cog-2.tsx) | lucide | — |
| `FolderDotIcon` | `@mdevs/icons/files/folder-dot` | [folder-dot.svg](../../svg/files/folder-dot.svg) | [TSX](../../src/icons/files/folder-dot.tsx) | lucide | directory, root, project, pinned, active, current, cogged, gear, mechanical, machinery, configuration, controls, preferences, settings, system, admin, edit |
| `FolderDownIcon` | `@mdevs/icons/files/folder-down` | [folder-down.svg](../../svg/files/folder-down.svg) | [TSX](../../src/icons/files/folder-down.tsx) | lucide | directory, download, import, export |
| `FolderEditIcon` | `@mdevs/icons/files/folder-edit` | [folder-edit.svg](../../svg/files/folder-edit.svg) | [TSX](../../src/icons/files/folder-edit.tsx) | lucide | — |
| `FolderGitIcon` | `@mdevs/icons/files/folder-git` | [folder-git.svg](../../svg/files/folder-git.svg) | [TSX](../../src/icons/files/folder-git.tsx) | lucide | directory, root, project, git, repo |
| `FolderGit2Icon` | `@mdevs/icons/files/folder-git-2` | [folder-git-2.svg](../../svg/files/folder-git-2.svg) | [TSX](../../src/icons/files/folder-git-2.tsx) | lucide | directory, root, project, git, repo |
| `FolderHeartIcon` | `@mdevs/icons/files/folder-heart` | [folder-heart.svg](../../svg/files/folder-heart.svg) | [TSX](../../src/icons/files/folder-heart.tsx) | lucide | directory, heart, favourite, bookmark, quick link |
| `FolderInputIcon` | `@mdevs/icons/files/folder-input` | [folder-input.svg](../../svg/files/folder-input.svg) | [TSX](../../src/icons/files/folder-input.tsx) | lucide | directory, import, export |
| `FolderKanbanIcon` | `@mdevs/icons/files/folder-kanban` | [folder-kanban.svg](../../svg/files/folder-kanban.svg) | [TSX](../../src/icons/files/folder-kanban.tsx) | lucide | projects, manage, overview, board, tickets, issues, roadmap, plan, intentions, productivity, work, agile, code, coding, directory, project, root |
| `FolderKeyIcon` | `@mdevs/icons/files/folder-key` | [folder-key.svg](../../svg/files/folder-key.svg) | [TSX](../../src/icons/files/folder-key.tsx) | lucide | directory, key, private, security, protected |
| `FolderLockIcon` | `@mdevs/icons/files/folder-lock` | [folder-lock.svg](../../svg/files/folder-lock.svg) | [TSX](../../src/icons/files/folder-lock.tsx) | lucide | directory, lock, private, security, protected |
| `FolderMinusIcon` | `@mdevs/icons/files/folder-minus` | [folder-minus.svg](../../svg/files/folder-minus.svg) | [TSX](../../src/icons/files/folder-minus.tsx) | lucide | directory, remove, delete |
| `FolderOpenIcon` | `@mdevs/icons/files/folder-open` | [folder-open.svg](../../svg/files/folder-open.svg) | [TSX](../../src/icons/files/folder-open.tsx) | lucide | directory |
| `FolderOpenDotIcon` | `@mdevs/icons/files/folder-open-dot` | [folder-open-dot.svg](../../svg/files/folder-open-dot.svg) | [TSX](../../src/icons/files/folder-open-dot.tsx) | lucide | directory, root, project, active, current, pinned |
| `FolderOutputIcon` | `@mdevs/icons/files/folder-output` | [folder-output.svg](../../svg/files/folder-output.svg) | [TSX](../../src/icons/files/folder-output.tsx) | lucide | directory, import, export |
| `FolderPlusIcon` | `@mdevs/icons/files/folder-plus` | [folder-plus.svg](../../svg/files/folder-plus.svg) | [TSX](../../src/icons/files/folder-plus.tsx) | lucide | directory, add, create, new |
| `FolderRootIcon` | `@mdevs/icons/files/folder-root` | [folder-root.svg](../../svg/files/folder-root.svg) | [TSX](../../src/icons/files/folder-root.tsx) | lucide | directory, root, project, git, repo |
| `FolderSearchIcon` | `@mdevs/icons/files/folder-search` | [folder-search.svg](../../svg/files/folder-search.svg) | [TSX](../../src/icons/files/folder-search.tsx) | lucide | directory, search, find, lost, browser, lens |
| `FolderSearch2Icon` | `@mdevs/icons/files/folder-search-2` | [folder-search-2.svg](../../svg/files/folder-search-2.svg) | [TSX](../../src/icons/files/folder-search-2.tsx) | lucide | directory, search, find, lost, browser, lens |
| `FolderSymlinkIcon` | `@mdevs/icons/files/folder-symlink` | [folder-symlink.svg](../../svg/files/folder-symlink.svg) | [TSX](../../src/icons/files/folder-symlink.tsx) | lucide | directory, symlink, symbolic, link |
| `FolderSyncIcon` | `@mdevs/icons/files/folder-sync` | [folder-sync.svg](../../svg/files/folder-sync.svg) | [TSX](../../src/icons/files/folder-sync.tsx) | lucide | directory, synchronize, synchronise, refresh, reconnect, transfer, backup |
| `FolderTreeIcon` | `@mdevs/icons/files/folder-tree` | [folder-tree.svg](../../svg/files/folder-tree.svg) | [TSX](../../src/icons/files/folder-tree.tsx) | lucide | directory, tree, browser |
| `FolderUpIcon` | `@mdevs/icons/files/folder-up` | [folder-up.svg](../../svg/files/folder-up.svg) | [TSX](../../src/icons/files/folder-up.tsx) | lucide | directory, upload, import, export |
| `FolderXIcon` | `@mdevs/icons/files/folder-x` | [folder-x.svg](../../svg/files/folder-x.svg) | [TSX](../../src/icons/files/folder-x.tsx) | lucide | directory, remove, delete |
| `NotebookIcon` | `@mdevs/icons/files/notebook` | [notebook.svg](../../svg/files/notebook.svg) | [TSX](../../src/icons/files/notebook.tsx) | lucide | notepad, notes, stationery, sketchbook, moleskine, closure, strap, band, elastic, organizer, organiser, planner, diary, journal, writing, written, writer, reading, high school, university, college, academy, student, study, homework, research |
| `NotebookDotIcon` | `@mdevs/icons/files/notebook-dot` | [notebook-dot.svg](../../svg/files/notebook-dot.svg) | [TSX](../../src/icons/files/notebook-dot.tsx) | lucide | document, file, journal, page, paper, record, entry, notebook, notification, unread, note |
| `NotebookPenIcon` | `@mdevs/icons/files/notebook-pen` | [notebook-pen.svg](../../svg/files/notebook-pen.svg) | [TSX](../../src/icons/files/notebook-pen.tsx) | lucide | pencil, notepad, notes, noted, stationery, sketchbook, organizer, organiser, planner, diary, journal, writing, write, written, reading, high school, university, college, academy, student, study, research, homework, eraser, rubber |
| `NotebookTabsIcon` | `@mdevs/icons/files/notebook-tabs` | [notebook-tabs.svg](../../svg/files/notebook-tabs.svg) | [TSX](../../src/icons/files/notebook-tabs.tsx) | lucide | notepad, notes, people, family, friends, acquaintances, contacts, details, addresses, phone numbers, directory, listing, networking, alphabetical, a-z, organizer, organiser, planner, diary, stationery |
| `NotebookTextIcon` | `@mdevs/icons/files/notebook-text` | [notebook-text.svg](../../svg/files/notebook-text.svg) | [TSX](../../src/icons/files/notebook-text.tsx) | lucide | notepad, notes, pages, paper, stationery, sketchbook, organizer, organiser, planner, diary, journal, writing, write, written, reading, high school, university, college, academy, student, study, research, homework, lines, opened |

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
