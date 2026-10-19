# PurchaseOrderFilters

Filtres : commandes fournisseurs.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {PurchaseOrderFilters} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {PurchaseOrderFilters} from '@mdevs/ui/purchase-order/purchase-order-filters';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/purchase-order`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface PurchaseOrderFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PurchaseOrderStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PurchaseOrderStatus | '') => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `query` | **Oui** | `string` | — | Valeur contrôlée ; mettre à jour l’état parent dans onQueryChange. |
| `status` | Non | `PurchaseOrderStatus \| ''` | — | Valeur du contrat ; une chaîne vide signifie tous les statuts pour les filtres. |
| `onQueryChange` | **Oui** | `(query: string) => void` | — | Reçoit la recherche sans filtrer les données à lui seul. |
| `onStatusChange` | Non | `(status: PurchaseOrderStatus \| '') => void` | — | Reçoit le statut ou une chaîne vide ; son absence désactive le select des filtres. |

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
| `onStatusChange` | Optionnel | `(status: PurchaseOrderStatus \| '') => void` |

## Types et données du domaine

Le modèle `PurchaseOrder` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `reference` | Référence | `string` | Oui | Chaîne applicative |
| `supplier` | Fournisseur | `string` | Oui | Chaîne applicative |
| `amount` | Montant | `number` | Oui | Nombre fini validé par le parent |
| `expectedOn` | Réception | `string` | Oui | Chaîne YYYY-MM-DD |
| `status` | Statut | `PurchaseOrderStatus` | Oui | `draft`, `approved`, `ordered`, `received` |


```ts
export type PurchaseOrder = {
    id?: string;
    reference: string;
    supplier: string;
    amount: number;
    expectedOn: string;
    status: "draft" | "approved" | "ordered" | "received";
};

export type PurchaseOrderStatus = PurchaseOrder['status'];

export interface PurchaseOrderActivity extends DomainActivity {
    purchaseorderId?: string;
}

export type PurchaseOrderMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalPurchaseOrder' | 'activePurchaseOrder' | 'valuePurchaseOrder';
};

export type PurchaseOrderSettingsValues = Partial<Record<"notifyPurchaseOrder" | "archivePurchaseOrder" | "approvePurchaseOrder", boolean>>;
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
import {PurchaseOrderFilters, type PurchaseOrderStatus, PurchaseOrderTable, type PurchaseOrder} from '@mdevs/ui/purchase-order';
import '@mdevs/ui/styles.css';

const items: PurchaseOrder[] = [{
  "id": "purchase-order-demo-1",
  "reference": "ACH-104",
  "supplier": "Fournisseur démo",
  "amount": 128,
  "expectedOn": "2026-10-04",
  "status": "draft"
}];

export function Example() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('');
  const visible = items.filter(item =>
    (!status || item.status === status) &&
    String(item.reference).toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  return <><PurchaseOrderFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus}/><PurchaseOrderTable items={visible}/></>;
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

- [Source TypeScript du composant](../../../src/components/purchase-order/purchase-order-filters.tsx) — dans le monorepo : `packages/ui/src/components/purchase-order/purchase-order-filters.tsx` ; dans le package installé : `src/components/purchase-order/purchase-order-filters.tsx`.
- Déclarations après build : `dist/components/purchase-order/purchase-order-filters.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../purchase-order/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/purchase-order/types.ts), [configuration](../../../src/components/purchase-order/config.ts) et [schéma JSON](../../purchase-order/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
