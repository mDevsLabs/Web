# DataTable

Table générique avec colonnes, rendu personnalisé et tri.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {DataTable} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {DataTable} from '@mdevs/ui/primitives/data-table';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface DataTableColumn<T> {
    key: keyof T & string;
    label: string;
    render?: (value: T[keyof T], row: T) => ReactNode;
    sortable?: boolean;
}

export interface DataTableProps<T> {
    columns: readonly DataTableColumn<T>[];
    rows: readonly T[];
    getRowKey: (row: T) => string;
    caption: string;
    emptyMessage?: string;
    className?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `columns` | **Oui** | `readonly DataTableColumn<T>[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `rows` | **Oui** | `readonly T[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `getRowKey` | **Oui** | `(row: T) => string` | — | Clé stable et unique pour chaque ligne ; éviter les index si les lignes changent. |
| `caption` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `emptyMessage` | Non | `string` | `'Aucun résultat.'` | Message affiché quand la collection est vide. |
| `className` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Table générique avec caption obligatoire et getRowKey obligatoire. Seules les colonnes sortable proposent un tri local ; le tri copie rows, compare les nombres numériquement et les autres valeurs avec localeCompare({numeric:true}). render personnalise une cellule. Aucune pagination, sélection ou requête réseau.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {DataTable} from '@mdevs/ui/primitives/data-table';
import '@mdevs/ui/styles.css';

type Row = {id: string; name: string; role: string};
const rows: Row[] = [
  {
    "id": "1",
    "name": "Marie",
    "role": "Designer"
  },
  {
    "id": "2",
    "name": "Alex",
    "role": "Développeur"
  }
];

export function Example() {
  return <DataTable<Row> caption="Équipe" rows={rows} columns={[{key:"name", label:"Nom", sortable:true}, {key:"role", label:"Rôle"}]} getRowKey={row => row.id}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "caption": "Équipe",
  "columns": [
    {
      "key": "name",
      "label": "Nom",
      "sortable": true
    },
    {
      "key": "role",
      "label": "Rôle"
    }
  ],
  "rows": [
    {
      "id": "1",
      "name": "Marie",
      "role": "Designer"
    },
    {
      "id": "2",
      "name": "Alex",
      "role": "Développeur"
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

- [Source TypeScript du composant](../../../src/primitives/data-table.tsx) — dans le monorepo : `packages/ui/src/primitives/data-table.tsx` ; dans le package installé : `src/primitives/data-table.tsx`.
- Déclarations après build : `dist/primitives/data-table.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
