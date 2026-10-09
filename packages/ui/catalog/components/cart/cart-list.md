# CartList

Liste : paniers.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {CartList} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {CartList} from '@mdevs/ui/cart/cart-list';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/cart`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface CartListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Cart[];
    onSelect?: (item: Cart) => void;
    emptyMessage?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly Cart[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `onSelect` | Non | `(item: Cart) => void` | — | Reporte la sélection ; aucun chargement ou navigation automatique. |
| `emptyMessage` | Non | `string` | `'Aucun élément.'` | Message affiché quand la collection est vide. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onSelect` | Optionnel | `(item: Cart) => void` |

## Types et données du domaine

Le modèle `Cart` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `reference` | Référence | `string` | Oui | Chaîne applicative |
| `customer` | Client | `string` | Oui | Chaîne applicative |
| `itemCount` | Articles | `number` | Oui | Nombre fini validé par le parent |
| `subtotal` | Sous-total | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `CartStatus` | Oui | `open`, `abandoned`, `converted` |


```ts
export type Cart = {
    id?: string;
    reference: string;
    customer: string;
    itemCount: number;
    subtotal: number;
    status: "open" | "abandoned" | "converted";
};

export type CartStatus = Cart['status'];

export interface CartActivity extends DomainActivity {
    cartId?: string;
}

export type CartMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCart' | 'activeCart' | 'valueCart';
};

export type CartSettingsValues = Partial<Record<"notifyCart" | "archiveCart" | "approveCart", boolean>>;
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

Affiche toute la collection dans son ordre reçu. Quand onSelect est fourni, chaque ligne devient un bouton type="button" et appelle ce callback avec l’enregistrement complet. Sans onSelect, les lignes restent du contenu de lecture. Une collection vide affiche emptyMessage ; aucune pagination ou virtualisation n’est appliquée.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {CartList, type Cart} from '@mdevs/ui/cart';
import '@mdevs/ui/styles.css';

const items: Cart[] = [{
  "id": "cart-demo-1",
  "reference": "PAN-0084",
  "customer": "Maison Horizon",
  "itemCount": 128,
  "subtotal": 128,
  "status": "open"
}];

export function Example() {
  const [selected, setSelected] = useState<Cart | null>(null);
  return <><CartList items={items} onSelect={setSelected}/><p role="status">{selected ? 'Sélection : ' + selected.reference : 'Aucune sélection'}</p></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "cart-demo-1",
      "reference": "PAN-0084",
      "customer": "Maison Horizon",
      "itemCount": 128,
      "subtotal": 128,
      "status": "open"
    }
  ]
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/components/cart/cart-list.tsx) — dans le monorepo : `packages/ui/src/components/cart/cart-list.tsx` ; dans le package installé : `src/components/cart/cart-list.tsx`.
- Déclarations après build : `dist/components/cart/cart-list.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../cart/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/cart/types.ts), [configuration](../../../src/components/cart/config.ts) et [schéma JSON](../../cart/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
