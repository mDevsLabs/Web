# MasterDetail

Liste de sélection et panneau de détail avec état vide explicite.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {MasterDetail} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {MasterDetail} from '@mdevs/ui/primitives/master-detail';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface MasterDetailProps extends HTMLAttributes<HTMLDivElement> {
    items: readonly {
        id: string;
        label: string;
        description?: string;
    }[];
    selectedId?: string;
    onSelectionChange: (id: string) => void;
    children?: ReactNode;
    label: string;
    emptyMessage?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly {     id: string;     label: string;     description?: string; }[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `selectedId` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onSelectionChange` | **Oui** | `(id: string) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `children` | Non | `ReactNode` | — | Contenu React ; fournir un élément interactif unique si utilisé comme déclencheur Radix. |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `emptyMessage` | Non | `string` | `'Sélectionnez un élément.'` | Message affiché quand la collection est vide. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onSelectionChange` | **Obligatoire** | `(id: string) => void` |

## Comportement réel

Le parent fournit selectedId et le contenu de détail. Les boutons utilisent aria-pressed, sans rôle listbox/arbre ni navigation fléchée ajoutée. Le détail reste dans le flux responsive.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {MasterDetail} from '@mdevs/ui/primitives/master-detail';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Documents",
  "items": [
    {
      "id": "1",
      "label": "Brief",
      "description": "Mise à jour aujourd’hui"
    },
    {
      "id": "2",
      "label": "Maquette"
    }
  ]
} as const;

export function Example() {
  const [selectedId, setSelectedId] = useState<ComponentProps<typeof MasterDetail>['selectedId']>(undefined);
  return <MasterDetail {...sampleProps} selectedId={selectedId} onSelectionChange={setSelectedId}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Documents",
  "items": [
    {
      "id": "1",
      "label": "Brief",
      "description": "Mise à jour aujourd’hui"
    },
    {
      "id": "2",
      "label": "Maquette"
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

- [Source TypeScript du composant](../../../src/primitives/master-detail.tsx) — dans le monorepo : `packages/ui/src/primitives/master-detail.tsx` ; dans le package installé : `src/primitives/master-detail.tsx`.
- Déclarations après build : `dist/primitives/master-detail.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
