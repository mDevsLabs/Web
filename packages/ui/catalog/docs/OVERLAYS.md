# Fenêtres, menus, popovers et notifications

Les primitives d'overlay de `@mdevs/ui` encapsulent Radix avec des props limitées et un thème transmis au portail. Les références du monorepo sont `packages/ui/src/primitives/dialog.tsx`, `drawer.tsx`, `confirm-dialog.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `command-palette.tsx`, `toast-provider.tsx` et `packages/ui/src/internal/theme.tsx`.

## Choisir la primitive selon l'interaction

| Primitive | Usage | Contrat et limite |
| --- | --- | --- |
| `Dialog` | Édition ou action dans une fenêtre modale | `title` obligatoire, description/trigger/footer facultatifs, `open` ou `defaultOpen`. |
| `Drawer` | Même interaction sous forme de panneau latéral/bas | `side: 'left' \| 'right' \| 'bottom'`, titre obligatoire; pas de footer dédié. |
| `ConfirmDialog` | Confirmation simple avec action immédiate | `title`, `description`, `trigger`, `onConfirm`; ferme lors du clic et n'attend pas une Promise. |
| `Popover` | Information ou petit contrôle contextuel | `label` et `trigger` obligatoires; `side` optionnel, `open` et `onOpenChange` possibles. |
| `DropdownMenu` | Liste de commandes contextuelles | `label`, `trigger`, `items`; callbacks par item, pas d'état public `open`. |
| `Tooltip` | Aide supplémentaire sur un contrôle focusable | `content`, `children`, `delayDuration`, `side`; pas de formulaire interactif dedans. |
| `CommandPalette` | Recherche et lancement de commandes | `items`, `open?`, `onOpenChange?`, `trigger?`, `title?`; résultats parcourus par Tab. |
| `ToastProvider` | Notifications locales de résultat | `useToast().notify()` / `dismiss()`, trois messages visibles au plus; pas de portail. |

`Drawer` est une fenêtre modale Radix présentée en panneau. Il ne fournit pas de glissement tactile ni de points d'accroche. `ConfirmDialog` repose sur `Dialog` et n'est pas une API `AlertDialog`. `CommandPalette` n'implémente pas une combobox ARIA à navigation fléchée. Ces distinctions évitent de promettre des interactions absentes.

## Un déclencheur qui transmet les props et la ref

Les triggers utilisent `asChild`. Fournir exactement un élément React capable de recevoir les attributs d'événement, ARIA et une ref :

```tsx
import {Button, Dialog} from '@mdevs/ui';

export function HelpDialog() {
  return <Dialog
    title="Aide à la facturation"
    description="Consultez les règles de votre application avant de créer une facture."
    trigger={<Button variant="outline">Ouvrir l'aide</Button>}
  >
    <p>Le statut de facture doit correspondre à la situation réelle du dossier.</p>
  </Dialog>;
}
```

`Button` et `IconButton` transmettent leur ref. Un bouton natif convient également. Une chaîne, un fragment contenant plusieurs éléments ou un composant personnalisé qui ignore les props reçues peut casser l'ouverture, le nom accessible ou le retour du focus.

Si un composant déclencheur personnalisé est nécessaire, rendre un vrai bouton, transmettre les attributs et la ref, et ne pas remplacer silencieusement les handlers fournis par Radix. Sous React 18, `forwardRef` est la manière habituelle de transmettre cette ref.

## Choisir l'état non contrôlé ou contrôlé

Une fenêtre simple peut utiliser seulement un trigger, comme ci-dessus. `Dialog` et `Drawer` acceptent `defaultOpen`, qui initialise leur état interne. Une fenêtre à fermer après sauvegarde demande plutôt `open` et `onOpenChange` :

```tsx
'use client';
import {useState} from 'react';
import {Button, Dialog} from '@mdevs/ui';

export function ControlledHelp() {
  const [open, setOpen] = useState(false);
  return <Dialog
    title="Vérifier les informations"
    open={open} onOpenChange={setOpen}
    trigger={<Button>Vérifier</Button>}
    footer={<Button variant="outline" onClick={() => setOpen(false)}>J'ai compris</Button>}
  >
    <p>Vérifiez l'adresse du client avant l'envoi.</p>
  </Dialog>;
}
```

Passer `open={false}` sans un callback qui change cet état empêche le trigger d'ouvrir la fenêtre. Passer `open={true}` sans accepter les changements empêche sa fermeture. Ne pas utiliser `defaultOpen` pour essayer de resynchroniser une fenêtre existante.

`Popover` et `CommandPalette` exposent `open`/`onOpenChange` mais pas `defaultOpen` dans leurs interfaces publiques. `DropdownMenu` et `ConfirmDialog` ne proposent pas d'état d'ouverture public dans cette version.

## Sauvegarde asynchrone dans une fenêtre

`examples/docs/ui-controlled-dialog.tsx` contient un flux complet de renommage de projet :

1. `Dialog` reçoit l'état `open` du parent.
2. Un formulaire valide le nom après `trim()` et place le focus sur le champ si nécessaire.
3. Le parent active pending et bloque les demandes de fermeture pendant la requête.
4. La fenêtre se ferme seulement après une réponse réussie et une notification annonce le résultat.
5. En échec, le message et la saisie restent dans la fenêtre; l'utilisateur peut réessayer ou annuler.

Le refus de fermeture pendant la requête est une politique de cet exemple, pas un comportement automatique du package. Le bouton interne de fermeture reste visible et émet un changement que le parent ignore. L'exemple annonce cet état dans le contenu. Pour une requête lente, une politique avec annulation effective peut mieux convenir; l'application doit alors arrêter le travail ou définir ce qui continue après fermeture. Un simple `setOpen(false)` n'annule aucune requête.

Un callback métier qui retourne une Promise n'est pas attendu par les wrappers. Attraper ses erreurs dans l'application. `ConfirmDialog` ferme immédiatement quand son bouton de confirmation est cliqué; il n'expose ni `pending`, ni état d'ouverture, ni erreurs. Pour une confirmation de suppression dont l'échec doit rester visible, utiliser un `Dialog` contrôlé avec des boutons explicites et les états nécessaires.

Un `Dialog.footer` se trouve après le conteneur de children. Si le bouton de sauvegarde est dans le footer et le `<form>` dans children, il n'est pas automatiquement dans ce formulaire. Garder le bouton submit dans le formulaire ou lui donner `form="id-du-formulaire"` avec un formulaire portant cet `id`. `Button` a par défaut `type="button"`.

## Accessibilité et focus

Les titres de `Dialog` et `Drawer` sont rendus par les composants `Title` Radix. `description` associe un texte complémentaire lorsqu'il existe; les fenêtres sans description n'exposent pas une référence vers un élément absent. Les titres ne doivent pas être vides. `closeLabel` permet de personnaliser le nom du bouton de fermeture pour `Dialog` et `Drawer`.

Radix fournit la gestion de focus modale, la fermeture par clavier et le retour au trigger dans les usages ordinaires. L'intégration doit vérifier :

- Ouverture avec clavier et pointeur.
- Présence du titre et, si utile, de la description dans l'arbre d'accessibilité.
- Accès à tous les champs/boutons avec Tab et Shift+Tab.
- Fermeture par Échap et par les boutons attendus, selon la politique de pending.
- Focus rendu au trigger conservé dans le DOM.

Les ouvertures programmatiques sans trigger n'ont pas de déclencheur déclaré auquel revenir. Une action qui supprime le trigger peut aussi invalider ce retour. Définir une cible applicative logique et vérifier le moment de restitution. Les wrappers n'exposent pas `onCloseAutoFocus`; ne pas passer cette prop en supposant qu'elle sera acceptée. Si le projet a besoin d'une orchestration précise, employer une primitive qui expose réellement ces options.

L'exemple de renommage conserve son trigger après sauvegarde. Pour une suppression de ligne, le bouton de la ligne peut disparaître; la ligne suivante, le titre de liste ou le bouton de création peut servir de cible selon le parcours. Éviter de laisser le focus revenir au body sans décision explicite.

Une icône décorative dans un bouton n'apporte pas de nom à elle seule; `IconButton` exige un `label`. Un tooltip apporte une aide, mais ne remplace pas ce label et ne doit pas contenir une instruction indispensable inaccessible sur écran tactile.

## Le thème des portails

Les overlays portalisés gardent leur contexte React mais sortent de leur parent DOM. `PortalScope` crée un wrapper `.md-root.md-portal-scope` avec `display: contents` et recopie :

- `theme`, `glass`, `accent` et `radius` du `ThemeProvider`;
- les clés CSS commençant par `--` présentes dans sa prop `style`.

```tsx
import type {CSSProperties, ReactNode} from 'react';
import {ThemeProvider} from '@mdevs/ui';

export function GlassScope({children}: {children: ReactNode}) {
  const tokens = {
    '--md-blur': '12px',
    '--md-input-radius': '10px',
    '--md-accent-ink': '#ffffff',
  } as CSSProperties;
  return <ThemeProvider theme="dark" accent="#4f46e5" radius="18px" style={tokens}>
    {children}
  </ThemeProvider>;
}
```

Les props `accent` et `radius` passent après `style` et prennent le dessus sur les variables équivalentes. Les propriétés de layout comme `padding` et les classes du provider ne suivent pas le portail. Des tokens définis seulement dans `.app-shell { --md-blur: 12px; }` ne seront pas nécessairement disponibles sur le portail : utiliser `ThemeProvider.style` pour les partager.

Le wrapper ne transmet pas toutes les props de Radix. Les interfaces actuelles de `Dialog` et `Drawer` ne proposent pas `container`, `modal`, `forceMount`, `className` de contenu, `onOpenAutoFocus`, `onCloseAutoFocus` ni `onEscapeKeyDown`. Ne pas essayer de configurer un portail dans un shadow root via une option qui n'existe pas. Choisir une composition adaptée quand le projet exige ce niveau de contrôle.

## Menus et popovers

Le menu reçoit des commandes indépendantes :

```tsx
import {Button, DropdownMenu} from '@mdevs/ui';

export function InvoiceActions({openDetails, startArchive, canArchive}: {
  openDetails: () => void;
  startArchive: () => void;
  canArchive: boolean;
}) {
  return <DropdownMenu
    label="Actions de la facture"
    trigger={<Button variant="outline">Actions</Button>}
    items={[
      {id: 'details', label: 'Voir la fiche', onSelect: openDetails},
      {id: 'archive', label: 'Archiver', onSelect: startArchive, disabled: !canArchive, separatorBefore: true},
    ]}
  />;
}
```

`danger` change le style d'un item; ce n'est pas un mécanisme de validation ou de confirmation. `disabled` empêche sa sélection dans le menu, sans remplacer l'autorisation serveur. `onSelect` est un callback sans argument, pas l'ensemble de l'événement Radix permettant de contrôler la fermeture. Une commande asynchrone doit gérer erreur/pending dans l'application.

Pour une explication contextuelle, préférer un `Popover` :

```tsx
import {Button, Popover} from '@mdevs/ui';

export function AmountHelp() {
  return <Popover label="Aide sur le montant" side="bottom" trigger={<Button variant="ghost">Comment saisir le montant ?</Button>}>
    <p>Utilisez la devise définie par votre application et vérifiez les décimales avant de sauvegarder.</p>
  </Popover>;
}
```

Le popover n'expose pas de bouton close automatique ni de description spécialisée; adapter le contenu et choisir une fenêtre modale si le parcours demande une confirmation importante. `side` détermine le côté préféré; la mise en place tient compte du moteur de positionnement Radix et des contraintes de viewport.

## Palette de commandes

`CommandPalette` filtre les libellés et keywords en ignorant la casse. Les résultats sont des boutons fermant la fenêtre lors de leur sélection. La recherche est remise à vide lorsque la fenêtre reçoit une fermeture via son callback Radix. Une fermeture forcée uniquement par une nouvelle prop `open={false}` ne passe pas nécessairement par ce callback; définir au niveau applicatif la politique d'état si c'est le mode utilisé.

Le contrôle se parcourt par Tab. La version actuelle ne configure pas de raccourci global `⌘K`/`Ctrl+K`; l'application peut installer son propre handler client, vérifier les conflits et appeler `setOpen(true)`. Ne pas annoncer une navigation fléchée, un role combobox ou un raccourci automatique absent du code.

## Notifications

```tsx
'use client';
import {useState} from 'react';
import {Button, Cluster, ThemeProvider, ToastProvider, useToast} from '@mdevs/ui';

function NotificationAction() {
  const [messageId, setMessageId] = useState<string>();
  const {notify, dismiss} = useToast();
  return <Cluster>
    <Button onClick={() => setMessageId(notify({title: 'Notification de démonstration', duration: 0}))}>
      Afficher une notification
    </Button>
    <Button variant="outline" disabled={!messageId} onClick={() => {
      if (messageId) dismiss(messageId);
      setMessageId(undefined);
    }}>Fermer la dernière notification</Button>
  </Cluster>;
}

export function NotificationExample() {
  return <ThemeProvider theme="system">
    <ToastProvider><NotificationAction/></ToastProvider>
  </ThemeProvider>;
}
```

Le hook retourne un identifiant permettant un `dismiss(id)` explicite. Par défaut, un message expire après 5 000 ms; une durée `<=0` le conserve jusqu'à fermeture ou éviction par la limite de trois messages. Les notifications utilisent une région `aria-live="polite"`; une erreur de champ requiert généralement un message durable plus proche du contrôle. Les timers sont nettoyés au démontage du provider.

La liste est positionnée en fixed mais reste dans le DOM du provider, sans portail. Un ancêtre transformé ou un contexte d'empilement particulier peut changer son positionnement apparent. Placer le provider à un niveau adapté de l'application et vérifier les superpositions réelles.

## Taille, empilement et diagnostic

Le CSS courant place les overlays à `z-index: 1000`, dialogs/drawers à `1001`, menus/popovers à `1002`, tooltips à `1003` et notifications à `1010`. Ces valeurs ne sont pas exposées via un token de z-index. Si l'application utilise un autre système d'empilement, contrôler son CSS et ses contexts; un `z-index` ajouté au trigger ne reconfigure pas le contenu portalisé.

La fenêtre a une largeur maximale de `32rem` et un débordement vertical local; les drawers latéraux atteignent `26rem`, le drawer bas `85dvh`. Les dimensions viennent de `src/styles.css`, pas de props de taille publiques. Tester clavier mobile, contenu long et viewport cible. Éviter les imbrications de modales sans vérifier le focus, l'empilement et la restitution au bon niveau.

| Symptôme | Piste de résolution |
| --- | --- |
| Le trigger ne réagit pas | Vérifier l'élément `asChild`, la transmission de ref/props et l'état contrôlé. |
| Impossible de fermer la fenêtre | Vérifier `onOpenChange`, la valeur `open` et une politique pending encore active. |
| Fermeture avant réponse réseau | `ConfirmDialog` ferme immédiatement; employer `Dialog` contrôlé. |
| Le bouton du footer ne soumet pas | Vérifier `type="submit"` et l'association au formulaire. |
| Tokens différents dans le modal | Passer les variables via `ThemeProvider.style` plutôt que seulement sur son wrapper CSS. |
| Focus perdu après suppression | Le trigger existe-t-il encore ? Choisir une cible applicative de secours. |
| Recherche de commandes encore présente après réouverture | Vérifier comment `open` est changé et si le callback interne de fermeture est passé. |
| Une notification n'est pas persistante | Vérifier sa durée et la limite de trois messages visibles. |

Pour les formulaires contenus dans une fenêtre, lire [FORM_PATTERNS.md](FORM_PATTERNS.md). Les recommandations de contenu, contraste et lecteurs d'écran se trouvent dans [ACCESSIBILITY.md](ACCESSIBILITY.md). N'annoncer une validation Safari, Firefox ou iOS qu'après un contrôle effectué dans ces environnements.
