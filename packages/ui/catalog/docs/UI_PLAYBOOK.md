# Intégrer @mdevs/ui dans une application réelle

Ce guide décrit les contrats de la version 0.2.0. Lire [GETTING_STARTED.md](GETTING_STARTED.md) pour l'installation, [API.md](API.md) pour les familles et [LIMITATIONS.md](LIMITATIONS.md) pour le périmètre. Les chemins `packages/ui/...` désignent le monorepo; dans un package autonome, supprimer le préfixe `packages/ui/`.

## Choisir le niveau d'intégration

Commencer par la tâche de l'utilisateur, les données déjà disponibles et les actions à connecter. Les 1 080 composants métier sont répartis en 108 domaines de dix familles; ils ne fournissent pas les services correspondants. Une interface de facture ne crée pas automatiquement une facture dans un système comptable.

| Besoin | Choix adapté | Motif ou limite |
| --- | --- | --- |
| Afficher le modèle de domaine sans formatage particulier | `XCard`, `XList`, `XTable` | Les champs et libellés existent déjà; le rendu utilise les valeurs brutes. |
| Choisir une ligne et ouvrir une fiche | `XList` avec `onSelect` | `XTable` n'a pas de callback de sélection. |
| Créer une fiche avec les champs standards | `XForm` | Validation native, formulaire non contrôlé et callback typé. |
| Afficher des erreurs serveur sous chaque champ | `Form`, `Field` et primitives | Les formulaires métier n'exposent pas d'erreurs par champ. |
| Traduire les statuts ou afficher une devise | `DataTable<T>` ou composition | `columns[].render` fournit un point de formatage explicite. |
| Sauvegarder des préférences | `XSettings` avec état parent | Les options décrivent des préférences; leur effet métier reste à implémenter. |
| Exposer des indicateurs | `XStats` avec métriques calculées en amont | Le package affiche les KPI mais ne les définit ni ne les calcule. |
| Consulter un très grand volume | Pagination/chargement applicatif et outil adapté au volume | Pas de virtualisation incluse, ni de pagination serveur dans les tables. |
| Rechercher une option dans un select | Évaluer une intégration de combobox dédiée | `Select` est un `<select>` natif, sans recherche intégrée. |

Le catalogue est un espace de découverte; ses données et callbacks de démonstration ne sont pas un service applicatif. Le code intégrable doit avoir un propriétaire d'état, une source de données et une gestion d'échec identifiés.

## Trouver un composant sans deviner son nom

Dans le dépôt :

```bash
npm run catalog:find -- invoice
npm run catalog:find -- settings
```

`scripts/find.mjs` retourne au plus 30 résultats. Pour parcourir toutes les entrées du package installé :

```js
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {components} = require('@mdevs/ui/catalog');
console.log(components.filter(entry => entry.category === 'invoice'));
```

Une entrée `InvoiceForm` pointe vers `@mdevs/ui/invoice/invoice-form`, `src/components/invoice/invoice-form.tsx` et `InvoiceFormProps`. Examiner ensuite `src/components/invoice/types.ts` et `catalog/invoice/schema.json`. Le fichier `schema.json` décrit la configuration du catalogue; il n'exécute pas une validation JSON Schema.

Le modèle réel de facture est :

```ts
type Invoice = {
  id?: string;
  number: string;
  customer: string;
  amount: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
};
```

Conserver les codes de statut dans les données et effectuer une traduction dans la couche d'affichage si nécessaire. Ajouter un `id` stable avant d'afficher une collection qui sera modifiée ou réordonnée.

## Entrée globale, thème et structure de page

Importer le CSS une fois dans l'entrée globale du projet :

```tsx
import '@mdevs/ui/styles.css';
```

Créer ensuite un périmètre de thème et, si des notifications sont utiles, un provider ancêtre du composant qui appelle `useToast` :

```tsx
'use client';
import type {ReactNode, CSSProperties} from 'react';
import {ThemeProvider, ToastProvider} from '@mdevs/ui';

export function AppProviders({children}: {children: ReactNode}) {
  const tokens = {'--md-blur': '12px', '--md-input-radius': '10px'} as CSSProperties;
  return <ThemeProvider theme="system" glass style={tokens}>
    <ToastProvider>{children}</ToastProvider>
  </ThemeProvider>;
}
```

`ThemeProvider` applique la police, les couleurs et les variables à son périmètre. Il ne peint pas un fond de page plein. Définir le fond de l'application au niveau hôte selon le design souhaité. `theme="system"` se résout par CSS sans lecture JavaScript de la préférence pendant le rendu.

Pour un verre discret, ajuster quelques tokens plutôt que multiplier les styles sur chaque carte. Pour un appareil peu puissant ou une image de fond difficile à lire, `glass={false}` retire le flou. Les préférences d'accessibilité restent couvertes par le CSS; vérifier les personnalisations sur le fond réel. Consulter [LIQUID_GLASS.md](LIQUID_GLASS.md).

Les composants métier et `GlassCard` affichent des `h3`. Organiser la page avec un `Heading level={1}` et, selon la structure, des sections `level={2}`. Les titres métier ne proposent pas de prop `headingLevel`; une composition différente convient si la hiérarchie ne peut pas s'adapter.

## Filtres réellement connectés aux données

`InvoiceFilters` met à jour les contrôles par callbacks. Il ne connaît pas la table placée à côté. Pour une collection déjà chargée, appliquer le filtre localement :

```tsx
'use client';
import {useMemo, useState} from 'react';
import {Stack} from '@mdevs/ui/primitives/stack';
import {InvoiceFilters, InvoiceTable, type Invoice, type InvoiceStatus} from '@mdevs/ui/invoice';

export function InvoiceBrowser({items}: {items: readonly Invoice[]}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return items.filter(item =>
      (!status || item.status === status) &&
      `${item.number} ${item.customer}`.toLocaleLowerCase().includes(term),
    );
  }, [items, query, status]);
  return <Stack>
    <InvoiceFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus}/>
    <InvoiceTable items={visible} emptyMessage="Aucune facture correspondante."/>
  </Stack>;
}
```

Le bouton Réinitialiser appelle `onQueryChange('')` et `onStatusChange('')` lorsqu'il est présent. Sans `onStatusChange`, le sélecteur de statut est désactivé. Fournir les deux callbacks pour un filtre complet.

Si les données viennent d'un serveur, envoyer query/statut au service hôte et définir chargement, erreur, pagination et politique pour les réponses devenues obsolètes. Ne pas filtrer seulement la page courante en annonçant un résultat global. Le debounce, l'annulation et le cache ne sont pas inclus au composant.

## Préférences contrôlées

```tsx
'use client';
import {useState} from 'react';
import {InvoiceSettings, type InvoiceSettingsValues} from '@mdevs/ui/invoice';

export function InvoicePreferences() {
  const [values, setValues] = useState<InvoiceSettingsValues>({notifyInvoice: true});
  return <InvoiceSettings
    values={values}
    onChange={(key, value) => setValues(previous => ({...previous, [key]: value}))}
  />;
}
```

Cet exemple modifie un état local. Pour une sauvegarde réelle, connecter le service hôte et choisir une sauvegarde explicite ou optimiste avec restauration en échec. Activer `archiveInvoice` n'archive aucun objet automatiquement; `approveInvoice` ne crée aucun workflow d'approbation. Les clés absentes sont affichées comme `false`.

## Affichage monétaire et traduction des statuts

`InvoiceTable` trie localement et affiche `String(value)`; `amount=128` apparaît comme `128`. Pour une facture en euros et une traduction française des statuts, utiliser la primitive générique :

```tsx
import {DataTable, type DataTableColumn} from '@mdevs/ui/primitives/data-table';
import type {Invoice} from '@mdevs/ui/invoice';

type InvoiceRow = Invoice & {id: string};
const currency = new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'EUR'});
const statusLabels: Record<Invoice['status'], string> = {
  draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard',
};
const columns: readonly DataTableColumn<InvoiceRow>[] = [
  {key: 'number', label: 'Numéro', sortable: true},
  {key: 'customer', label: 'Client', sortable: true},
  {key: 'amount', label: 'Montant', sortable: true, render: (_value, row) => currency.format(row.amount)},
  {key: 'status', label: 'Statut', render: (_value, row) => statusLabels[row.status]},
];

export function FormattedInvoices({rows}: {rows: readonly InvoiceRow[]}) {
  return <DataTable columns={columns} rows={rows} getRowKey={row => row.id} caption="Factures en euros"/>;
}
```

La devise EUR est un choix de cet exemple, pas une propriété de `Invoice`. Pour plusieurs devises, adapter le modèle hôte et le formatteur; ne pas additionner des montants hétérogènes. Les `render` reçoivent le type union `T[keyof T]` en premier argument; lire `row.amount` conserve ici un accès numérique précis. Le tri porte sur la valeur du modèle, pas sur le texte formaté.

`DataTable` ne propose pas d'API de tri distant, redimensionnement ou cellules virtuelles. `Pagination` peut contrôler la page applicative, à partir de 1; découper les données ou interroger le serveur vous-même. Un tri local d'une tranche ne trie que cette tranche. Pour un tri global paginé, choisir un composant et un service capables de partager cet état.

## Frontière serveur/client

Sous Next.js App Router :

1. Importer le CSS dans `app/layout.tsx`.
2. Placer les providers et la logique interactive dans un fichier commençant par `'use client'`.
3. Passer depuis une page serveur des données sérialisables déjà validées.
4. Définir l'adaptateur HTTP côté client, ou utiliser explicitement les Server Actions du projet. Une fonction ordinaire déclarée dans une page serveur ne traverse pas la frontière en tant que callback client.

Les types React ne suffisent pas à contrôler les données réseau. Valider la réponse avant de l'utiliser comme `Invoice`; `response.json() as Invoice` ne valide rien. Le package ne fournit aucun endpoint `/api/...`, aucune authentification ou gestion d'autorisation.

L'initialisation d'un état par `initialInvoices` est une photographie au montage. Les exemples ne fusionnent pas automatiquement de futurs chargements serveur dans un état déjà modifié. Choisir au niveau hôte entre données entièrement contrôlées, cache de requêtes ou remontage explicite lors d'un changement de contexte.

## Exemples complets du monorepo

- `examples/docs/ui-invoice-workspace.tsx` : formulaire de facture, métriques, filtres, persistance injectée, état pending, erreur durable et reset seulement après succès.
- `examples/docs/ui-profile-form.tsx` : champs contrôlés, erreurs par champ, aides associées, focus sur le premier champ invalide et sauvegarde asynchrone.
- `examples/docs/ui-controlled-dialog.tsx` : fenêtre contrôlée, fermeture après sauvegarde, message d'échec, tokens partagés avec les portails et popover informatif.

Ces fichiers sont dans le monorepo et sont vérifiables avec son typecheck. Ils n'importent pas le CSS eux-mêmes afin de laisser l'application le charger une seule fois. Le callback de persistance est fourni par l'application; aucun faux backend n'est installé.

## Vérification ciblée et diagnostic

Pour une intégration simple, compiler le projet hôte puis vérifier le CSS, les valeurs initiales, les callbacks et au moins une interaction clavier. Pour un flux de sauvegarde, vérifier succès, échec, double clic et conservation de la saisie. Pour un overlay, ajouter fermeture et restitution du focus. Tester la largeur mobile utilisée par le projet, avec 320–375 px comme contrôle utile pour les flux tactiles.

| Observation | Vérification utile |
| --- | --- |
| La sélection ne change pas | Le callback met-il à jour la valeur fournie ? |
| Le filtre est actif mais les résultats ne bougent pas | La collection passée à la liste/table est-elle la collection filtrée ? |
| L'erreur serveur fait perdre le formulaire | Une `key` change-t-elle lors de pending ou d'erreur ? |
| Le modal perd le thème | Les variables sont-elles sur `ThemeProvider.style`, et le modal sous ce contexte ? |
| Une action de préférence n'a pas d'effet métier | Le callback appelle-t-il le service de l'application ? |
| Le CSS personnalisé perd ses couleurs | Vérifier `@layer mdevs`, les règles hôtes hors layer et les variables héritées. |
| Le package affiche des dates inhabituelles | Les dates civiles et horodatages ont-ils été distingués avant conversion ? |

Les détails de soumission et d'overlay se trouvent dans [FORM_PATTERNS.md](FORM_PATTERNS.md) et [OVERLAYS.md](OVERLAYS.md). Une vérification TypeScript ne couvre ni contraste sur tous les fonds, ni focus navigateur, ni comportement de Safari/iOS; rapporter les contrôles réellement effectués.
