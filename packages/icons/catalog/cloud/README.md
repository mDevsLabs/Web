# Cloud et infrastructure — icônes

74 icônes de la catégorie `cloud`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (43), tabler (31). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {CloudIcon} from '@mdevs/icons';
// Alternatives :
import {CloudIcon} from '@mdevs/icons/cloud';
import {CloudIcon} from '@mdevs/icons/cloud/cloud';
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
import {CloudIcon} from '@mdevs/icons/cloud/cloud';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><CloudIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <CloudIcon size={32} title="Cloud et infrastructure" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `CloudIcon` | `@mdevs/icons/cloud/cloud` | [cloud.svg](../../svg/cloud/cloud.svg) | [TSX](../../src/icons/cloud/cloud.tsx) | lucide | weather |
| `CloudAlertIcon` | `@mdevs/icons/cloud/cloud-alert` | [cloud-alert.svg](../../svg/cloud/cloud-alert.svg) | [TSX](../../src/icons/cloud/cloud-alert.tsx) | lucide | weather, danger, warning, alert, error, sync, network, exclamation |
| `CloudBackupIcon` | `@mdevs/icons/cloud/cloud-backup` | [cloud-backup.svg](../../svg/cloud/cloud-backup.svg) | [TSX](../../src/icons/cloud/cloud-backup.tsx) | lucide | storage, memory, bytes, servers, backup, timemachine, rotate, synchronize, synchronise, refresh, reconnect, transfer, data, security, upload, save, remote, safety |
| `CloudBoltIcon` | `@mdevs/icons/cloud/cloud-bolt` | [cloud-bolt.svg](../../svg/cloud/cloud-bolt.svg) | [TSX](../../src/icons/cloud/cloud-bolt.tsx) | tabler | storm, electricity, thunder, lightning, energy, power, strike, shock, flash, weather |
| `CloudCancelIcon` | `@mdevs/icons/cloud/cloud-cancel` | [cloud-cancel.svg](../../svg/cloud/cloud-cancel.svg) | [TSX](../../src/icons/cloud/cloud-cancel.tsx) | tabler | remove, stop, terminate, abort, dismiss, reject, end, nullify, void, discard |
| `CloudCheckIcon` | `@mdevs/icons/cloud/cloud-check` | [cloud-check.svg](../../svg/cloud/cloud-check.svg) | [TSX](../../src/icons/cloud/cloud-check.tsx) | lucide | sync, network, success, done, completed, saved, persisted |
| `CloudCodeIcon` | `@mdevs/icons/cloud/cloud-code` | [cloud-code.svg](../../svg/cloud/cloud-code.svg) | [TSX](../../src/icons/cloud/cloud-code.tsx) | tabler | programming, development, software, script, syntax, algorithm, computing, debugging, engineering, cloud |
| `CloudCogIcon` | `@mdevs/icons/cloud/cloud-cog` | [cloud-cog.svg](../../svg/cloud/cloud-cog.svg) | [TSX](../../src/icons/cloud/cloud-cog.tsx) | lucide | computing, ai, cluster, network |
| `CloudComputingIcon` | `@mdevs/icons/cloud/cloud-computing` | [cloud-computing.svg](../../svg/cloud/cloud-computing.svg) | [TSX](../../src/icons/cloud/cloud-computing.tsx) | tabler | server, network, data, storage, share, internet, cloud, computing, online, sync |
| `CloudDataConnectionIcon` | `@mdevs/icons/cloud/cloud-data-connection` | [cloud-data-connection.svg](../../svg/cloud/cloud-data-connection.svg) | [TSX](../../src/icons/cloud/cloud-data-connection.tsx) | tabler | media, network, storage, access, cloud, data, connection, online, server, sync |
| `CloudDollarIcon` | `@mdevs/icons/cloud/cloud-dollar` | [cloud-dollar.svg](../../svg/cloud/cloud-dollar.svg) | [TSX](../../src/icons/cloud/cloud-dollar.tsx) | tabler | money, finance, wealth, riches, funds, currency, profit, economy, savings, capital |
| `CloudDownIcon` | `@mdevs/icons/cloud/cloud-down` | [cloud-down.svg](../../svg/cloud/cloud-down.svg) | [TSX](../../src/icons/cloud/cloud-down.tsx) | tabler | download, retrieve, access, fetch, obtain, transfer, sync, get, acquire, receive |
| `CloudDownloadIcon` | `@mdevs/icons/cloud/cloud-download` | [cloud-download.svg](../../svg/cloud/cloud-download.svg) | [TSX](../../src/icons/cloud/cloud-download.tsx) | lucide | import |
| `CloudDrizzleIcon` | `@mdevs/icons/cloud/cloud-drizzle` | [cloud-drizzle.svg](../../svg/cloud/cloud-drizzle.svg) | [TSX](../../src/icons/cloud/cloud-drizzle.tsx) | lucide | weather, shower |
| `CloudExclamationIcon` | `@mdevs/icons/cloud/cloud-exclamation` | [cloud-exclamation.svg](../../svg/cloud/cloud-exclamation.svg) | [TSX](../../src/icons/cloud/cloud-exclamation.tsx) | tabler | alert, warning, notice, attention, caution, highlight, emphasis, critical, important, urgent |
| `CloudFogIcon` | `@mdevs/icons/cloud/cloud-fog` | [cloud-fog.svg](../../svg/cloud/cloud-fog.svg) | [TSX](../../src/icons/cloud/cloud-fog.tsx) | lucide | weather, mist |
| `CloudHailIcon` | `@mdevs/icons/cloud/cloud-hail` | [cloud-hail.svg](../../svg/cloud/cloud-hail.svg) | [TSX](../../src/icons/cloud/cloud-hail.tsx) | lucide | weather, rainfall |
| `CloudHeartIcon` | `@mdevs/icons/cloud/cloud-heart` | [cloud-heart.svg](../../svg/cloud/cloud-heart.svg) | [TSX](../../src/icons/cloud/cloud-heart.tsx) | tabler | love, affection, care, passion, emotion, fondness, devotion, warmth, kindness, relationship |
| `CloudLightningIcon` | `@mdevs/icons/cloud/cloud-lightning` | [cloud-lightning.svg](../../svg/cloud/cloud-lightning.svg) | [TSX](../../src/icons/cloud/cloud-lightning.tsx) | lucide | weather, bolt |
| `CloudMinusIcon` | `@mdevs/icons/cloud/cloud-minus` | [cloud-minus.svg](../../svg/cloud/cloud-minus.svg) | [TSX](../../src/icons/cloud/cloud-minus.tsx) | tabler | subtract, reduce, decrease, lessen, deduct, remove, lower, diminish, shorten, cut |
| `CloudMoonIcon` | `@mdevs/icons/cloud/cloud-moon` | [cloud-moon.svg](../../svg/cloud/cloud-moon.svg) | [TSX](../../src/icons/cloud/cloud-moon.tsx) | lucide | weather, night |
| `CloudMoonRainIcon` | `@mdevs/icons/cloud/cloud-moon-rain` | [cloud-moon-rain.svg](../../svg/cloud/cloud-moon-rain.svg) | [TSX](../../src/icons/cloud/cloud-moon-rain.tsx) | lucide | weather, partly, night, rainfall |
| `CloudOffIcon` | `@mdevs/icons/cloud/cloud-off` | [cloud-off.svg](../../svg/cloud/cloud-off.svg) | [TSX](../../src/icons/cloud/cloud-off.tsx) | lucide | disconnect |
| `CloudPauseIcon` | `@mdevs/icons/cloud/cloud-pause` | [cloud-pause.svg](../../svg/cloud/cloud-pause.svg) | [TSX](../../src/icons/cloud/cloud-pause.tsx) | tabler | halt, freeze, stop, delay, suspend, break, interruption, cease, hold, cloud |
| `CloudPinIcon` | `@mdevs/icons/cloud/cloud-pin` | [cloud-pin.svg](../../svg/cloud/cloud-pin.svg) | [TSX](../../src/icons/cloud/cloud-pin.tsx) | tabler | location, map, place, position, marker, point, spot, navigate, geotag, fix |
| `CloudPlusIcon` | `@mdevs/icons/cloud/cloud-plus` | [cloud-plus.svg](../../svg/cloud/cloud-plus.svg) | [TSX](../../src/icons/cloud/cloud-plus.tsx) | tabler | add, increase, gain, expand, grow, enhance, augment, build, boost, amplify |
| `CloudQuestionIcon` | `@mdevs/icons/cloud/cloud-question` | [cloud-question.svg](../../svg/cloud/cloud-question.svg) | [TSX](../../src/icons/cloud/cloud-question.tsx) | tabler | help, inquiry, doubt, uncertainty, ask, query, explore, clarification, puzzle, wonder |
| `CloudRainIcon` | `@mdevs/icons/cloud/cloud-rain` | [cloud-rain.svg](../../svg/cloud/cloud-rain.svg) | [TSX](../../src/icons/cloud/cloud-rain.tsx) | lucide | weather, rainfall |
| `CloudRainWindIcon` | `@mdevs/icons/cloud/cloud-rain-wind` | [cloud-rain-wind.svg](../../svg/cloud/cloud-rain-wind.svg) | [TSX](../../src/icons/cloud/cloud-rain-wind.tsx) | lucide | weather, rainfall |
| `CloudSearchIcon` | `@mdevs/icons/cloud/cloud-search` | [cloud-search.svg](../../svg/cloud/cloud-search.svg) | [TSX](../../src/icons/cloud/cloud-search.tsx) | tabler | find, look, locate, discover, explore, research, seek, inspect, browse, scan |
| `CloudShareIcon` | `@mdevs/icons/cloud/cloud-share` | [cloud-share.svg](../../svg/cloud/cloud-share.svg) | [TSX](../../src/icons/cloud/cloud-share.tsx) | tabler | distribute, transmit, convey, extend, spread, offer, provide, broadcast, present, give |
| `CloudSnowIcon` | `@mdevs/icons/cloud/cloud-snow` | [cloud-snow.svg](../../svg/cloud/cloud-snow.svg) | [TSX](../../src/icons/cloud/cloud-snow.tsx) | lucide | weather, blizzard |
| `CloudStarIcon` | `@mdevs/icons/cloud/cloud-star` | [cloud-star.svg](../../svg/cloud/cloud-star.svg) | [TSX](../../src/icons/cloud/cloud-star.tsx) | tabler | favorite, best, highlight, top, rated, acclaim, celebrate, praise, honor, prestige |
| `CloudStormIcon` | `@mdevs/icons/cloud/cloud-storm` | [cloud-storm.svg](../../svg/cloud/cloud-storm.svg) | [TSX](../../src/icons/cloud/cloud-storm.tsx) | tabler | weather, lightning, cloud, storm, storage, online, climate, forecast, server, sync |
| `CloudSunIcon` | `@mdevs/icons/cloud/cloud-sun` | [cloud-sun.svg](../../svg/cloud/cloud-sun.svg) | [TSX](../../src/icons/cloud/cloud-sun.tsx) | lucide | weather, partly |
| `CloudSunRainIcon` | `@mdevs/icons/cloud/cloud-sun-rain` | [cloud-sun-rain.svg](../../svg/cloud/cloud-sun-rain.svg) | [TSX](../../src/icons/cloud/cloud-sun-rain.tsx) | lucide | weather, partly, rainfall |
| `CloudSyncIcon` | `@mdevs/icons/cloud/cloud-sync` | [cloud-sync.svg](../../svg/cloud/cloud-sync.svg) | [TSX](../../src/icons/cloud/cloud-sync.tsx) | lucide | synchronize, synchronise, refresh, reconnect, transfer, backup, storage, upload, download, connection, network, data |
| `CloudUpIcon` | `@mdevs/icons/cloud/cloud-up` | [cloud-up.svg](../../svg/cloud/cloud-up.svg) | [TSX](../../src/icons/cloud/cloud-up.tsx) | tabler | upload, send, transfer, push, convey, sync, submit, deliver, advance, progress |
| `CloudUploadIcon` | `@mdevs/icons/cloud/cloud-upload` | [cloud-upload.svg](../../svg/cloud/cloud-upload.svg) | [TSX](../../src/icons/cloud/cloud-upload.tsx) | lucide | file |
| `CloudXIcon` | `@mdevs/icons/cloud/cloud-x` | [cloud-x.svg](../../svg/cloud/cloud-x.svg) | [TSX](../../src/icons/cloud/cloud-x.tsx) | tabler | delete, remove, cancel, close, terminate, end, reject, cut, dismiss, drop |
| `ContainerIcon` | `@mdevs/icons/cloud/container` | [container.svg](../../svg/cloud/container.svg) | [TSX](../../src/icons/cloud/container.tsx) | lucide | storage, shipping, freight, supply chain, environment, devops, code, coding |
| `DatabaseIcon` | `@mdevs/icons/cloud/database` | [database.svg](../../svg/cloud/database.svg) | [TSX](../../src/icons/cloud/database.tsx) | lucide | storage, memory, container, tin, pot, bytes, servers |
| `DatabaseArrowDownIcon` | `@mdevs/icons/cloud/database-arrow-down` | [database-arrow-down.svg](../../svg/cloud/database-arrow-down.svg) | [TSX](../../src/icons/cloud/database-arrow-down.tsx) | lucide | storage, memory, bytes, server, export, download, backup, pull, downsize |
| `DatabaseArrowUpIcon` | `@mdevs/icons/cloud/database-arrow-up` | [database-arrow-up.svg](../../svg/cloud/database-arrow-up.svg) | [TSX](../../src/icons/cloud/database-arrow-up.tsx) | lucide | storage, memory, bytes, server, import, upload, backup, push, upscale |
| `DatabaseBackupIcon` | `@mdevs/icons/cloud/database-backup` | [database-backup.svg](../../svg/cloud/database-backup.svg) | [TSX](../../src/icons/cloud/database-backup.tsx) | lucide | storage, memory, bytes, servers, backup, timemachine, rotate, arrow, left |
| `DatabaseCheckIcon` | `@mdevs/icons/cloud/database-check` | [database-check.svg](../../svg/cloud/database-check.svg) | [TSX](../../src/icons/cloud/database-check.tsx) | lucide | storage, memory, bytes, server, check, success, valid, verified, confirmed, complete |
| `DatabaseCogIcon` | `@mdevs/icons/cloud/database-cog` | [database-cog.svg](../../svg/cloud/database-cog.svg) | [TSX](../../src/icons/cloud/database-cog.tsx) | tabler | gear, settings, manage, configure, organize, control, adjust, customize, optimize, tune |
| `DatabaseDollarIcon` | `@mdevs/icons/cloud/database-dollar` | [database-dollar.svg](../../svg/cloud/database-dollar.svg) | [TSX](../../src/icons/cloud/database-dollar.tsx) | tabler | money, finance, economy, value, cash, wealth, capital, fund, transaction, revenue |
| `DatabaseEditIcon` | `@mdevs/icons/cloud/database-edit` | [database-edit.svg](../../svg/cloud/database-edit.svg) | [TSX](../../src/icons/cloud/database-edit.tsx) | tabler | modify, change, alter, revise, adjust, update, tweak, refine, customize, fine-tune |
| `DatabaseExclamationIcon` | `@mdevs/icons/cloud/database-exclamation` | [database-exclamation.svg](../../svg/cloud/database-exclamation.svg) | [TSX](../../src/icons/cloud/database-exclamation.tsx) | tabler | alert, warning, caution, attention, notice, signal, notify, announce, indicate, alarm |
| `DatabaseExportIcon` | `@mdevs/icons/cloud/database-export` | [database-export.svg](../../svg/cloud/database-export.svg) | [TSX](../../src/icons/cloud/database-export.tsx) | tabler | data, backup, file, storage, system, database, export, repository, records, information |
| `DatabaseHeartIcon` | `@mdevs/icons/cloud/database-heart` | [database-heart.svg](../../svg/cloud/database-heart.svg) | [TSX](../../src/icons/cloud/database-heart.tsx) | tabler | love, favorite, affection, emotion, liking, preference, fondness, admire, cherish, adore |
| `DatabaseImportIcon` | `@mdevs/icons/cloud/database-import` | [database-import.svg](../../svg/cloud/database-import.svg) | [TSX](../../src/icons/cloud/database-import.tsx) | tabler | data, file, storage, backup, system, database, import, repository, records, information |
| `DatabaseLeakIcon` | `@mdevs/icons/cloud/database-leak` | [database-leak.svg](../../svg/cloud/database-leak.svg) | [TSX](../../src/icons/cloud/database-leak.tsx) | tabler | breach, spill, expose, release, discharge, seep, escape, overflow, disclose, reveal |
| `DatabaseMinusIcon` | `@mdevs/icons/cloud/database-minus` | [database-minus.svg](../../svg/cloud/database-minus.svg) | [TSX](../../src/icons/cloud/database-minus.tsx) | lucide | storage, memory, bytes, server, minus, remove, delete, reduce |
| `DatabaseOffIcon` | `@mdevs/icons/cloud/database-off` | [database-off.svg](../../svg/cloud/database-off.svg) | [TSX](../../src/icons/cloud/database-off.tsx) | tabler | storage, data, memory, database, off, disabled, inactive, repository, records, information |
| `DatabasePlusIcon` | `@mdevs/icons/cloud/database-plus` | [database-plus.svg](../../svg/cloud/database-plus.svg) | [TSX](../../src/icons/cloud/database-plus.tsx) | lucide | storage, memory, bytes, server, plus, add, create, insert, new, expand |
| `DatabaseSearchIcon` | `@mdevs/icons/cloud/database-search` | [database-search.svg](../../svg/cloud/database-search.svg) | [TSX](../../src/icons/cloud/database-search.tsx) | lucide | storage, memory, container, tin, pot, bytes, servers |
| `DatabaseShareIcon` | `@mdevs/icons/cloud/database-share` | [database-share.svg](../../svg/cloud/database-share.svg) | [TSX](../../src/icons/cloud/database-share.tsx) | tabler | distribute, spread, allocate, give, transfer, exchange, dispense, broadcast, circulate, communicate |
| `DatabaseStarIcon` | `@mdevs/icons/cloud/database-star` | [database-star.svg](../../svg/cloud/database-star.svg) | [TSX](../../src/icons/cloud/database-star.tsx) | tabler | favorite, highlight, featured, notable, remarkable, important, prestige, prime, top, noteworthy |
| `DatabaseXIcon` | `@mdevs/icons/cloud/database-x` | [database-x.svg](../../svg/cloud/database-x.svg) | [TSX](../../src/icons/cloud/database-x.tsx) | lucide | storage, memory, bytes, server, x, error, failed, invalid, rejected, denied, clear, remove, disconnect |
| `DatabaseZapIcon` | `@mdevs/icons/cloud/database-zap` | [database-zap.svg](../../svg/cloud/database-zap.svg) | [TSX](../../src/icons/cloud/database-zap.tsx) | lucide | cache busting, storage, memory, bytes, servers, power, crash |
| `EthernetPortIcon` | `@mdevs/icons/cloud/ethernet-port` | [ethernet-port.svg](../../svg/cloud/ethernet-port.svg) | [TSX](../../src/icons/cloud/ethernet-port.tsx) | lucide | internet, network, connection, cable, lan, port, router, switch, hub, modem, web, online, networking, communication, socket, plug, slot, controller, connector, interface, console, signal, data, input, output |
| `HardDriveIcon` | `@mdevs/icons/cloud/hard-drive` | [hard-drive.svg](../../svg/cloud/hard-drive.svg) | [TSX](../../src/icons/cloud/hard-drive.tsx) | lucide | computer, server, memory, data, ssd, disk, hard disk, storage, hardware, backup, media |
| `HardDriveDownloadIcon` | `@mdevs/icons/cloud/hard-drive-download` | [hard-drive-download.svg](../../svg/cloud/hard-drive-download.svg) | [TSX](../../src/icons/cloud/hard-drive-download.tsx) | lucide | computer, server, memory, data, ssd, disk, hard disk, save |
| `HardDriveUploadIcon` | `@mdevs/icons/cloud/hard-drive-upload` | [hard-drive-upload.svg](../../svg/cloud/hard-drive-upload.svg) | [TSX](../../src/icons/cloud/hard-drive-upload.tsx) | lucide | computer, server, memory, data, ssd, disk, hard disk, save |
| `NetworkIcon` | `@mdevs/icons/cloud/network` | [network.svg](../../svg/cloud/network.svg) | [TSX](../../src/icons/cloud/network.tsx) | lucide | tree |
| `RouterIcon` | `@mdevs/icons/cloud/router` | [router.svg](../../svg/cloud/router.svg) | [TSX](../../src/icons/cloud/router.tsx) | lucide | computer, server, cloud |
| `ServerIcon` | `@mdevs/icons/cloud/server` | [server.svg](../../svg/cloud/server.svg) | [TSX](../../src/icons/cloud/server.tsx) | lucide | cloud, storage |
| `ServerCogIcon` | `@mdevs/icons/cloud/server-cog` | [server-cog.svg](../../svg/cloud/server-cog.svg) | [TSX](../../src/icons/cloud/server-cog.tsx) | lucide | cloud, storage, computing, cog, gear |
| `ServerCrashIcon` | `@mdevs/icons/cloud/server-crash` | [server-crash.svg](../../svg/cloud/server-crash.svg) | [TSX](../../src/icons/cloud/server-crash.tsx) | lucide | cloud, storage, problem, error |
| `ServerOffIcon` | `@mdevs/icons/cloud/server-off` | [server-off.svg](../../svg/cloud/server-off.svg) | [TSX](../../src/icons/cloud/server-off.tsx) | lucide | cloud, storage |
| `ServerPlusIcon` | `@mdevs/icons/cloud/server-plus` | [server-plus.svg](../../svg/cloud/server-plus.svg) | [TSX](../../src/icons/cloud/server-plus.tsx) | lucide | add, create, new, cloud, storage, computing |
| `WorkflowIcon` | `@mdevs/icons/cloud/workflow` | [workflow.svg](../../svg/cloud/workflow.svg) | [TSX](../../src/icons/cloud/workflow.tsx) | lucide | action, continuous integration, ci, automation, devops, network, node, connection |

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
