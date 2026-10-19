# API, contrats et états

Les fichiers `src/**/*.tsx`, leurs modèles et les déclarations `dist/**/*.d.ts` décrivent l’API réelle. `catalog/manifest.json` indexe les exports, imports, fixtures et types. Les fiches `catalog/components/<catégorie>/<nom>.md` détaillent chaque composant. Ce guide explique les conventions qui permettent de relier ces contrats à une application.

## 1. Surfaces publiques

| Surface | Exemple d’import | Contenu |
| --- | --- | --- |
| Racine UI | @mdevs/ui | Primitives, domaines, types et hook useToast |
| Ensemble de primitives | @mdevs/ui/primitives | Composants fondamentaux |
| Primitive ciblée | @mdevs/ui/primitives/button | Export Button et ButtonProps |
| Domaine | @mdevs/ui/invoice | Modèle, types associés et dix familles |
| Composant ciblé | @mdevs/ui/invoice/invoice-form | Export InvoiceForm et ses props |
| CSS | @mdevs/ui/styles.css | Tokens et styles sous @layer mdevs |
| Racine icônes | @mdevs/icons | Icônes nommées, createIcon et types |
| Icône ciblée | @mdevs/icons/arrows/arrow-right | Export ArrowRightIcon |
| Fabrication d’icône | @mdevs/icons/core | createIcon, IconProps, IconNode |
| Catalogue JSON | @mdevs/ui/catalog ou @mdevs/icons/catalog | Inventaire machine |

Les chemins `src/internal` ne sont pas des sous-chemins applicatifs publics. Les sources restent distribuées pour inspection. Les entrées ESM, CommonJS et leurs types sont choisies par `exports` ; des chemins que Node pourrait lire par chemin de fichier ne sont pas nécessairement importables par le nom du package.

## 2. Primitives : types natifs et références

Les primitives proches d’un élément HTML reprennent généralement ses attributs : Input, Textarea, Button, Link, Form, DateInput, PasswordInput et NumberInput. Vérifier les exclusions de leur interface ; certains wrappers remplacent `onChange` par `onValueChange`, ou interdisent de fournir un `type` qui contredirait leur fonction.

Les refs exposées explicitement ciblent le DOM : Button/IconButton → HTMLButtonElement, Input/SearchInput/NumberInput/PasswordInput/DateInput → HTMLInputElement, Textarea → HTMLTextAreaElement, Select → HTMLSelectElement. Les autres composants n’exposent pas tous une ref ou tous les paramètres Radix.

| Groupe | Composants utiles | Contrat principal |
| --- | --- | --- |
| Thème/surfaces | ThemeProvider, GlassSurface, GlassCard, GlassPanel | Thème CSS, contenu et anatomie de surface |
| Layout | Container, Grid, Stack, Cluster, AspectRatio | Dimensions et espacement ; pas de routeur |
| Texte | Text, Heading, Paragraph, Code, Kbd, Link | Sémantique HTML et typographie |
| Actions | Button, IconButton, CopyButton, ButtonGroup | Handler utilisateur et nom accessible |
| États | Badge, StatusBadge, Alert, EmptyState, Skeleton, Spinner | Présentation sémantique d’un état |
| Champs | Input, Textarea, Select, NumberInput, PasswordInput, DateInput | Valeurs et attributs natifs appropriés |
| Choix | Checkbox, Switch, RadioGroup, RangeSlider, Rating, SegmentedControl | États contrôlés ou options du contrat |
| Données | DataTable, DescriptionList, Stat, Progress, Meter | Présentation de données fournies |
| Navigation | Breadcrumbs, Pagination, NavigationMenu, Stepper, TreeView | Liens/étapes/actions ; aucun routeur imposé |
| Overlays | Dialog, Drawer, Popover, Tooltip, DropdownMenu, ConfirmDialog | Rendu Radix et wrappers bornés |
| Composition | Tabs, Accordion, Timeline, NotificationCenter | Items et callbacks selon le composant |
| Contextes/actions locales | ToastProvider/useToast, CommandPalette, FileUpload, UploadProgress, TagInput | Interaction locale ; transport à connecter |

Ce tableau n’énumère pas toutes les signatures. Utiliser la fiche individuelle ou le source du composant avant d’en déduire une prop.

## 3. Valeurs et états contrôlés

| Composant | Valeur | Callback | Initialisation autonome |
| --- | --- | --- | --- |
| Input/Textarea/Select | value | onChange(event) | defaultValue natif |
| NumberInput | value | onValueChange(number ou undefined) | defaultValue natif |
| SearchInput | value | onValueChange(string) | defaultValue natif |
| Checkbox | checked | onCheckedChange(boolean ou indeterminate) | defaultChecked Radix |
| Switch | checked | onCheckedChange(boolean) | defaultChecked Radix |
| RadioGroup/Rating | value | onValueChange | defaultValue |
| Tabs/Accordion | value | onValueChange | defaultValue |
| SegmentedControl | value obligatoire | onValueChange obligatoire | Aucune prop defaultValue |
| TagInput | value obligatoire | onValueChange obligatoire | Aucune prop defaultValue |
| Pagination | page obligatoire | onPageChange obligatoire | État fourni par le parent |

Une prop contrôlée doit évoluer après le callback pour afficher la nouvelle valeur. Ne pas confondre l’événement natif avec une valeur : `Input` reçoit `onChange={event => ...}` alors que `NumberInput` transmet directement un nombre ou `undefined`.

Les types de Radix sont repris pour Checkbox/Switch ; une checkbox peut être indéterminée. Le callback ne retourne pas un objet métier. Le contrat de chaque composant est plus précis qu’une règle générale « tous les contrôles utilisent onChange ».

## 4. Boutons, soumission et états de travail

`Button` utilise `type="button"` par défaut. Pour soumettre, fournir `type="submit"`. `loading` désactive l’action et expose un état `aria-busy` ; il ne lance pas une tâche et ne gère pas sa durée. `IconButton` exige `label`. Un état `disabled`/`pending` doit refléter le traitement réellement en cours.

`CopyButton` écrit dans le presse-papiers depuis une action utilisateur, confirme la copie et expose `onCopied`/`onError`. Le presse-papiers dépend du contexte du navigateur ; un échec n’est pas transformé automatiquement en toast d’erreur.

`FileUpload` retourne les fichiers sélectionnés via `onFilesChange`. Il n’envoie rien. `UploadProgress` affiche une progression et délègue l’annulation ; il ne calcule pas l’état d’une requête.

## 5. Dix familles métier

Toutes les familles d’un domaine X disposent d’un export et d’un module propre. Les contrats de données diffèrent par domaine tandis que les rendus communs vivent dans `internal/domain.tsx`.

| Famille | Props spécifiques | Comportement |
| --- | --- | --- |
| XCard | item: X | Fiche d’un élément et de ses champs |
| XList | items: readonly X[], onSelect?, emptyMessage? | Liste ; action par élément quand onSelect existe |
| XTable | items: readonly X[], emptyMessage? | Table triée localement par boutons d’en-tête |
| XForm | initialValues?: Partial<X>, onSubmit, pending?, submitLabel? | Champs natifs et soumission du modèle sans id |
| XFilters | query, onQueryChange, status?, onStatusChange? | Saisie contrôlée ; aucun filtrage de données implicite |
| XTimeline | events: readonly XActivity[], emptyMessage? | Historique dans l’ordre reçu |
| XStats | metrics: readonly XMetric[] | Valeurs reçues ; aucun calcul automatique |
| XEmptyState | message?, actionLabel?, onAction? | Action affichée quand libellé et callback sont présents |
| XSettings | values: XSettingsValues, onChange | Interrupteurs contrôlés sur les clés du domaine |
| XOverview | items: readonly X[], metrics: readonly XMetric[] | Synthèse et cinq premiers éléments au maximum |

Les props communes incluent `title`, `description`, `actions`, `className`, `style` et les attributs de région. Les interfaces excluent les gestionnaires HTML qui entreraient en conflit avec les callbacks métier. `children` n’est pas le mécanisme pour remplacer l’anatomie d’un composant métier ; composer les primitives lorsqu’une structure personnalisée est nécessaire.

## 6. Modèle concret : Invoice

```tsx
import type {Invoice, InvoiceStatus, InvoiceMetric, InvoiceSettingsValues} from '@mdevs/ui/invoice';

const invoice: Invoice = {
  id: 'invoice-104',
  number: 'INV-2026-104',
  customer: 'Maison Horizon',
  amount: 128,
  dueDate: '2026-10-04',
  status: 'sent',
};
const status: InvoiceStatus = 'paid';
const metrics: InvoiceMetric[] = [
  {id:'totalInvoice', label:'Factures', value:24},
  {id:'activeInvoice', label:'À payer', value:6},
  {id:'valueInvoice', label:'Total affiché', value:'3 072 €'},
];
const settings: InvoiceSettingsValues = {
  notifyInvoice:true,
  archiveInvoice:false,
  approveInvoice:true,
};
```

Le type `InvoiceStatus` est `draft | sent | paid | overdue`. Les IDs de métriques sont propres au domaine. Les réglages sont un Partial Record : une clé absente est affichée comme non cochée. `InvoiceActivity` reprend id/title/date/description et peut inclure une référence d’entité ; le runtime d’historique n’effectue pas de jointure depuis cette référence.

La monnaie et le fuseau ne sont pas déduits du modèle. Le type numérique de `amount` n’indique pas à lui seul une devise ou une unité centime. Définir ces conventions dans l’application, sans les attribuer au package.

## 7. Formulaire métier : cycle et limites

`initialValues` est initial, pas une valeur contrôlée. Modifier cette prop après le montage ne réinitialise pas automatiquement les champs. Afficher le formulaire après chargement ou choisir un `key` stable par identité selon le parcours voulu.

La soumission normale : validation HTML native → FormData → conversion des champs → callback `onSubmit`. Les chaînes sont trimées. Le champ id n’est pas produit. Une valeur numérique vide devient `undefined` dans le parseur ; les modèles générés déclarent leurs champs requis, et le navigateur impose `required` lors du parcours normal. Une invocation programmatique qui contourne cette validation ne transforme pas le cast en validation exhaustive.

Le formulaire ne capture pas les rejets asynchrones. Le parent gère `pending`, les erreurs et la réussite. Il n’expose pas une prop générique `errors`, `reset`, `validationSchema`, `locale` ou un ref de formulaire. Pour des règles avancées, utiliser les primitives décrites dans [FORM_PATTERNS](FORM_PATTERNS.md).

## 8. Tables et rendu personnalisé

`XTable` suit le schéma du domaine et affiche les valeurs brutes. Le tri se fait localement ; les valeurs numériques sont comparées numériquement, les autres par comparaison de chaînes. Le tableau ne possède pas de pagination serveur, de virtualisation ou de hook de tri exposé.

`DataTable<T>` accepte des colonnes avec `key`, `label`, `render` et `sortable`, des `rows`, un `getRowKey` et un `caption`. Il sert lorsqu’une cellule a besoin de formatage ou d’actions. Préférer des clés stables et uniques. Les tableaux larges défilent dans une région locale nommée et focusable.

## 9. Overlays et contexte

Dialog/Drawer acceptent `open`, `defaultOpen` et `onOpenChange`. Leurs déclencheurs utilisent `asChild`. Popover est nommé via `label`, Tooltip demande un élément déclencheur et DropdownMenu reçoit un tableau d’actions.

Les wrappers n’exposent pas toute l’API Radix sous-jacente. `ConfirmDialog` ferme immédiatement sur l’action de confirmation et ne fournit pas un mode pending/open contrôlé. Pour un processus asynchrone qui doit rester ouvert, composer Dialog avec les états appropriés. [OVERLAYS](OVERLAYS.md) détaille focus, titres, fermeture et contraintes des portails.

`ToastProvider` crée un contexte local. `useToast` doit être appelé à l’intérieur ; il expose `notify` et `dismiss`. La durée par défaut est 5 000 ms ; une durée de 0 conserve la notification jusqu’à fermeture. Le provider conserve les trois dernières notifications visibles. Le contexte n’est pas un centre de notifications persistant.

## 10. Adaptation des textes et accessibilité

Les configurations métier sont françaises et leurs codes de statuts sont des chaînes anglaises. Les primitives acceptent des libellés personnalisés. Cette version ne fournit pas un moteur de locale pour toutes les familles métier.

Les props natives permettent de relier labels, descriptions et états. La conformité dépend du contenu hôte : un champ sans label reste incomplet même si son style est correct. Field affiche hint/error mais l’application relie les IDs au contrôle. Les titres métier sont h3 ; organiser la hiérarchie de la page en conséquence.

Les informations de contrat ici complètent les fiches individuelles. Quand la page souhaitée dépasse leur périmètre, composer les primitives et expliciter la responsabilité du code applicatif.

## Extensions et style 0.2.0

Les 60 primitives nouvelles se trouvent sous les mêmes imports publics primitives et disposent de fiches complètes. Les quatre modèles supplémentaires exposent dix familles chacun. Voir [EXTENSIONS.md](EXTENSIONS.md) pour sélectionner une interaction et [STYLE.md](STYLE.md) pour les règles de création.

Le CSS UI fournit désormais Inter variable locale avec sa licence, le flou par défaut passe à 12 px et Icons adopte une couleur propre noir/blanc et un trait 1,5 px. Les valeurs color/style/strokeWidth restent personnalisables. Ces défauts visuels sont des évolutions annoncées, tandis que les anciens noms/sous-chemins restent disponibles.
