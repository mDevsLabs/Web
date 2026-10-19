# Communication — icônes

66 icônes de la catégorie `communication`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (54), tabler (12). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {AtSignIcon} from '@mdevs/icons';
// Alternatives :
import {AtSignIcon} from '@mdevs/icons/communication';
import {AtSignIcon} from '@mdevs/icons/communication/at-sign';
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
import {AtSignIcon} from '@mdevs/icons/communication/at-sign';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><AtSignIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <AtSignIcon size={32} title="Communication" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `AtSignIcon` | `@mdevs/icons/communication/at-sign` | [at-sign.svg](../../svg/communication/at-sign.svg) | [TSX](../../src/icons/communication/at-sign.tsx) | lucide | mention, at, email, message, @ |
| `MailIcon` | `@mdevs/icons/communication/mail` | [mail.svg](../../svg/communication/mail.svg) | [TSX](../../src/icons/communication/mail.tsx) | lucide | email, message, letter, unread |
| `MailAiIcon` | `@mdevs/icons/communication/mail-ai` | [mail-ai.svg](../../svg/communication/mail-ai.svg) | [TSX](../../src/icons/communication/mail-ai.tsx) | tabler | inbox, gmail, email, envelope, message, mail, contact, conversation, letter, post |
| `MailBadgeIcon` | `@mdevs/icons/communication/mail-badge` | [mail-badge.svg](../../svg/communication/mail-badge.svg) | [TSX](../../src/icons/communication/mail-badge.tsx) | lucide | email, message, letter, certified, registered, seal, stamp, verified, envelope, rosette, signed, official, delivery |
| `MailBitcoinIcon` | `@mdevs/icons/communication/mail-bitcoin` | [mail-bitcoin.svg](../../svg/communication/mail-bitcoin.svg) | [TSX](../../src/icons/communication/mail-bitcoin.tsx) | tabler | crypto, currency, message, virtual, send, transaction, exchange, digital, coin, transfer |
| `MailBoltIcon` | `@mdevs/icons/communication/mail-bolt` | [mail-bolt.svg](../../svg/communication/mail-bolt.svg) | [TSX](../../src/icons/communication/mail-bolt.tsx) | tabler | energy, charge, electric, quick, message, fast, rapid, speed, power, flash |
| `MailCancelIcon` | `@mdevs/icons/communication/mail-cancel` | [mail-cancel.svg](../../svg/communication/mail-cancel.svg) | [TSX](../../src/icons/communication/mail-cancel.tsx) | tabler | abort, stop, message, close, terminate, undo, revert, void, discontinue, invalidate |
| `MailCheckIcon` | `@mdevs/icons/communication/mail-check` | [mail-check.svg](../../svg/communication/mail-check.svg) | [TSX](../../src/icons/communication/mail-check.tsx) | lucide | email, message, letter, subscribe, delivered, success, read, done, todo, tick, complete, task |
| `MailClockIcon` | `@mdevs/icons/communication/mail-clock` | [mail-clock.svg](../../svg/communication/mail-clock.svg) | [TSX](../../src/icons/communication/mail-clock.tsx) | lucide | email, message, letter, unread, scheduled, delayed, sendlater, delivery, reminder, pending, outgoing, timer |
| `MailCodeIcon` | `@mdevs/icons/communication/mail-code` | [mail-code.svg](../../svg/communication/mail-code.svg) | [TSX](../../src/icons/communication/mail-code.tsx) | tabler | program, software, encrypt, message, decode, syntax, develop, language, script, compile |
| `MailCogIcon` | `@mdevs/icons/communication/mail-cog` | [mail-cog.svg](../../svg/communication/mail-cog.svg) | [TSX](../../src/icons/communication/mail-cog.tsx) | tabler | settings, gear, configure, adjust, edit, preferences, customize, message, tool, system |
| `MailDollarIcon` | `@mdevs/icons/communication/mail-dollar` | [mail-dollar.svg](../../svg/communication/mail-dollar.svg) | [TSX](../../src/icons/communication/mail-dollar.tsx) | tabler | currency, economy, finance, money, wealth, message, payment, cost, fund, transaction |
| `MailDownIcon` | `@mdevs/icons/communication/mail-down` | [mail-down.svg](../../svg/communication/mail-down.svg) | [TSX](../../src/icons/communication/mail-down.tsx) | tabler | receive, download, transfer, obtain, fetch, message, get, acquire, descend, retrieve |
| `MailExclamationIcon` | `@mdevs/icons/communication/mail-exclamation` | [mail-exclamation.svg](../../svg/communication/mail-exclamation.svg) | [TSX](../../src/icons/communication/mail-exclamation.tsx) | tabler | alert, notice, warn, caution, attention, message, important, prompt, danger, highlight |
| `MailFastIcon` | `@mdevs/icons/communication/mail-fast` | [mail-fast.svg](../../svg/communication/mail-fast.svg) | [TSX](../../src/icons/communication/mail-fast.tsx) | tabler | send, massage, quick, delivery, speed, communication, mail, fast, email, message |
| `MailForwardIcon` | `@mdevs/icons/communication/mail-forward` | [mail-forward.svg](../../svg/communication/mail-forward.svg) | [TSX](../../src/icons/communication/mail-forward.tsx) | tabler | send, recipient, email, inbox, message, mail, forward, contact, conversation, letter |
| `MailHeartIcon` | `@mdevs/icons/communication/mail-heart` | [mail-heart.svg](../../svg/communication/mail-heart.svg) | [TSX](../../src/icons/communication/mail-heart.tsx) | tabler | love, affection, care, message, devotion, emotion, passion, romance, sympathy, fondness |
| `MailMinusIcon` | `@mdevs/icons/communication/mail-minus` | [mail-minus.svg](../../svg/communication/mail-minus.svg) | [TSX](../../src/icons/communication/mail-minus.tsx) | lucide | email, message, letter, remove, delete |
| `MailOpenIcon` | `@mdevs/icons/communication/mail-open` | [mail-open.svg](../../svg/communication/mail-open.svg) | [TSX](../../src/icons/communication/mail-open.tsx) | lucide | email, message, letter, read |
| `MailPenIcon` | `@mdevs/icons/communication/mail-pen` | [mail-pen.svg](../../svg/communication/mail-pen.svg) | [TSX](../../src/icons/communication/mail-pen.tsx) | lucide | email, message, letter, pen, edit, compose, draft, write, writing, create, reply |
| `MailPlusIcon` | `@mdevs/icons/communication/mail-plus` | [mail-plus.svg](../../svg/communication/mail-plus.svg) | [TSX](../../src/icons/communication/mail-plus.tsx) | lucide | email, message, letter, add, create, new, compose |
| `MailQuestionMarkIcon` | `@mdevs/icons/communication/mail-question-mark` | [mail-question-mark.svg](../../svg/communication/mail-question-mark.svg) | [TSX](../../src/icons/communication/mail-question-mark.tsx) | lucide | email, message, letter, delivery, undelivered |
| `MailSearchIcon` | `@mdevs/icons/communication/mail-search` | [mail-search.svg](../../svg/communication/mail-search.svg) | [TSX](../../src/icons/communication/mail-search.tsx) | lucide | email, message, letter, search, lens |
| `MailWarningIcon` | `@mdevs/icons/communication/mail-warning` | [mail-warning.svg](../../svg/communication/mail-warning.svg) | [TSX](../../src/icons/communication/mail-warning.tsx) | lucide | email, message, letter, delivery error, exclamation mark |
| `MailXIcon` | `@mdevs/icons/communication/mail-x` | [mail-x.svg](../../svg/communication/mail-x.svg) | [TSX](../../src/icons/communication/mail-x.tsx) | lucide | email, message, letter, remove, delete |
| `MessageCircleIcon` | `@mdevs/icons/communication/message-circle` | [message-circle.svg](../../svg/communication/message-circle.svg) | [TSX](../../src/icons/communication/message-circle.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble |
| `MessageCircleCheckIcon` | `@mdevs/icons/communication/message-circle-check` | [message-circle-check.svg](../../svg/communication/message-circle-check.svg) | [TSX](../../src/icons/communication/message-circle-check.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, moderate, check, done, todo, complete |
| `MessageCircleCodeIcon` | `@mdevs/icons/communication/message-circle-code` | [message-circle-code.svg](../../svg/communication/message-circle-code.svg) | [TSX](../../src/icons/communication/message-circle-code.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, code review, coding |
| `MessageCircleDashedIcon` | `@mdevs/icons/communication/message-circle-dashed` | [message-circle-dashed.svg](../../svg/communication/message-circle-dashed.svg) | [TSX](../../src/icons/communication/message-circle-dashed.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, draft |
| `MessageCircleDashedCheckIcon` | `@mdevs/icons/communication/message-circle-dashed-check` | [message-circle-dashed-check.svg](../../svg/communication/message-circle-dashed-check.svg) | [TSX](../../src/icons/communication/message-circle-dashed-check.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, draft, pending, provisional, verification, confirmation, success, status, check, approval, moderate, resolved, done, complete |
| `MessageCircleHeartIcon` | `@mdevs/icons/communication/message-circle-heart` | [message-circle-heart.svg](../../svg/communication/message-circle-heart.svg) | [TSX](../../src/icons/communication/message-circle-heart.tsx) | lucide | comment, chat, conversation, dialog, feedback, positive, like, love, interest, valentine, dating, date, speech bubble |
| `MessageCircleMoreIcon` | `@mdevs/icons/communication/message-circle-more` | [message-circle-more.svg](../../svg/communication/message-circle-more.svg) | [TSX](../../src/icons/communication/message-circle-more.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, typing, writing, responding, ellipsis, etc, et cetera, ..., … |
| `MessageCircleOffIcon` | `@mdevs/icons/communication/message-circle-off` | [message-circle-off.svg](../../svg/communication/message-circle-off.svg) | [TSX](../../src/icons/communication/message-circle-off.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, clear, close, delete, remove, cancel, silence, mute, moderate |
| `MessageCirclePlusIcon` | `@mdevs/icons/communication/message-circle-plus` | [message-circle-plus.svg](../../svg/communication/message-circle-plus.svg) | [TSX](../../src/icons/communication/message-circle-plus.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, add |
| `MessageCircleQuestionMarkIcon` | `@mdevs/icons/communication/message-circle-question-mark` | [message-circle-question-mark.svg](../../svg/communication/message-circle-question-mark.svg) | [TSX](../../src/icons/communication/message-circle-question-mark.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, help |
| `MessageCircleReplyIcon` | `@mdevs/icons/communication/message-circle-reply` | [message-circle-reply.svg](../../svg/communication/message-circle-reply.svg) | [TSX](../../src/icons/communication/message-circle-reply.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, reply, response |
| `MessageCircleWarningIcon` | `@mdevs/icons/communication/message-circle-warning` | [message-circle-warning.svg](../../svg/communication/message-circle-warning.svg) | [TSX](../../src/icons/communication/message-circle-warning.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, report, abuse, offense, alert, danger, caution, protected, exclamation mark |
| `MessageCircleXIcon` | `@mdevs/icons/communication/message-circle-x` | [message-circle-x.svg](../../svg/communication/message-circle-x.svg) | [TSX](../../src/icons/communication/message-circle-x.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, clear, close, delete, remove, cancel, silence, mute, moderate |
| `MessageSquareIcon` | `@mdevs/icons/communication/message-square` | [message-square.svg](../../svg/communication/message-square.svg) | [TSX](../../src/icons/communication/message-square.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble |
| `MessageSquareCheckIcon` | `@mdevs/icons/communication/message-square-check` | [message-square-check.svg](../../svg/communication/message-square-check.svg) | [TSX](../../src/icons/communication/message-square-check.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, moderate, check, done, todo, complete |
| `MessageSquareCodeIcon` | `@mdevs/icons/communication/message-square-code` | [message-square-code.svg](../../svg/communication/message-square-code.svg) | [TSX](../../src/icons/communication/message-square-code.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, code review, coding |
| `MessageSquareDashedIcon` | `@mdevs/icons/communication/message-square-dashed` | [message-square-dashed.svg](../../svg/communication/message-square-dashed.svg) | [TSX](../../src/icons/communication/message-square-dashed.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, draft |
| `MessageSquareDiffIcon` | `@mdevs/icons/communication/message-square-diff` | [message-square-diff.svg](../../svg/communication/message-square-diff.svg) | [TSX](../../src/icons/communication/message-square-diff.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, add, patch, difference, plus, minus, plus-minus, math, code review, coding, version control, git |
| `MessageSquareDotIcon` | `@mdevs/icons/communication/message-square-dot` | [message-square-dot.svg](../../svg/communication/message-square-dot.svg) | [TSX](../../src/icons/communication/message-square-dot.tsx) | lucide | unread, unresolved, comment, chat, conversation, dialog, feedback, speech bubble |
| `MessageSquareHeartIcon` | `@mdevs/icons/communication/message-square-heart` | [message-square-heart.svg](../../svg/communication/message-square-heart.svg) | [TSX](../../src/icons/communication/message-square-heart.tsx) | lucide | comment, chat, conversation, dialog, feedback, positive, like, love, interest, valentine, dating, date, speech bubble |
| `MessageSquareLockIcon` | `@mdevs/icons/communication/message-square-lock` | [message-square-lock.svg](../../svg/communication/message-square-lock.svg) | [TSX](../../src/icons/communication/message-square-lock.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, secure, encrypted |
| `MessageSquareMoreIcon` | `@mdevs/icons/communication/message-square-more` | [message-square-more.svg](../../svg/communication/message-square-more.svg) | [TSX](../../src/icons/communication/message-square-more.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, typing, writing, responding, ellipsis, etc, et cetera, ..., … |
| `MessageSquareOffIcon` | `@mdevs/icons/communication/message-square-off` | [message-square-off.svg](../../svg/communication/message-square-off.svg) | [TSX](../../src/icons/communication/message-square-off.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, clear, close, delete, remove, cancel, silence, mute, moderate |
| `MessageSquarePlusIcon` | `@mdevs/icons/communication/message-square-plus` | [message-square-plus.svg](../../svg/communication/message-square-plus.svg) | [TSX](../../src/icons/communication/message-square-plus.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, add |
| `MessageSquareQuoteIcon` | `@mdevs/icons/communication/message-square-quote` | [message-square-quote.svg](../../svg/communication/message-square-quote.svg) | [TSX](../../src/icons/communication/message-square-quote.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, blockquote, quotation, indent, reply, response |
| `MessageSquareReplyIcon` | `@mdevs/icons/communication/message-square-reply` | [message-square-reply.svg](../../svg/communication/message-square-reply.svg) | [TSX](../../src/icons/communication/message-square-reply.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, reply, response |
| `MessageSquareShareIcon` | `@mdevs/icons/communication/message-square-share` | [message-square-share.svg](../../svg/communication/message-square-share.svg) | [TSX](../../src/icons/communication/message-square-share.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, network, forward |
| `MessageSquareTextIcon` | `@mdevs/icons/communication/message-square-text` | [message-square-text.svg](../../svg/communication/message-square-text.svg) | [TSX](../../src/icons/communication/message-square-text.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble |
| `MessageSquareWarningIcon` | `@mdevs/icons/communication/message-square-warning` | [message-square-warning.svg](../../svg/communication/message-square-warning.svg) | [TSX](../../src/icons/communication/message-square-warning.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, report, abuse, offense, alert, danger, caution, protected, exclamation mark |
| `MessageSquareXIcon` | `@mdevs/icons/communication/message-square-x` | [message-square-x.svg](../../svg/communication/message-square-x.svg) | [TSX](../../src/icons/communication/message-square-x.tsx) | lucide | comment, chat, conversation, dialog, feedback, speech bubble, clear, close, delete, remove, cancel, silence, mute, moderate |
| `PhoneIcon` | `@mdevs/icons/communication/phone` | [phone.svg](../../svg/communication/phone.svg) | [TSX](../../src/icons/communication/phone.tsx) | lucide | call |
| `PhoneCallIcon` | `@mdevs/icons/communication/phone-call` | [phone-call.svg](../../svg/communication/phone-call.svg) | [TSX](../../src/icons/communication/phone-call.tsx) | lucide | ring |
| `PhoneForwardedIcon` | `@mdevs/icons/communication/phone-forwarded` | [phone-forwarded.svg](../../svg/communication/phone-forwarded.svg) | [TSX](../../src/icons/communication/phone-forwarded.tsx) | lucide | call |
| `PhoneIncomingIcon` | `@mdevs/icons/communication/phone-incoming` | [phone-incoming.svg](../../svg/communication/phone-incoming.svg) | [TSX](../../src/icons/communication/phone-incoming.tsx) | lucide | call |
| `PhoneMissedIcon` | `@mdevs/icons/communication/phone-missed` | [phone-missed.svg](../../svg/communication/phone-missed.svg) | [TSX](../../src/icons/communication/phone-missed.tsx) | lucide | call |
| `PhoneOffIcon` | `@mdevs/icons/communication/phone-off` | [phone-off.svg](../../svg/communication/phone-off.svg) | [TSX](../../src/icons/communication/phone-off.tsx) | lucide | call, mute |
| `PhoneOutgoingIcon` | `@mdevs/icons/communication/phone-outgoing` | [phone-outgoing.svg](../../svg/communication/phone-outgoing.svg) | [TSX](../../src/icons/communication/phone-outgoing.tsx) | lucide | call |
| `SendIcon` | `@mdevs/icons/communication/send` | [send.svg](../../svg/communication/send.svg) | [TSX](../../src/icons/communication/send.tsx) | lucide | email, message, mail, paper airplane, paper aeroplane, submit |
| `SendHorizonalIcon` | `@mdevs/icons/communication/send-horizonal` | [send-horizonal.svg](../../svg/communication/send-horizonal.svg) | [TSX](../../src/icons/communication/send-horizonal.tsx) | lucide | — |
| `SendToBackIcon` | `@mdevs/icons/communication/send-to-back` | [send-to-back.svg](../../svg/communication/send-to-back.svg) | [TSX](../../src/icons/communication/send-to-back.tsx) | lucide | bring, send, move, under, back, backwards, overlap, layer, order |
| `SpeechIcon` | `@mdevs/icons/communication/speech` | [speech.svg](../../svg/communication/speech.svg) | [TSX](../../src/icons/communication/speech.tsx) | lucide | disability, disabled, dda, human, accessibility, people, sound |

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
