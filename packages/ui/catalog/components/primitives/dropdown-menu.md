# DropdownMenu

Menu d’actions avec navigation clavier Radix.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {DropdownMenu} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {DropdownMenu} from '@mdevs/ui/primitives/dropdown-menu';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface DropdownMenuItem {
    id: string;
    label: string;
    onSelect?: () => void;
    disabled?: boolean;
    danger?: boolean;
    separatorBefore?: boolean;
}

export interface DropdownMenuProps {
    trigger: ReactNode;
    items: readonly DropdownMenuItem[];
    label: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `trigger` | **Oui** | `ReactNode` | — | Élément React interactif ; les déclencheurs Radix asChild exigent un enfant acceptant props et ref. |
| `items` | **Oui** | `readonly DropdownMenuItem[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `DropdownMenuItem.onSelect` | Optionnel dans cet objet | `() => void` |

## Comportement réel

Menu Radix avec trigger asChild, label et items. Les actions sont définies dans item.onSelect ; disabled, danger et separatorBefore affectent chaque item.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {DropdownMenu} from '@mdevs/ui/primitives/dropdown-menu';
import '@mdevs/ui/styles.css';


export function Example() {
  const [action, setAction] = useState('');
  return <><DropdownMenu label="Actions" trigger={<button type="button">Actions</button>} items={[{id:"edit", label:"Modifier", onSelect:() => setAction("edit")}]} /><p role="status">{action}</p></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Actions",
  "items": [
    {
      "id": "edit",
      "label": "Modifier"
    },
    {
      "id": "archive",
      "label": "Archiver"
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

- [Source TypeScript du composant](../../../src/primitives/dropdown-menu.tsx) — dans le monorepo : `packages/ui/src/primitives/dropdown-menu.tsx` ; dans le package installé : `src/primitives/dropdown-menu.tsx`.
- Déclarations après build : `dist/primitives/dropdown-menu.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
