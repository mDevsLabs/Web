# ExpandableTable

Table avec détails de ligne dépliables et état contrôlé.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {ExpandableTable} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {ExpandableTable} from '@mdevs/ui/primitives/expandable-table';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface ExpandableTableProps extends HTMLAttributes<HTMLDivElement> {
    caption: string;
    columns: readonly {
        key: string;
        label: string;
    }[];
    rows: readonly (Record<string, string | number> & {
        id: string;
        details: string;
    })[];
    expandedIds: readonly string[];
    onExpandedChange: (ids: string[]) => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `caption` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `columns` | **Oui** | `readonly {     key: string;     label: string; }[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `rows` | **Oui** | `readonly (Record<string, string \| number> & {     id: string;     details: string; })[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `expandedIds` | **Oui** | `readonly string[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `onExpandedChange` | **Oui** | `(ids: string[]) => void` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onExpandedChange` | **Obligatoire** | `(ids: string[]) => void` |

## Comportement réel

Table avec détails de ligne dépliables et état contrôlé.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {ExpandableTable} from '@mdevs/ui/primitives/expandable-table';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "caption": "Commandes",
  "columns": [
    {
      "key": "name",
      "label": "Nom"
    }
  ],
  "rows": [
    {
      "id": "1",
      "name": "Commande 104",
      "details": "Livraison prévue la semaine prochaine."
    }
  ],
  "expandedIds": []
} as const;

export function Example() {
  const [expandedIds, setExpandedIds] = useState<ComponentProps<typeof ExpandableTable>['expandedIds']>(sampleProps.expandedIds);
  return <ExpandableTable {...sampleProps} expandedIds={expandedIds} onExpandedChange={setExpandedIds}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "caption": "Commandes",
  "columns": [
    {
      "key": "name",
      "label": "Nom"
    }
  ],
  "rows": [
    {
      "id": "1",
      "name": "Commande 104",
      "details": "Livraison prévue la semaine prochaine."
    }
  ],
  "expandedIds": []
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/expandable-table.tsx) — dans le monorepo : `packages/ui/src/primitives/expandable-table.tsx` ; dans le package installé : `src/primitives/expandable-table.tsx`.
- Déclarations après build : `dist/primitives/expandable-table.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
