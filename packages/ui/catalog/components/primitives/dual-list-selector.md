# DualListSelector

Transfert de choix entre deux listes natives multisélection.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {DualListSelector} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {DualListSelector} from '@mdevs/ui/primitives/dual-list-selector';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface DualListSelectorProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
    }[];
    value: readonly string[];
    onValueChange: (value: string[]) => void;
    disabled?: boolean;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `options` | **Oui** | `readonly {     value: string;     label: string; }[]` | — | Valeurs et libellés réels ; conserver des valeurs stables. |
| `value` | **Oui** | `readonly string[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(value: string[]) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `disabled` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(value: string[]) => void` |

## Comportement réel

Transfert de choix entre deux listes natives multisélection.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {DualListSelector} from '@mdevs/ui/primitives/dual-list-selector';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Accès aux espaces",
  "value": [
    "design"
  ],
  "options": [
    {
      "value": "design",
      "label": "Design"
    },
    {
      "value": "product",
      "label": "Produit"
    },
    {
      "value": "engineering",
      "label": "Ingénierie"
    }
  ]
} as const;

export function Example() {
  const [value, setValue] = useState<ComponentProps<typeof DualListSelector>['value']>(sampleProps.value);
  return <DualListSelector {...sampleProps} value={value} onValueChange={setValue}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Accès aux espaces",
  "value": [
    "design"
  ],
  "options": [
    {
      "value": "design",
      "label": "Design"
    },
    {
      "value": "product",
      "label": "Produit"
    },
    {
      "value": "engineering",
      "label": "Ingénierie"
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

- [Source TypeScript du composant](../../../src/primitives/dual-list-selector.tsx) — dans le monorepo : `packages/ui/src/primitives/dual-list-selector.tsx` ; dans le package installé : `src/primitives/dual-list-selector.tsx`.
- Déclarations après build : `dist/primitives/dual-list-selector.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
