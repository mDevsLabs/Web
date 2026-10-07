# InvoiceFilters

Filtres : factures.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {InvoiceFilters} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {InvoiceFilters} from '@mdevs/ui/invoice/invoice-filters';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/invoice`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface InvoiceFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: InvoiceStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: InvoiceStatus | '') => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `query` | **Oui** | `string` | — | Valeur contrôlée ; mettre à jour l’état parent dans onQueryChange. |
| `status` | Non | `InvoiceStatus \| ''` | — | Valeur du contrat ; une chaîne vide signifie tous les statuts pour les filtres. |
| `onQueryChange` | **Oui** | `(query: string) => void` | — | Reçoit la recherche sans filtrer les données à lui seul. |
| `onStatusChange` | Non | `(status: InvoiceStatus \| '') => void` | — | Reçoit le statut ou une chaîne vide ; son absence désactive le select des filtres. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onQueryChange` | **Obligatoire** | `(query: string) => void` |
| `onStatusChange` | Optionnel | `(status: InvoiceStatus \| '') => void` |

## Types et données du domaine

Le modèle `Invoice` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `number` | Numéro | `string` | Oui | Chaîne applicative |
| `customer` | Client | `string` | Oui | Chaîne applicative |
| `amount` | Montant | `number` | Oui | Nombre fini validé par le parent |
| `dueDate` | Échéance | `string` | Oui | Chaîne YYYY-MM-DD |
| `status` | Statut | `InvoiceStatus` | Oui | `draft`, `sent`, `paid`, `overdue` |


```ts
export type Invoice = {
    id?: string;
    number: string;
    customer: string;
    amount: number;
    dueDate: string;
    status: "draft" | "sent" | "paid" | "overdue";
};

export type InvoiceStatus = Invoice['status'];

export interface InvoiceActivity extends DomainActivity {
    invoiceId?: string;
}

export type InvoiceMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalInvoice' | 'activeInvoice' | 'valueInvoice';
};

export type InvoiceSettingsValues = Partial<Record<"notifyInvoice" | "archiveInvoice" | "approveInvoice", boolean>>;
```

Structures de référence partagées dans le code interne (lecture uniquement ; ne pas importer de sous-chemin internal) :


```ts
export interface DomainActivity {
    id: string;
    title: string;
    description?: string;
    date: string;
}

export interface DomainMetric {
    id: string;
    label: string;
    value: string | number;
    change?: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

export interface DomainFrameProps extends HTMLAttributes<HTMLElement> {
    title?: string;
    description?: string;
    actions?: ReactNode;
}
```

## Comportement réel

query et status sont contrôlés. Le champ de recherche appelle onQueryChange à chaque saisie ; le select appelle onStatusChange avec un statut ou "". Sans onStatusChange, le select est désactivé. Réinitialiser appelle onQueryChange("") puis, s’il existe, onStatusChange(""). Le composant ne filtre aucune collection et n’applique ni temporisation ni requête réseau : le parent applique les critères et fournit les résultats aux vues.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {InvoiceFilters, type InvoiceStatus, InvoiceTable, type Invoice} from '@mdevs/ui/invoice';
import '@mdevs/ui/styles.css';

const items: Invoice[] = [{
  "id": "invoice-demo-1",
  "number": "INV-2026-104",
  "customer": "Maison Horizon",
  "amount": 128,
  "dueDate": "2026-10-04",
  "status": "draft"
}];

export function Example() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const visible = items.filter(item =>
    (!status || item.status === status) &&
    String(item.number).toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  return <><InvoiceFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus}/><InvoiceTable items={visible}/></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "query": ""
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/components/invoice/invoice-filters.tsx) — dans le monorepo : `packages/ui/src/components/invoice/invoice-filters.tsx` ; dans le package installé : `src/components/invoice/invoice-filters.tsx`.
- Déclarations après build : `dist/components/invoice/invoice-filters.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../invoice/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/invoice/types.ts), [configuration](../../../src/components/invoice/config.ts) et [schéma JSON](../../invoice/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
