# TreeView

Arborescence de navigation avec éléments natifs repliables.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {TreeView} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {TreeView} from '@mdevs/ui/primitives/tree-view';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface TreeNode {
    id: string;
    label: string;
    children?: readonly TreeNode[];
}

export interface TreeViewProps {
    nodes: readonly TreeNode[];
    onSelect?: (node: TreeNode) => void;
    label: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `nodes` | **Oui** | `readonly TreeNode[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `onSelect` | Non | `(node: TreeNode) => void` | — | Reporte la sélection ; aucun chargement ou navigation automatique. |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onSelect` | Optionnel | `(node: TreeNode) => void` |

## Comportement réel

Navigation récursive rendue avec listes et details/summary. onSelect concerne les feuilles ; aucun rôle ARIA tree ni navigation clavier de type tree n’est ajouté.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {TreeView} from '@mdevs/ui/primitives/tree-view';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Documents",
  "nodes": [
    {
      "id": "root",
      "label": "Projet",
      "children": [
        {
          "id": "doc",
          "label": "README.md"
        },
        {
          "id": "src",
          "label": "Sources"
        }
      ]
    }
  ]
} as const;

export function Example() {
  return <TreeView {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Documents",
  "nodes": [
    {
      "id": "root",
      "label": "Projet",
      "children": [
        {
          "id": "doc",
          "label": "README.md"
        },
        {
          "id": "src",
          "label": "Sources"
        }
      ]
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

- [Source TypeScript du composant](../../../src/primitives/tree-view.tsx) — dans le monorepo : `packages/ui/src/primitives/tree-view.tsx` ; dans le package installé : `src/primitives/tree-view.tsx`.
- Déclarations après build : `dist/primitives/tree-view.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
