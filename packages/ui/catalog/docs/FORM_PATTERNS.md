# Formulaires, validation et persistance

Ce guide décrit les formulaires réels de `@mdevs/ui` 0.2.0. Les références de code du monorepo sont `packages/ui/src/internal/domain.tsx`, `packages/ui/src/primitives/form.tsx`, `field.tsx`, `number-input.tsx` et `packages/ui/src/components/<domaine>/<domaine>-form.tsx`. Dans un package autonome, lire les mêmes chemins sous `src/`.

## Choisir entre un formulaire métier et une composition

| Situation | Formulaire recommandé | Raison |
| --- | --- | --- |
| Tous les champs correspondent à la configuration de domaine | `XForm` | Champs et types fournis, moins de code applicatif. |
| Erreur globale de sauvegarde, sans erreurs détaillées par champ | `XForm` avec une `Alert` externe | L'erreur se gère dans le parent. |
| Validation croisée ou messages serveur par champ | `Form` + `Field` + champs | Le formulaire métier ne propose ni resolver ni erreurs par champ. |
| Aperçu à chaque frappe ou synchronisation de valeurs externes | Composition contrôlée | `XForm` utilise des champs non contrôlés. |
| Champs, labels ou ordre différents de la configuration métier | Composition de primitives | Évite de dépendre d'un schéma de rendu inadéquat. |
| Intégration avec une bibliothèque de formulaires existante | Primitives dont les props et refs conviennent | Pas de dépendance obligatoire ni adaptateur universel inclus. |

Les types ne constituent pas une validation d'exécution. Une validation côté client aide l'utilisateur; le service hôte doit contrôler les données, les droits et les règles métier avant persistance.

## Le contrat exact de XForm

Exemple de contrat pour une facture :

```ts
initialValues?: Partial<Invoice>;
onSubmit: (value: Omit<Invoice, 'id'>) => void;
submitLabel?: string;
pending?: boolean;
```

La forme visuelle est un `<form>` à l'intérieur d'une section métier. Les props HTML de `InvoiceForm` concernent sa section externe; passer `noValidate`, `action` ou `onReset` comme si elles ciblaient le formulaire interne n'est pas un contrat fourni. Ne pas placer `InvoiceForm` dans un autre `<form>`.

Le moteur partagé :

1. Appelle `preventDefault()` lors de la soumission.
2. Lit `FormData` du formulaire interne.
3. Parcourt les champs de configuration, pas toutes les propriétés d'`initialValues`.
4. Convertit chaque valeur en chaîne et applique `trim()`.
5. Pour un champ `number`, renvoie `undefined` si la chaîne est vide, sinon `Number(raw)`.
6. Appelle `onSubmit` avec les valeurs; `id` n'appartient pas aux champs et est omis.

La validation HTML native `required`, `email`, `url`, `date` et `number` s'applique lors d'une interaction normale dans le navigateur. Un champ texte `required` peut néanmoins accepter une chaîne constituée d'espaces, que `trim()` transforme ensuite en chaîne vide. Un déclenchement programmatique ou un test qui émet directement l'événement de soumission peut aussi contourner la validation native. Contrôler explicitement les règles nécessaires dans l'application et au serveur.

Les champs numériques ne définissent ni minimum, ni plafond, ni politique décimale métier. L'argent n'est pas converti en centimes et les valeurs négatives ne sont pas rejetées par le modèle. L'application doit définir unité, devise, arrondi et plage admissible.

## Initialisation, édition et réinitialisation

Les champs utilisent `defaultValue`. `initialValues` initialise les champs au montage, puis la saisie vit dans le DOM. Modifier cet objet pendant le montage existant ne réécrit pas les valeurs.

Pour un éditeur qui change de facture :

```tsx
import {InvoiceForm, type Invoice} from '@mdevs/ui/invoice';

export function InvoiceEditor({invoice, save}: {
  invoice: Invoice & {id: string};
  save: (id: string, values: Omit<Invoice, 'id'>) => void;
}) {
  return <InvoiceForm
    key={invoice.id}
    initialValues={invoice}
    onSubmit={values => save(invoice.id, values)}
  />;
}
```

Cet exemple effectue une sauvegarde synchrone par callback. Pour un service asynchrone, ajouter la gestion de `pending` et d'erreur décrite ci-dessous. La clé d'enregistrement change lorsque l'utilisateur choisit une autre fiche, pas lorsque sa saisie ou l'état pending change.

Pour une création, remonter avec un compteur après succès seulement. Si la sauvegarde échoue, conserver la clé et les valeurs. Pour réinitialiser une fiche venant d'une nouvelle révision serveur sous le même identifiant, décider explicitement quand l'utilisateur abandonne son brouillon; un changement de version dans la clé peut matérialiser ce choix. Une actualisation réseau ne devrait pas effacer la saisie silencieusement.

Le composant ne possède pas de prop publique `reset`, `values` ou `onValuesChange`. Une composition contrôlée permet une synchronisation plus fine.

## Un flux asynchrone complet

```tsx
'use client';
import {useRef, useState} from 'react';
import {Alert, Stack} from '@mdevs/ui';
import {InvoiceForm, type Invoice} from '@mdevs/ui/invoice';

export function CreateInvoice({create}: {
  create: (values: Omit<Invoice, 'id'>) => Promise<void>;
}) {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [version, setVersion] = useState(0);

  async function save(values: Omit<Invoice, 'id'>) {
    if (inFlight.current) return;
    if (!values.number.trim() || !values.customer.trim() || !Number.isFinite(values.amount)) {
      setError('Vérifiez le numéro, le client et le montant.');
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError(undefined);
    try {
      await create(values);
      setVersion(previous => previous + 1);
    } catch {
      setError('Enregistrement impossible. Les valeurs saisies sont conservées.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return <Stack>
    {error && <Alert tone="danger" live>{error}</Alert>}
    <InvoiceForm key={version} pending={pending} onSubmit={values => { void save(values); }}/>
  </Stack>;
}
```

`pending` désactive le fieldset et le bouton interne et expose `aria-busy` sur le formulaire. Le callback ne l'active pas automatiquement. Il n'attend pas non plus une Promise : une fonction async directement passée est possible en TypeScript, mais une rejection non attrapée resterait une erreur applicative. Le `void save(...)` ci-dessus est sûr car `save` attrape ses erreurs de persistance.

La ref bloque aussi un deuxième appel avant le rendu de `pending`. Elle ne remplace pas l'idempotence serveur lorsque deux requêtes identiques arrivent depuis plusieurs onglets ou clients. Le package ne fournit pas de clé d'idempotence.

Dans `examples/docs/ui-invoice-workspace.tsx`, un exemple complet ajoute la facture renvoyée par le service, recalcule les métriques, applique les filtres et annonce le succès avec `useToast`. Le formulaire ne crée ni endpoint, ni identifiant serveur, ni accès réseau implicite.

## Composer Field correctement

`Field` rend un label, ses enfants, puis éventuellement :

- une aide `<p id="<htmlFor>-hint">`;
- une erreur `<p id="<htmlFor>-error" role="alert">`.

Il ne clone pas son enfant et n'ajoute aucune relation ARIA au contrôle. Relier soi-même les identifiants :

```tsx
'use client';
import {useId, useState} from 'react';
import {Field, Input} from '@mdevs/ui';

export function DisplayNameField() {
  const id = useId();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  return <Field label="Nom affiché" htmlFor={id} hint="Visible sur votre profil." error={error}>
    <Input
      id={id} name="displayName" value={value} required autoComplete="name"
      onChange={event => { setValue(event.target.value); setError(undefined); }}
      onBlur={() => setError(value.trim() ? undefined : 'Saisissez un nom.')}
      aria-invalid={Boolean(error)}
      aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
    />
  </Field>;
}
```

L'aide reste liée même pendant l'erreur. Éviter les identifiants statiques répétés quand deux exemplaires d'un formulaire peuvent être présents. `useId()` convient aux relations d'accessibilité; ce n'est pas un identifiant de ressource à enregistrer en base.

Les erreurs locales par champ ont déjà `role="alert"`. Éviter de recopier chaque erreur dans plusieurs régions live simultanées. Une erreur réseau globale peut rester dans une `Alert live`; une notification temporaire seule convient mal à une correction obligatoire de formulaire.

## Validation personnalisée et focus

La validation native permet souvent de laisser le navigateur guider la correction sans code supplémentaire. Si l'application doit montrer ses propres messages, utiliser `noValidate` sur une composition `Form`, contrôler les règles utiles et déplacer le focus au premier champ invalide. `noValidate` retire le blocage automatique du navigateur; toutes les règles qu'on souhaite préserver doivent être vérifiées par le code.

`examples/docs/ui-profile-form.tsx` propose deux champs contrôlés, un `Form noValidate`, un nom non vide après `trim`, le contrôle natif `validity.typeMismatch` pour l'e-mail, puis le focus sur le premier champ invalide. Il n'essaie pas de prouver l'existence ou la délivrabilité d'une adresse. Le service hôte doit encore valider ses règles et l'unicité éventuelle.

Une bibliothèque de formulaires du projet peut remplacer cette orchestration. `Input`, `Textarea`, `Select`, `SearchInput`, `NumberInput`, `PasswordInput` et `DateInput` transmettent leur ref à un contrôle natif. `NumberInput` omet `onChange` de ses props et émet `onValueChange`; le brancher via l'adaptateur contrôlé de la bibliothèque lorsqu'elle attend un événement natif. Les primitives `Switch` et `Checkbox` ont des callbacks Radix, pas le même contrat que `Input`.

## Choisir la stratégie de Form

`Form` accepte `onSubmit(event)` et `onValuesSubmit(FormData)`. Son ordre est précis : `onSubmit` d'abord, puis `onValuesSubmit` seulement si l'événement n'a pas été empêché. Avec `onValuesSubmit`, il empêche lui-même la navigation HTML.

```tsx
import {Button, Field, Form, Input} from '@mdevs/ui';

export function BasicForm({save}: {save: (name: string) => void}) {
  return <Form onValuesSubmit={data => save(String(data.get('name') ?? '').trim())}>
    <Field label="Nom" htmlFor="basic-name">
      <Input id="basic-name" name="name" required/>
    </Field>
    <Button type="submit">Enregistrer</Button>
  </Form>;
}
```

Cet exemple utilise un identifiant statique pour un seul exemplaire; utiliser `useId` si le formulaire est répété. Le callback est synchrone. Pour une sauvegarde async, gérer pending/erreur comme dans les autres exemples.

Avec `onSubmit={event => event.preventDefault()}`, `onValuesSubmit` ne sera pas exécuté. Éviter de brancher les deux pour une même sauvegarde. Sans `onValuesSubmit` ni `preventDefault`, le formulaire conserve l'envoi HTML normal; définir volontairement son `action`/`method` si c'est la stratégie hôte.

`FormData` inclut les contrôles nommés et actifs. Un champ sans `name`, un champ désactivé et une checkbox non cochée ne produisent pas les mêmes données qu'un état contrôlé complet. `TagInput` ne propose pas de `name` de soumission publique; ajouter ses valeurs explicitement depuis l'état parent. `SegmentedControl` utilise un nom radio généré en interne; ne pas le traiter comme un champ de service nommé par le modèle hôte.

## Nombres, dates et fichiers

- `NumberInput` renvoie `undefined` pour un champ vide et `valueAsNumber` sinon. Garder `value={amount ?? ''}` pour un nombre optionnel contrôlé, puis traiter `undefined` et `NaN` selon les règles du service. Ne pas remplacer une valeur vide par zéro sans décision métier.
- `DateInput` est un `<input type="date">`. Sa valeur est une date civile `YYYY-MM-DD`, pas un objet `Date` ni un instant UTC. Conserver ce sens dans le stockage, les filtres et l'affichage.
- `Select` transmet un événement `onChange`; un placeholder possède `value=""`. Si le champ est obligatoire, appliquer `required` et prévoir explicitement la valeur vide.
- `Checkbox` peut être `'indeterminate'`. Pour une acceptation simple, utiliser un booléen; pour un contrôle de sélection partielle, conserver l'état tri-valué approprié.
- `FileUpload` retourne des `File[]` locaux et affiche leurs noms. `accept` aide la sélection mais n'est pas une validation fiable. Le service doit vérifier les fichiers; `UploadProgress` est un affichage de progression, pas un moteur d'envoi.

## Vérification utile avant livraison

Pour un formulaire métier inchangé : compiler le projet hôte, vérifier les champs attendus, les valeurs numériques zéro/vide, la date, les statuts et le callback. Pour une sauvegarde : contrôler succès, échec, double action et conservation des champs. Pour une validation personnalisée : contrôler labels, aides, erreurs et focus du premier champ invalide.

Vérifier le bouton de soumission (`type="submit"`), les boutons secondaires (`type="button"`) et l'absence de formulaires imbriqués. `Button.loading` désactive le bouton et ajoute un spinner avec `aria-busy`; adapter le libellé visible si l'opération doit être annoncée explicitement. Tester également le formulaire sur la largeur mobile cible et le clavier réel utilisé.

Pour la sauvegarde dans une fenêtre, lire [OVERLAYS.md](OVERLAYS.md). Pour relier les filtres et préférences au reste de l'écran, lire [UI_PLAYBOOK.md](UI_PLAYBOOK.md). Les contrôles du package ne remplacent pas la validation du service hôte.
