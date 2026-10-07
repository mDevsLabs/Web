# Médias — icônes

71 icônes de la catégorie `media`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (42), tabler (29). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {AudioLinesIcon} from '@mdevs/icons';
// Alternatives :
import {AudioLinesIcon} from '@mdevs/icons/media';
import {AudioLinesIcon} from '@mdevs/icons/media/audio-lines';
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
import {AudioLinesIcon} from '@mdevs/icons/media/audio-lines';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><AudioLinesIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <AudioLinesIcon size={32} title="Médias" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `AudioLinesIcon` | `@mdevs/icons/media/audio-lines` | [audio-lines.svg](../../svg/media/audio-lines.svg) | [TSX](../../src/icons/media/audio-lines.tsx) | lucide | graphic equaliser, sound, noise, listen, hearing, hertz, frequency, wavelength, vibrate, sine, synthesizer, synthesiser, levels, track, music, playback, radio, broadcast, airwaves, voice, vocals, singer, song |
| `AudioLinesOffIcon` | `@mdevs/icons/media/audio-lines-off` | [audio-lines-off.svg](../../svg/media/audio-lines-off.svg) | [TSX](../../src/icons/media/audio-lines-off.tsx) | lucide | audio, sound, noise, mute, silence, off, disabled, inactive, listen, hearing, equalizer, equaliser, hertz, frequency, wavelength, vibrate, sine, waveform, synthesizer, synthesiser, levels, track, music, playback, radio, broadcast, airwaves, voice, vocals, singer, song |
| `AudioLinesXIcon` | `@mdevs/icons/media/audio-lines-x` | [audio-lines-x.svg](../../svg/media/audio-lines-x.svg) | [TSX](../../src/icons/media/audio-lines-x.tsx) | lucide | sound, noise, mute, silence, disabled, cancel, remove, unavailable, listen, hearing, equalizer, equaliser, hertz, frequency, wavelength, vibrate, sine, waveform, synthesizer, synthesiser, levels, track, music, playback, radio, broadcast, airwaves, voice, vocals, singer, song |
| `AudioWaveformIcon` | `@mdevs/icons/media/audio-waveform` | [audio-waveform.svg](../../svg/media/audio-waveform.svg) | [TSX](../../src/icons/media/audio-waveform.tsx) | lucide | sound, noise, listen, hearing, hertz, frequency, wavelength, vibrate, sine, synthesizer, synthesiser, levels, track, music, playback, radio, broadcast, airwaves, voice, vocals, singer, song |
| `CameraIcon` | `@mdevs/icons/media/camera` | [camera.svg](../../svg/media/camera.svg) | [TSX](../../src/icons/media/camera.tsx) | lucide | photography, lens, focus, capture, shot, visual, image, device, equipment, photo, webcam, video |
| `CameraAiIcon` | `@mdevs/icons/media/camera-ai` | [camera-ai.svg](../../svg/media/camera-ai.svg) | [TSX](../../src/icons/media/camera-ai.tsx) | tabler | video, photo, aperture, camera, content, entertainment, ai, multimedia, broadcast, audio |
| `CameraBitcoinIcon` | `@mdevs/icons/media/camera-bitcoin` | [camera-bitcoin.svg](../../svg/media/camera-bitcoin.svg) | [TSX](../../src/icons/media/camera-bitcoin.tsx) | tabler | cryptocurrency, blockchain, digital, currency, investment, crypto, technology, finance, bitcoin, token |
| `CameraBoltIcon` | `@mdevs/icons/media/camera-bolt` | [camera-bolt.svg](../../svg/media/camera-bolt.svg) | [TSX](../../src/icons/media/camera-bolt.tsx) | tabler | flash, lightning, electric, shock, energy, power, thunder, charge, zap, spark |
| `CameraCancelIcon` | `@mdevs/icons/media/camera-cancel` | [camera-cancel.svg](../../svg/media/camera-cancel.svg) | [TSX](../../src/icons/media/camera-cancel.tsx) | tabler | stop, terminate, cease, abort, void, nullify, eliminate, delete, end, remove |
| `CameraCheckIcon` | `@mdevs/icons/media/camera-check` | [camera-check.svg](../../svg/media/camera-check.svg) | [TSX](../../src/icons/media/camera-check.tsx) | tabler | verify, confirm, approve, validate, authenticate, cross-check, certify, inspect, examine, assure |
| `CameraCodeIcon` | `@mdevs/icons/media/camera-code` | [camera-code.svg](../../svg/media/camera-code.svg) | [TSX](../../src/icons/media/camera-code.tsx) | tabler | program, software, develop, encrypt, script, scripting, technology, data, cyber, compute |
| `CameraCogIcon` | `@mdevs/icons/media/camera-cog` | [camera-cog.svg](../../svg/media/camera-cog.svg) | [TSX](../../src/icons/media/camera-cog.tsx) | tabler | settings, gear, adjust, tune, configure, mechanism, system, setup, preferences, arrangement |
| `CameraDollarIcon` | `@mdevs/icons/media/camera-dollar` | [camera-dollar.svg](../../svg/media/camera-dollar.svg) | [TSX](../../src/icons/media/camera-dollar.tsx) | tabler | money, finance, investment, currency, wealth, income, funding, cost, monetary, transaction |
| `CameraDownIcon` | `@mdevs/icons/media/camera-down` | [camera-down.svg](../../svg/media/camera-down.svg) | [TSX](../../src/icons/media/camera-down.tsx) | tabler | descend, reduce, lower, decrease, sink, diminish, fall, plummet, subside, ebb |
| `CameraExclamationIcon` | `@mdevs/icons/media/camera-exclamation` | [camera-exclamation.svg](../../svg/media/camera-exclamation.svg) | [TSX](../../src/icons/media/camera-exclamation.tsx) | tabler | alert, notice, warning, attention, caution, notify, critical, important, signal, urgent |
| `CameraHeartIcon` | `@mdevs/icons/media/camera-heart` | [camera-heart.svg](../../svg/media/camera-heart.svg) | [TSX](../../src/icons/media/camera-heart.tsx) | tabler | love, affection, adore, cherish, fondness, warmth, romance, devotion, passion, caring |
| `CameraMinusIcon` | `@mdevs/icons/media/camera-minus` | [camera-minus.svg](../../svg/media/camera-minus.svg) | [TSX](../../src/icons/media/camera-minus.tsx) | tabler | video, photo, aperture, camera, minus, content, entertainment, subtract, remove, less |
| `CameraMoonIcon` | `@mdevs/icons/media/camera-moon` | [camera-moon.svg](../../svg/media/camera-moon.svg) | [TSX](../../src/icons/media/camera-moon.tsx) | tabler | night, lunar, dark, evening, nocturnal, stellar, celestial, astronomy, crescent, eclipse |
| `CameraOffIcon` | `@mdevs/icons/media/camera-off` | [camera-off.svg](../../svg/media/camera-off.svg) | [TSX](../../src/icons/media/camera-off.tsx) | lucide | photo, webcam, video |
| `CameraPauseIcon` | `@mdevs/icons/media/camera-pause` | [camera-pause.svg](../../svg/media/camera-pause.svg) | [TSX](../../src/icons/media/camera-pause.tsx) | tabler | break, rest, halt, stop, interrupt, freeze, hold, suspend, delay, breather |
| `CameraPinIcon` | `@mdevs/icons/media/camera-pin` | [camera-pin.svg](../../svg/media/camera-pin.svg) | [TSX](../../src/icons/media/camera-pin.tsx) | tabler | attach, connect, fix, secure, fasten, affix, anchor, hold, link, stick |
| `CameraPlusIcon` | `@mdevs/icons/media/camera-plus` | [camera-plus.svg](../../svg/media/camera-plus.svg) | [TSX](../../src/icons/media/camera-plus.tsx) | tabler | video, photo, aperture, camera, plus, content, entertainment, add, more, increase |
| `CameraQuestionIcon` | `@mdevs/icons/media/camera-question` | [camera-question.svg](../../svg/media/camera-question.svg) | [TSX](../../src/icons/media/camera-question.tsx) | tabler | photography, query, inquiry, lens, confusion, focus, doubt, investigation, curiosity, snapshot |
| `CameraRotateIcon` | `@mdevs/icons/media/camera-rotate` | [camera-rotate.svg](../../svg/media/camera-rotate.svg) | [TSX](../../src/icons/media/camera-rotate.tsx) | tabler | photo, photography, picture, face, instagram, portrait, digital, smartphone, selfie, camera |
| `CameraSelfieIcon` | `@mdevs/icons/media/camera-selfie` | [camera-selfie.svg](../../svg/media/camera-selfie.svg) | [TSX](../../src/icons/media/camera-selfie.tsx) | tabler | photo, photography, picture, face, instagram, portrait, digital, smartphone, camera, selfie |
| `FilmIcon` | `@mdevs/icons/media/film` | [film.svg](../../svg/media/film.svg) | [TSX](../../src/icons/media/film.tsx) | lucide | movie, video, reel, camera, cinema, entertainment |
| `GalleryHorizontalIcon` | `@mdevs/icons/media/gallery-horizontal` | [gallery-horizontal.svg](../../svg/media/gallery-horizontal.svg) | [TSX](../../src/icons/media/gallery-horizontal.tsx) | lucide | carousel, pictures, images, scroll, swipe, album, portfolio |
| `GalleryHorizontalEndIcon` | `@mdevs/icons/media/gallery-horizontal-end` | [gallery-horizontal-end.svg](../../svg/media/gallery-horizontal-end.svg) | [TSX](../../src/icons/media/gallery-horizontal-end.tsx) | lucide | carousel, pictures, images, scroll, swipe, album, portfolio, history, versions, backup, time machine |
| `GalleryThumbnailsIcon` | `@mdevs/icons/media/gallery-thumbnails` | [gallery-thumbnails.svg](../../svg/media/gallery-thumbnails.svg) | [TSX](../../src/icons/media/gallery-thumbnails.tsx) | lucide | carousel, pictures, images, album, portfolio, preview |
| `GalleryVerticalIcon` | `@mdevs/icons/media/gallery-vertical` | [gallery-vertical.svg](../../svg/media/gallery-vertical.svg) | [TSX](../../src/icons/media/gallery-vertical.tsx) | lucide | carousel, pictures, images, scroll, swipe, album, portfolio |
| `GalleryVerticalEndIcon` | `@mdevs/icons/media/gallery-vertical-end` | [gallery-vertical-end.svg](../../svg/media/gallery-vertical-end.svg) | [TSX](../../src/icons/media/gallery-vertical-end.tsx) | lucide | carousel, pictures, images, scroll, swipe, album, portfolio, history, versions, backup, time machine |
| `HeadphoneOffIcon` | `@mdevs/icons/media/headphone-off` | [headphone-off.svg](../../svg/media/headphone-off.svg) | [TSX](../../src/icons/media/headphone-off.tsx) | lucide | music, audio, sound, mute, off |
| `ImageIcon` | `@mdevs/icons/media/image` | [image.svg](../../svg/media/image.svg) | [TSX](../../src/icons/media/image.tsx) | lucide | picture, photo |
| `ImageDownIcon` | `@mdevs/icons/media/image-down` | [image-down.svg](../../svg/media/image-down.svg) | [TSX](../../src/icons/media/image-down.tsx) | lucide | picture, photo, download, save, export |
| `ImageMinusIcon` | `@mdevs/icons/media/image-minus` | [image-minus.svg](../../svg/media/image-minus.svg) | [TSX](../../src/icons/media/image-minus.tsx) | lucide | remove, delete |
| `ImageOffIcon` | `@mdevs/icons/media/image-off` | [image-off.svg](../../svg/media/image-off.svg) | [TSX](../../src/icons/media/image-off.tsx) | lucide | picture, photo |
| `ImagePlayIcon` | `@mdevs/icons/media/image-play` | [image-play.svg](../../svg/media/image-play.svg) | [TSX](../../src/icons/media/image-play.tsx) | lucide | picture, gif, photo |
| `ImagePlusIcon` | `@mdevs/icons/media/image-plus` | [image-plus.svg](../../svg/media/image-plus.svg) | [TSX](../../src/icons/media/image-plus.tsx) | lucide | add, create, picture |
| `ImageUpIcon` | `@mdevs/icons/media/image-up` | [image-up.svg](../../svg/media/image-up.svg) | [TSX](../../src/icons/media/image-up.tsx) | lucide | picture, photo, upload, import |
| `ImageUpscaleIcon` | `@mdevs/icons/media/image-upscale` | [image-upscale.svg](../../svg/media/image-upscale.svg) | [TSX](../../src/icons/media/image-upscale.tsx) | lucide | resize, picture, sharpen, increase |
| `MicIcon` | `@mdevs/icons/media/mic` | [mic.svg](../../svg/media/mic.svg) | [TSX](../../src/icons/media/mic.tsx) | lucide | record, sound, listen, radio, podcast, microphone |
| `Mic2Icon` | `@mdevs/icons/media/mic-2` | [mic-2.svg](../../svg/media/mic-2.svg) | [TSX](../../src/icons/media/mic-2.tsx) | lucide | — |
| `MicAudioLinesIcon` | `@mdevs/icons/media/mic-audio-lines` | [mic-audio-lines.svg](../../svg/media/mic-audio-lines.svg) | [TSX](../../src/icons/media/mic-audio-lines.tsx) | lucide | podcast, audio, waveform, sound waves, microphone, talk, voice, speech, stream, recording, transcription, dictation, voice assistant, noise cancellation, sound processing |
| `MicOffIcon` | `@mdevs/icons/media/mic-off` | [mic-off.svg](../../svg/media/mic-off.svg) | [TSX](../../src/icons/media/mic-off.tsx) | lucide | record, sound, mute, microphone |
| `MicSignalIcon` | `@mdevs/icons/media/mic-signal` | [mic-signal.svg](../../svg/media/mic-signal.svg) | [TSX](../../src/icons/media/mic-signal.tsx) | lucide | podcast, audio, broadcast, signal, wireless, radio, airwaves, microphone, talk, voice, speech, stream, live, voice chat, push to talk, transmission |
| `MusicIcon` | `@mdevs/icons/media/music` | [music.svg](../../svg/media/music.svg) | [TSX](../../src/icons/media/music.tsx) | lucide | note, quaver, eighth note |
| `Music2Icon` | `@mdevs/icons/media/music-2` | [music-2.svg](../../svg/media/music-2.svg) | [TSX](../../src/icons/media/music-2.tsx) | lucide | quaver, eighth note, note |
| `Music3Icon` | `@mdevs/icons/media/music-3` | [music-3.svg](../../svg/media/music-3.svg) | [TSX](../../src/icons/media/music-3.tsx) | lucide | crotchet, minim, quarter note, half note, note |
| `Music4Icon` | `@mdevs/icons/media/music-4` | [music-4.svg](../../svg/media/music-4.svg) | [TSX](../../src/icons/media/music-4.tsx) | lucide | semiquaver, sixteenth note, note |
| `PauseIcon` | `@mdevs/icons/media/pause` | [pause.svg](../../svg/media/pause.svg) | [TSX](../../src/icons/media/pause.tsx) | lucide | music, stop |
| `PlayIcon` | `@mdevs/icons/media/play` | [play.svg](../../svg/media/play.svg) | [TSX](../../src/icons/media/play.tsx) | lucide | music, audio, video, start, run |
| `PlayCardIcon` | `@mdevs/icons/media/play-card` | [play-card.svg](../../svg/media/play-card.svg) | [TSX](../../src/icons/media/play-card.tsx) | tabler | game, magic, trick, casino, entertainment, spade, heart, diamond, club, playing |
| `PlayCard1Icon` | `@mdevs/icons/media/play-card-1` | [play-card-1.svg](../../svg/media/play-card-1.svg) | [TSX](../../src/icons/media/play-card-1.tsx) | tabler | game, deck, ace, first, gamble, shuffle, deal, card, table, hand |
| `PlayCard10Icon` | `@mdevs/icons/media/play-card-10` | [play-card-10.svg](../../svg/media/play-card-10.svg) | [TSX](../../src/icons/media/play-card-10.tsx) | tabler | game, deck, ten, count, gamble, shuffle, deal, card, table, hand |
| `PlayCard2Icon` | `@mdevs/icons/media/play-card-2` | [play-card-2.svg](../../svg/media/play-card-2.svg) | [TSX](../../src/icons/media/play-card-2.tsx) | tabler | game, deck, two, pair, gamble, shuffle, deal, card, table, hand |
| `PlayCard3Icon` | `@mdevs/icons/media/play-card-3` | [play-card-3.svg](../../svg/media/play-card-3.svg) | [TSX](../../src/icons/media/play-card-3.tsx) | tabler | game, deck, three, trio, gamble, shuffle, deal, card, table, hand |
| `PlayCard4Icon` | `@mdevs/icons/media/play-card-4` | [play-card-4.svg](../../svg/media/play-card-4.svg) | [TSX](../../src/icons/media/play-card-4.tsx) | tabler | game, deck, four, quad, gamble, shuffle, deal, card, table, hand |
| `PlayCard5Icon` | `@mdevs/icons/media/play-card-5` | [play-card-5.svg](../../svg/media/play-card-5.svg) | [TSX](../../src/icons/media/play-card-5.tsx) | tabler | card, five, game, deck, number, fun, gamble, luck, poker, strategy |
| `PlayCard6Icon` | `@mdevs/icons/media/play-card-6` | [play-card-6.svg](../../svg/media/play-card-6.svg) | [TSX](../../src/icons/media/play-card-6.tsx) | tabler | six, carding, cards, deck, number, gameplay, gambling, luck, poker, strategy |
| `PlayCard7Icon` | `@mdevs/icons/media/play-card-7` | [play-card-7.svg](../../svg/media/play-card-7.svg) | [TSX](../../src/icons/media/play-card-7.tsx) | tabler | seven, carding, game, deck, number, lucky, gamble, betting, poker, strategy |
| `PlayCard8Icon` | `@mdevs/icons/media/play-card-8` | [play-card-8.svg](../../svg/media/play-card-8.svg) | [TSX](../../src/icons/media/play-card-8.tsx) | tabler | eight, carding, fun, deck, number, gameplay, gamble, odds, poker, strategy |
| `PlayOffIcon` | `@mdevs/icons/media/play-off` | [play-off.svg](../../svg/media/play-off.svg) | [TSX](../../src/icons/media/play-off.tsx) | lucide | audio, video, music, start, run, off, disabled, blocked, forbidden |
| `PlaySquareIcon` | `@mdevs/icons/media/play-square` | [play-square.svg](../../svg/media/play-square.svg) | [TSX](../../src/icons/media/play-square.tsx) | lucide | — |
| `SpeakerIcon` | `@mdevs/icons/media/speaker` | [speaker.svg](../../svg/media/speaker.svg) | [TSX](../../src/icons/media/speaker.tsx) | lucide | sound, audio, music, tweeter, subwoofer, bass, production, producer, dj |
| `VideoIcon` | `@mdevs/icons/media/video` | [video.svg](../../svg/media/video.svg) | [TSX](../../src/icons/media/video.tsx) | lucide | camera, movie, film, recording, motion picture, camcorder, reel |
| `VideoOffIcon` | `@mdevs/icons/media/video-off` | [video-off.svg](../../svg/media/video-off.svg) | [TSX](../../src/icons/media/video-off.tsx) | lucide | camera, movie, film |
| `VolumeIcon` | `@mdevs/icons/media/volume` | [volume.svg](../../svg/media/volume.svg) | [TSX](../../src/icons/media/volume.tsx) | lucide | music, sound, mute, speaker |
| `Volume1Icon` | `@mdevs/icons/media/volume-1` | [volume-1.svg](../../svg/media/volume-1.svg) | [TSX](../../src/icons/media/volume-1.tsx) | lucide | music, sound, speaker |
| `Volume2Icon` | `@mdevs/icons/media/volume-2` | [volume-2.svg](../../svg/media/volume-2.svg) | [TSX](../../src/icons/media/volume-2.tsx) | lucide | music, sound, speaker |
| `VolumeOffIcon` | `@mdevs/icons/media/volume-off` | [volume-off.svg](../../svg/media/volume-off.svg) | [TSX](../../src/icons/media/volume-off.tsx) | lucide | music, sound, mute, speaker |
| `VolumeXIcon` | `@mdevs/icons/media/volume-x` | [volume-x.svg](../../svg/media/volume-x.svg) | [TSX](../../src/icons/media/volume-x.tsx) | lucide | music, sound, mute, speaker |

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
