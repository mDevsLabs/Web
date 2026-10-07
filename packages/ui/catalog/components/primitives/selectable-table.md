# SelectableTable

Table avec sélection contrôlée et sélection de la page visible.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {SelectableTable} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {SelectableTable} from '@mdevs/ui/primitives/selectable-table';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface SelectableTableProps extends HTMLAttributes<HTMLDivElement> {
    caption: string;
    columns: readonly {
        key: string;
        label: string;
    }[];
    rows: readonly (Record<string, string | number> & {
        id: string;
    })[];
    selectedIds: readonly string[];
    onSelectionChange: (ids: string[]) => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `caption` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `columns` | **Oui** | `readonly {     key: string;     label: string; }[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `rows` | **Oui** | `readonly (Record<string, string \| number> & {     id: string; })[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `selectedIds` | **Oui** | `readonly string[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `onSelectionChange` | **Oui** | `(ids: string[]) => void` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onSelectionChange` | **Obligatoire** | `(ids: string[]) => void` |

## Comportement réel

Sélection contrôlée par id stable. La case d’en-tête sélectionne uniquement les rows reçues et conserve les choix d’autres pages. Tri, pagination et opérations groupées appartiennent au parent.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {SelectableTable} from '@mdevs/ui/primitives/selectable-table';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "caption": "Documents",
  "columns": [
    {
      "key": "name",
      "label": "Nom"
    },
    {
      "key": "size",
      "label": "Taille"
    }
  ],
  "rows": [
    {
      "id": "1",
      "name": "Brief",
      "size": 128
    },
    {
      "id": "2",
      "name": "Maquette",
      "size": 256
    }
  ],
  "selectedIds": []
} as const;

export function Example() {
  const [selectedIds, setSelectedIds] = useState<ComponentProps<typeof SelectableTable>['selectedIds']>(sampleProps.selectedIds);
  return <SelectableTable {...sampleProps} selectedIds={selectedIds} onSelectionChange={setSelectedIds}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "caption": "Documents",
  "columns": [
    {
      "key": "name",
      "label": "Nom"
    },
    {
      "key": "size",
      "label": "Taille"
    }
  ],
  "rows": [
    {
      "id": "1",
      "name": "Brief",
      "size": 128
    },
    {
      "id": "2",
      "name": "Maquette",
      "size": 256
    }
  ],
  "selectedIds": []
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/selectable-table.tsx) — dans le monorepo : `packages/ui/src/primitives/selectable-table.tsx` ; dans le package installé : `src/primitives/selectable-table.tsx`.
- Déclarations après build : `dist/primitives/selectable-table.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
