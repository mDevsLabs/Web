# ColumnVisibilityMenu

Choix des colonnes affichées à transmettre à une table.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {ColumnVisibilityMenu} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {ColumnVisibilityMenu} from '@mdevs/ui/primitives/column-visibility-menu';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface ColumnVisibilityMenuProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    columns: readonly {
        key: string;
        label: string;
        required?: boolean;
    }[];
    visibleKeys: readonly string[];
    onVisibilityChange: (keys: string[]) => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `columns` | **Oui** | `readonly {     key: string;     label: string;     required?: boolean; }[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `visibleKeys` | **Oui** | `readonly string[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `onVisibilityChange` | **Oui** | `(keys: string[]) => void` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onVisibilityChange` | **Obligatoire** | `(keys: string[]) => void` |

## Comportement réel

Contrôle de choix, sans modification implicite de la table. Le parent filtre ses colonnes et conserve les required dans le rendu ; le composant ne persiste pas une préférence.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {ColumnVisibilityMenu} from '@mdevs/ui/primitives/column-visibility-menu';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Configurer les colonnes",
  "columns": [
    {
      "key": "name",
      "label": "Nom",
      "required": true
    },
    {
      "key": "status",
      "label": "Statut"
    },
    {
      "key": "owner",
      "label": "Responsable"
    }
  ],
  "visibleKeys": [
    "name",
    "status"
  ]
} as const;

export function Example() {
  const [visibleKeys, setVisibleKeys] = useState<ComponentProps<typeof ColumnVisibilityMenu>['visibleKeys']>(sampleProps.visibleKeys);
  return <ColumnVisibilityMenu {...sampleProps} visibleKeys={visibleKeys} onVisibilityChange={setVisibleKeys}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Configurer les colonnes",
  "columns": [
    {
      "key": "name",
      "label": "Nom",
      "required": true
    },
    {
      "key": "status",
      "label": "Statut"
    },
    {
      "key": "owner",
      "label": "Responsable"
    }
  ],
  "visibleKeys": [
    "name",
    "status"
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

- [Source TypeScript du composant](../../../src/primitives/column-visibility-menu.tsx) — dans le monorepo : `packages/ui/src/primitives/column-visibility-menu.tsx` ; dans le package installé : `src/primitives/column-visibility-menu.tsx`.
- Déclarations après build : `dist/primitives/column-visibility-menu.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
