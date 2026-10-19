# Sécurité — icônes

37 icônes de la catégorie `security`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (37). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {BadgeCheckIcon} from '@mdevs/icons';
// Alternatives :
import {BadgeCheckIcon} from '@mdevs/icons/security';
import {BadgeCheckIcon} from '@mdevs/icons/security/badge-check';
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
import {BadgeCheckIcon} from '@mdevs/icons/security/badge-check';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><BadgeCheckIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <BadgeCheckIcon size={32} title="Sécurité" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `BadgeCheckIcon` | `@mdevs/icons/security/badge-check` | [badge-check.svg](../../svg/security/badge-check.svg) | [TSX](../../src/icons/security/badge-check.tsx) | lucide | verified, check |
| `FingerprintPatternIcon` | `@mdevs/icons/security/fingerprint-pattern` | [fingerprint-pattern.svg](../../svg/security/fingerprint-pattern.svg) | [TSX](../../src/icons/security/fingerprint-pattern.tsx) | lucide | 2fa, authentication, biometric, identity, security |
| `KeyIcon` | `@mdevs/icons/security/key` | [key.svg](../../svg/security/key.svg) | [TSX](../../src/icons/security/key.tsx) | lucide | password, login, authentication, secure, unlock, keychain, key ring, fob |
| `KeyRoundIcon` | `@mdevs/icons/security/key-round` | [key-round.svg](../../svg/security/key-round.svg) | [TSX](../../src/icons/security/key-round.tsx) | lucide | password, login, authentication, secure, unlock |
| `KeySquareIcon` | `@mdevs/icons/security/key-square` | [key-square.svg](../../svg/security/key-square.svg) | [TSX](../../src/icons/security/key-square.tsx) | lucide | password, login, authentication, secure, unlock, car key |
| `LockIcon` | `@mdevs/icons/security/lock` | [lock.svg](../../svg/security/lock.svg) | [TSX](../../src/icons/security/lock.tsx) | lucide | security, password, secure, admin |
| `LockKeyholeIcon` | `@mdevs/icons/security/lock-keyhole` | [lock-keyhole.svg](../../svg/security/lock-keyhole.svg) | [TSX](../../src/icons/security/lock-keyhole.tsx) | lucide | security, password, secure, admin |
| `LockKeyholeOpenIcon` | `@mdevs/icons/security/lock-keyhole-open` | [lock-keyhole-open.svg](../../svg/security/lock-keyhole-open.svg) | [TSX](../../src/icons/security/lock-keyhole-open.tsx) | lucide | security |
| `LockOpenIcon` | `@mdevs/icons/security/lock-open` | [lock-open.svg](../../svg/security/lock-open.svg) | [TSX](../../src/icons/security/lock-open.tsx) | lucide | security |
| `ScanIcon` | `@mdevs/icons/security/scan` | [scan.svg](../../svg/security/scan.svg) | [TSX](../../src/icons/security/scan.tsx) | lucide | qr-code, barcode, checkout, augmented reality, ar, target, surveillance, camera, lens, focus, frame, select, box, boundary, bounds, area, square, dashed |
| `ScanBarcodeIcon` | `@mdevs/icons/security/scan-barcode` | [scan-barcode.svg](../../svg/security/scan-barcode.svg) | [TSX](../../src/icons/security/scan-barcode.tsx) | lucide | checkout, till, cart, transaction, purchase, buy, product, packaging, retail, consumer |
| `ScanBoxIcon` | `@mdevs/icons/security/scan-box` | [scan-box.svg](../../svg/security/scan-box.svg) | [TSX](../../src/icons/security/scan-box.tsx) | lucide | ar, augmented reality, 3d, object detection, object recognition, tracking, spatial computing, capture, cube, bounding box, camera, frame, shape, boundary, lidar, depth, scanning, mapping, placement |
| `ScanEyeIcon` | `@mdevs/icons/security/scan-eye` | [scan-eye.svg](../../svg/security/scan-eye.svg) | [TSX](../../src/icons/security/scan-eye.tsx) | lucide | preview, zoom, expand, fullscreen, gallery, image, camera, watch, surveillance, retina, focus, lens, biometric, identification, authentication, access, login |
| `ScanFaceIcon` | `@mdevs/icons/security/scan-face` | [scan-face.svg](../../svg/security/scan-face.svg) | [TSX](../../src/icons/security/scan-face.tsx) | lucide | face, biometric, identification, authentication, 2fa, access, login, dashed |
| `ScanHeartIcon` | `@mdevs/icons/security/scan-heart` | [scan-heart.svg](../../svg/security/scan-heart.svg) | [TSX](../../src/icons/security/scan-heart.tsx) | lucide | health, heart rate, pulse, monitoring, healthiness, screening, dashed |
| `ScanLineIcon` | `@mdevs/icons/security/scan-line` | [scan-line.svg](../../svg/security/scan-line.svg) | [TSX](../../src/icons/security/scan-line.tsx) | lucide | checkout, till, cart, transaction, purchase, buy, product, packaging, retail, consumer, qr-code, dashed |
| `ScanQrCodeIcon` | `@mdevs/icons/security/scan-qr-code` | [scan-qr-code.svg](../../svg/security/scan-qr-code.svg) | [TSX](../../src/icons/security/scan-qr-code.tsx) | lucide | barcode, scan, qrcode, url, information, digital, scanner |
| `ScanSearchIcon` | `@mdevs/icons/security/scan-search` | [scan-search.svg](../../svg/security/scan-search.svg) | [TSX](../../src/icons/security/scan-search.tsx) | lucide | preview, zoom, expand, fullscreen, gallery, image, focus, lens |
| `ScanSquareIcon` | `@mdevs/icons/security/scan-square` | [scan-square.svg](../../svg/security/scan-square.svg) | [TSX](../../src/icons/security/scan-square.tsx) | lucide | scan, square, detect, recognition, select, frame, object, viewfinder, capture, shape, boundary, camera, scanner, overlay, focus, crop, marker |
| `ScanTextIcon` | `@mdevs/icons/security/scan-text` | [scan-text.svg](../../svg/security/scan-text.svg) | [TSX](../../src/icons/security/scan-text.tsx) | lucide | recognition, read, translate, copy, lines |
| `ShieldIcon` | `@mdevs/icons/security/shield` | [shield.svg](../../svg/security/shield.svg) | [TSX](../../src/icons/security/shield.tsx) | lucide | cybersecurity, secure, safety, protection, guardian, armored, armoured, defense, defence, defender, block, threat, prevention, antivirus, vigilance, vigilant, detection, scan, find, strength, strong, tough, invincible, invincibility, invulnerable, undamaged, audit, admin, verification, crest, bravery, knight, foot soldier, infantry, trooper, pawn, battle, war, military, army, cadet, scout |
| `ShieldAlertIcon` | `@mdevs/icons/security/shield-alert` | [shield-alert.svg](../../svg/security/shield-alert.svg) | [TSX](../../src/icons/security/shield-alert.tsx) | lucide | unshielded, cybersecurity, insecure, unsecured, safety, unsafe, protection, unprotected, guardian, unguarded, unarmored, unarmoured, defenseless, defenceless, undefended, defender, blocked, stopped, intercepted, interception, saved, thwarted, threat, prevention, unprevented, antivirus, vigilance, vigilant, detection, detected, scanned, found, exploit, vulnerability, vulnerable, weakness, infection, infected, compromised, data leak, audited, admin, verification, unverified, uncertified, warning, emergency, attention, urgent, alarm, crest, bravery, strength, tough, attacked, damaged, injured, hit, expired, disabled, inactive, error, exclamation mark, ! |
| `ShieldBanIcon` | `@mdevs/icons/security/shield-ban` | [shield-ban.svg](../../svg/security/shield-ban.svg) | [TSX](../../src/icons/security/shield-ban.tsx) | lucide | unshielded, cybersecurity, insecure, unsecured, safety, unsafe, protection, unprotected, guardian, unguarded, unarmored, unarmoured, defenseless, defenceless, undefended, defender, blocked, stopped, intercepted, interception, saved, thwarted, threat, prevention, unprevented, antivirus, vigilance, vigilant, detection, detected, scanned, found, exploit, vulnerability, vulnerable, weakness, infection, infected, compromised, data leak, audited, admin, verification, unverified, uncertified, cancel, error, crest, bravery, attacked, damaged, injured, hit, expired, eliminated, disabled, inactive, / |
| `ShieldCheckIcon` | `@mdevs/icons/security/shield-check` | [shield-check.svg](../../svg/security/shield-check.svg) | [TSX](../../src/icons/security/shield-check.tsx) | lucide | cybersecurity, secured, safety, protection, protected, guardian, guarded, armored, armoured, defense, defence, defended, blocked, threat, prevention, prevented, antivirus, vigilance, vigilant, active, activated, enabled, detection, scanned, found, strength, strong, tough, invincible, invincibility, invulnerable, undamaged, audited, admin, verification, verified, certification, certified, tested, passed, qualified, cleared, cleaned, disinfected, uninfected, task, completed, todo, done, ticked, checked, crest, bravery |
| `ShieldCloseIcon` | `@mdevs/icons/security/shield-close` | [shield-close.svg](../../svg/security/shield-close.svg) | [TSX](../../src/icons/security/shield-close.tsx) | lucide | — |
| `ShieldCogIcon` | `@mdevs/icons/security/shield-cog` | [shield-cog.svg](../../svg/security/shield-cog.svg) | [TSX](../../src/icons/security/shield-cog.tsx) | lucide | cybersecurity, secure, safety, protection, guardian, armored, armoured, defense, defence, defender, block, threat, prevention, antivirus, vigilance, vigilant, detection, scan, find, strength, strong, tough, invincible, invincibility, invulnerable, undamaged, audit, admin, verification, crest, bravery, knight, foot soldier, infantry, trooper, pawn, battle, war, military, army, cadet, scout |
| `ShieldCogCornerIcon` | `@mdevs/icons/security/shield-cog-corner` | [shield-cog-corner.svg](../../svg/security/shield-cog-corner.svg) | [TSX](../../src/icons/security/shield-cog-corner.tsx) | lucide | cybersecurity, secure, safety, protection, guardian, armored, armoured, defense, defence, defender, block, threat, prevention, antivirus, vigilance, vigilant, detection, scan, find, strength, strong, tough, invincible, invincibility, invulnerable, undamaged, audit, admin, verification, crest, shieldcog, bravery, knight, foot soldier, infantry, trooper, pawn, battle, war, military, army, cadet, scout |
| `ShieldEllipsisIcon` | `@mdevs/icons/security/shield-ellipsis` | [shield-ellipsis.svg](../../svg/security/shield-ellipsis.svg) | [TSX](../../src/icons/security/shield-ellipsis.tsx) | lucide | cybersecurity, securing, protecting, guarding, armoring, armouring, defending, blocking, preventing, antivirus, detecting, scanning, finding, auditing, admin, verifying, crest, upgrading, loader, loading, throbber, progress, dots, more, etc, ..., … |
| `ShieldHalfIcon` | `@mdevs/icons/security/shield-half` | [shield-half.svg](../../svg/security/shield-half.svg) | [TSX](../../src/icons/security/shield-half.tsx) | lucide | cybersecurity, secure, safety, protection, guardian, armored, armoured, defense, defence, defender, block, threat, prevention, antivirus, vigilance, vigilant, detection, scan, strength, strong, tough, invincible, invincibility, invulnerable, undamaged, audit, admin, verification, crest, logo, sigil, flag, team, faction, fraternity, university, college, academy, school, education, uniform, bravery, knight, foot soldier, infantry, trooper, pawn, battle, war, military, ranking, army, cadet, scout |
| `ShieldKeyholeIcon` | `@mdevs/icons/security/shield-keyhole` | [shield-keyhole.svg](../../svg/security/shield-keyhole.svg) | [TSX](../../src/icons/security/shield-keyhole.tsx) | lucide | cybersecurity, secure, safety, protection, defense, defence, defender, block, threat, prevention, antivirus, vigilance, vigilant, detection, scan, find, strength, strong, tough, invincible, invincibility, invulnerable, undamaged, audit, admin, verification, crest, bravery, trooper, pawn |
| `ShieldLockIcon` | `@mdevs/icons/security/shield-lock` | [shield-lock.svg](../../svg/security/shield-lock.svg) | [TSX](../../src/icons/security/shield-lock.tsx) | lucide | antivirus, authentication, authorization, credentials, cybersecurity, data protection, defense, encryption, guard, login, password, privacy, safeguard, ssl, tls, two-factor authentication, verification, vpn |
| `ShieldMinusIcon` | `@mdevs/icons/security/shield-minus` | [shield-minus.svg](../../svg/security/shield-minus.svg) | [TSX](../../src/icons/security/shield-minus.tsx) | lucide | unshield, cybersecurity, unsecure, unguard, unblock, antivirus, clean, clear, disinfect, patch, fix, stop, cancel, remove, relax, admin, crest, bravery, weakened, damaged, hit, unarm, disable, deactivate, decommission, downgraded, minimum, - |
| `ShieldOffIcon` | `@mdevs/icons/security/shield-off` | [shield-off.svg](../../svg/security/shield-off.svg) | [TSX](../../src/icons/security/shield-off.tsx) | lucide | unshielded, cybersecurity, insecure, unsecured, safety, unsafe, protection, unprotected, guardian, unguarded, unarmored, unarmoured, defenseless, defenceless, undefended, defender, interception, threat, prevention, unprevented, antivirus, detection, undetected, exploit, vulnerability, vulnerable, weakness, infected, infection, compromised, data leak, unaudited, admin, verification, unverified, inactive, cancelled, error, crest, bravery, damaged, injured, hit, expired, eliminated |
| `ShieldPlusIcon` | `@mdevs/icons/security/shield-plus` | [shield-plus.svg](../../svg/security/shield-plus.svg) | [TSX](../../src/icons/security/shield-plus.tsx) | lucide | cybersecurity, secure, safety, protection, guardian, armored, armoured, defense, defence, defender, block, threat, prevention, antivirus, vigilance, vigilant, detection, scan, strength, strong, tough, invincible, invincibility, invulnerable, undamaged, extra, added, professional, enterprise, full, maximum, upgraded, ultra, activate, enable, audit, admin, verification, crest, medic, + |
| `ShieldQuestionMarkIcon` | `@mdevs/icons/security/shield-question-mark` | [shield-question-mark.svg](../../svg/security/shield-question-mark.svg) | [TSX](../../src/icons/security/shield-question-mark.tsx) | lucide | unshielded, cybersecurity, insecure, unsecured, safety, unsafe, protection, unprotected, guardian, unguarded, unarmored, unarmoured, defenseless, defenceless, undefended, defender, threat, prevention, unprevented, antivirus, vigilance, vigilant, detection, undetected, scan, find, exploit, vulnerability, vulnerable, weakness, infection, compromised, data leak, audit, admin, verification, unverified, uncertified, uncertain, unknown, inactive, crest, question mark, ? |
| `ShieldUserIcon` | `@mdevs/icons/security/shield-user` | [shield-user.svg](../../svg/security/shield-user.svg) | [TSX](../../src/icons/security/shield-user.tsx) | lucide | shield, user, admin, protection, protected, safety, guard |
| `VaultIcon` | `@mdevs/icons/security/vault` | [vault.svg](../../svg/security/vault.svg) | [TSX](../../src/icons/security/vault.tsx) | lucide | safe, lockbox, deposit, locker, coffer, strongbox, safety, secure, storage, valuables, bank |

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
