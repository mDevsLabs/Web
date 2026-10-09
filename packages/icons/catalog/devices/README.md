# Appareils — icônes

45 icônes de la catégorie `devices`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (45). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {CpuIcon} from '@mdevs/icons';
// Alternatives :
import {CpuIcon} from '@mdevs/icons/devices';
import {CpuIcon} from '@mdevs/icons/devices/cpu';
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
import {CpuIcon} from '@mdevs/icons/devices/cpu';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><CpuIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <CpuIcon size={32} title="Appareils" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `CpuIcon` | `@mdevs/icons/devices/cpu` | [cpu.svg](../../svg/devices/cpu.svg) | [TSX](../../src/icons/devices/cpu.tsx) | lucide | processor, cores, technology, computer, chip, circuit, memory, ram, specs, gigahertz, ghz |
| `KeyboardIcon` | `@mdevs/icons/devices/keyboard` | [keyboard.svg](../../svg/devices/keyboard.svg) | [TSX](../../src/icons/devices/keyboard.tsx) | lucide | layout, spell, settings, mouse |
| `KeyboardMusicIcon` | `@mdevs/icons/devices/keyboard-music` | [keyboard-music.svg](../../svg/devices/keyboard-music.svg) | [TSX](../../src/icons/devices/keyboard-music.tsx) | lucide | music, audio, sound, noise, notes, keys, chord, octave, midi, controller, instrument, electric, signal, digital, studio, production, producer, pianist, piano, play, performance, concert |
| `KeyboardOffIcon` | `@mdevs/icons/devices/keyboard-off` | [keyboard-off.svg](../../svg/devices/keyboard-off.svg) | [TSX](../../src/icons/devices/keyboard-off.tsx) | lucide | unkeys, layout, spell, settings, mouse |
| `LaptopIcon` | `@mdevs/icons/devices/laptop` | [laptop.svg](../../svg/devices/laptop.svg) | [TSX](../../src/icons/devices/laptop.tsx) | lucide | computer, screen, remote |
| `Laptop2Icon` | `@mdevs/icons/devices/laptop-2` | [laptop-2.svg](../../svg/devices/laptop-2.svg) | [TSX](../../src/icons/devices/laptop-2.tsx) | lucide | — |
| `LaptopMinimalCheckIcon` | `@mdevs/icons/devices/laptop-minimal-check` | [laptop-minimal-check.svg](../../svg/devices/laptop-minimal-check.svg) | [TSX](../../src/icons/devices/laptop-minimal-check.tsx) | lucide | computer, screen, remote, success, done, todo, tick, complete, task |
| `MemoryStickIcon` | `@mdevs/icons/devices/memory-stick` | [memory-stick.svg](../../svg/devices/memory-stick.svg) | [TSX](../../src/icons/devices/memory-stick.tsx) | lucide | ram, random access, technology, computer, chip, circuit, specs, capacity, gigabytes, gb |
| `MonitorIcon` | `@mdevs/icons/devices/monitor` | [monitor.svg](../../svg/devices/monitor.svg) | [TSX](../../src/icons/devices/monitor.tsx) | lucide | tv, computer, desktop, screen, display, external display, screen sharing, virtual machine, vm |
| `MonitorCheckIcon` | `@mdevs/icons/devices/monitor-check` | [monitor-check.svg](../../svg/devices/monitor-check.svg) | [TSX](../../src/icons/devices/monitor-check.tsx) | lucide | tv, computer, screen, display, desktop, external display, screen sharing, connected, success, verified, running, active, virtual machine, vm |
| `MonitorCloudIcon` | `@mdevs/icons/devices/monitor-cloud` | [monitor-cloud.svg](../../svg/devices/monitor-cloud.svg) | [TSX](../../src/icons/devices/monitor-cloud.tsx) | lucide | tv, computer, screen, display, desktop, external display, virtual machine, virtual desktop, vm, vdi, computing, remote work, monitoring, infrastructure, software as a service, saas, workstation, environment |
| `MonitorCogIcon` | `@mdevs/icons/devices/monitor-cog` | [monitor-cog.svg](../../svg/devices/monitor-cog.svg) | [TSX](../../src/icons/devices/monitor-cog.tsx) | lucide | tv, computer, screen, display, desktop, external display, virtual machine, vm, executable, settings, edit, gear, configuration, preferences, system, control panel, network, computing |
| `MonitorDotIcon` | `@mdevs/icons/devices/monitor-dot` | [monitor-dot.svg](../../svg/devices/monitor-dot.svg) | [TSX](../../src/icons/devices/monitor-dot.tsx) | lucide | tv, computer, screen, display, desktop, external display, screen sharing, status, notification, indicator, running, active, virtual machine, vm |
| `MonitorDownIcon` | `@mdevs/icons/devices/monitor-down` | [monitor-down.svg](../../svg/devices/monitor-down.svg) | [TSX](../../src/icons/devices/monitor-down.tsx) | lucide | tv, computer, screen, display, desktop, external display, screen sharing, download, remote, cast |
| `MonitorOffIcon` | `@mdevs/icons/devices/monitor-off` | [monitor-off.svg](../../svg/devices/monitor-off.svg) | [TSX](../../src/icons/devices/monitor-off.tsx) | lucide | tv, computer, screen, display, desktop, external display, screen sharing, offline, disabled, disconnected, power |
| `MonitorPauseIcon` | `@mdevs/icons/devices/monitor-pause` | [monitor-pause.svg](../../svg/devices/monitor-pause.svg) | [TSX](../../src/icons/devices/monitor-pause.tsx) | lucide | tv, computer, screen, display, desktop, external display, screen sharing, video, movie, film, pause, suspend, hibernate, boot, virtual machine, vm |
| `MonitorPcIcon` | `@mdevs/icons/devices/monitor-pc` | [monitor-pc.svg](../../svg/devices/monitor-pc.svg) | [TSX](../../src/icons/devices/monitor-pc.tsx) | lucide | personal computer, desktop, screen, display, workstation, tower, chassis, hardware, setup, gaming |
| `MonitorPlayIcon` | `@mdevs/icons/devices/monitor-play` | [monitor-play.svg](../../svg/devices/monitor-play.svg) | [TSX](../../src/icons/devices/monitor-play.tsx) | lucide | tv, computer, screen, display, desktop, external display, screen sharing, video, movie, film, play, running, start, boot, virtual machine, vm |
| `MonitorSmartphoneIcon` | `@mdevs/icons/devices/monitor-smartphone` | [monitor-smartphone.svg](../../svg/devices/monitor-smartphone.svg) | [TSX](../../src/icons/devices/monitor-smartphone.tsx) | lucide | phone, cellphone, device, mobile, desktop, screen, display, external display, screen sharing, responsive, screens, sync, cast |
| `MonitorSpeakerIcon` | `@mdevs/icons/devices/monitor-speaker` | [monitor-speaker.svg](../../svg/devices/monitor-speaker.svg) | [TSX](../../src/icons/devices/monitor-speaker.tsx) | lucide | tv, computer, screen, display, desktop, external display, connect, cast, audio, sound, volume, presentation |
| `MonitorStopIcon` | `@mdevs/icons/devices/monitor-stop` | [monitor-stop.svg](../../svg/devices/monitor-stop.svg) | [TSX](../../src/icons/devices/monitor-stop.tsx) | lucide | tv, computer, screen, display, desktop, external display, screen sharing, video, movie, film, stop, shutdown, virtual machine, vm |
| `MonitorUpIcon` | `@mdevs/icons/devices/monitor-up` | [monitor-up.svg](../../svg/devices/monitor-up.svg) | [TSX](../../src/icons/devices/monitor-up.tsx) | lucide | tv, computer, screen, display, desktop, external display, upload, connect, remote, screen sharing, cast |
| `MonitorXIcon` | `@mdevs/icons/devices/monitor-x` | [monitor-x.svg](../../svg/devices/monitor-x.svg) | [TSX](../../src/icons/devices/monitor-x.tsx) | lucide | tv, computer, screen, display, desktop, external display, screen sharing, virtual machine, vm, close, error, failed, disconnected, stop, suspend, remove, delete |
| `MouseIcon` | `@mdevs/icons/devices/mouse` | [mouse.svg](../../svg/devices/mouse.svg) | [TSX](../../src/icons/devices/mouse.tsx) | lucide | device, scroll, click |
| `MouseLeftIcon` | `@mdevs/icons/devices/mouse-left` | [mouse-left.svg](../../svg/devices/mouse-left.svg) | [TSX](../../src/icons/devices/mouse-left.tsx) | lucide | device, scroll, click |
| `MouseOffIcon` | `@mdevs/icons/devices/mouse-off` | [mouse-off.svg](../../svg/devices/mouse-off.svg) | [TSX](../../src/icons/devices/mouse-off.tsx) | lucide | device, scroll, click, disabled |
| `MousePointerIcon` | `@mdevs/icons/devices/mouse-pointer` | [mouse-pointer.svg](../../svg/devices/mouse-pointer.svg) | [TSX](../../src/icons/devices/mouse-pointer.tsx) | lucide | click, select |
| `MousePointer2Icon` | `@mdevs/icons/devices/mouse-pointer-2` | [mouse-pointer-2.svg](../../svg/devices/mouse-pointer-2.svg) | [TSX](../../src/icons/devices/mouse-pointer-2.tsx) | lucide | click, select |
| `MousePointer2OffIcon` | `@mdevs/icons/devices/mouse-pointer-2-off` | [mouse-pointer-2-off.svg](../../svg/devices/mouse-pointer-2-off.svg) | [TSX](../../src/icons/devices/mouse-pointer-2-off.tsx) | lucide | pointer, mouse, cursor, off, disable, arrow, navigation, selection, select, click, no-click, interaction |
| `MousePointerBanIcon` | `@mdevs/icons/devices/mouse-pointer-ban` | [mouse-pointer-ban.svg](../../svg/devices/mouse-pointer-ban.svg) | [TSX](../../src/icons/devices/mouse-pointer-ban.tsx) | lucide | wait, busy, loading, blocked, frozen, freeze |
| `MousePointerClickIcon` | `@mdevs/icons/devices/mouse-pointer-click` | [mouse-pointer-click.svg](../../svg/devices/mouse-pointer-click.svg) | [TSX](../../src/icons/devices/mouse-pointer-click.tsx) | lucide | click, select |
| `MousePointerSquareDashedIcon` | `@mdevs/icons/devices/mouse-pointer-square-dashed` | [mouse-pointer-square-dashed.svg](../../svg/devices/mouse-pointer-square-dashed.svg) | [TSX](../../src/icons/devices/mouse-pointer-square-dashed.tsx) | lucide | — |
| `MouseRightIcon` | `@mdevs/icons/devices/mouse-right` | [mouse-right.svg](../../svg/devices/mouse-right.svg) | [TSX](../../src/icons/devices/mouse-right.tsx) | lucide | device, scroll, click |
| `PrinterIcon` | `@mdevs/icons/devices/printer` | [printer.svg](../../svg/devices/printer.svg) | [TSX](../../src/icons/devices/printer.tsx) | lucide | fax, office, device |
| `Printer3dIcon` | `@mdevs/icons/devices/printer-3d` | [printer-3d.svg](../../svg/devices/printer-3d.svg) | [TSX](../../src/icons/devices/printer-3d.tsx) | lucide | model, hardware, technology, device, factory, manufacturing, art, extruder, stl, obj, step, additive, fabrication, rapid prototype, layer, filament, nozzle, maker, machine |
| `PrinterCheckIcon` | `@mdevs/icons/devices/printer-check` | [printer-check.svg](../../svg/devices/printer-check.svg) | [TSX](../../src/icons/devices/printer-check.tsx) | lucide | fax, office, device, success, printed |
| `PrinterXIcon` | `@mdevs/icons/devices/printer-x` | [printer-x.svg](../../svg/devices/printer-x.svg) | [TSX](../../src/icons/devices/printer-x.tsx) | lucide | fax, office, device, cross, cancel, remove, error |
| `SmartphoneIcon` | `@mdevs/icons/devices/smartphone` | [smartphone.svg](../../svg/devices/smartphone.svg) | [TSX](../../src/icons/devices/smartphone.tsx) | lucide | phone, cellphone, device, mobile, screen, display, touchscreen, portable, responsive |
| `SmartphoneChargingIcon` | `@mdevs/icons/devices/smartphone-charging` | [smartphone-charging.svg](../../svg/devices/smartphone-charging.svg) | [TSX](../../src/icons/devices/smartphone-charging.tsx) | lucide | phone, cellphone, device, power, screen |
| `SmartphoneNfcIcon` | `@mdevs/icons/devices/smartphone-nfc` | [smartphone-nfc.svg](../../svg/devices/smartphone-nfc.svg) | [TSX](../../src/icons/devices/smartphone-nfc.tsx) | lucide | contactless, payment, near-field communication, screen |
| `TabletIcon` | `@mdevs/icons/devices/tablet` | [tablet.svg](../../svg/devices/tablet.svg) | [TSX](../../src/icons/devices/tablet.tsx) | lucide | device, mobile, screen, display, touchscreen, portable, responsive |
| `TabletSmartphoneIcon` | `@mdevs/icons/devices/tablet-smartphone` | [tablet-smartphone.svg](../../svg/devices/tablet-smartphone.svg) | [TSX](../../src/icons/devices/tablet-smartphone.tsx) | lucide | phone, cellphone, device, mobile, screen, display, touchscreen, portable, responsive, screens, browser, testing |
| `UsbIcon` | `@mdevs/icons/devices/usb` | [usb.svg](../../svg/devices/usb.svg) | [TSX](../../src/icons/devices/usb.tsx) | lucide | universal, serial, bus, controller, connector, interface |
| `UsbCPortIcon` | `@mdevs/icons/devices/usb-c-port` | [usb-c-port.svg](../../svg/devices/usb-c-port.svg) | [TSX](../../src/icons/devices/usb-c-port.tsx) | lucide | universal, serial, bus, controller, connector, interface, socket, plug, slot, data, input, output |
| `WatchIcon` | `@mdevs/icons/devices/watch` | [watch.svg](../../svg/devices/watch.svg) | [TSX](../../src/icons/devices/watch.tsx) | lucide | clock, time |

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
