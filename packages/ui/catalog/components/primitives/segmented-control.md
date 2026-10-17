# SegmentedControl

Choix compact exclusif utilisant des radios.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {SegmentedControl} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {SegmentedControl} from '@mdevs/ui/primitives/segmented-control';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface SegmentedControlProps {
    value: string;
    onValueChange: (value: string) => void;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    label: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `value` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(value: string) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `options` | **Oui** | `readonly {     value: string;     label: string;     disabled?: boolean; }[]` | — | Valeurs et libellés réels ; conserver des valeurs stables. |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(value: string) => void` |

## Comportement réel

Groupe de radios contrôlé par value et onValueChange obligatoire. Les valeurs de options doivent être stables et uniques ; aucune gestion d’état indépendante.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {SegmentedControl} from '@mdevs/ui/primitives/segmented-control';
import '@mdevs/ui/styles.css';


export function Example() {
  const [period, setPeriod] = useState('month');
  return <SegmentedControl label="Période" value={period} onValueChange={setPeriod} options={[
  {
    "value": "week",
    "label": "Semaine"
  },
  {
    "value": "month",
    "label": "Mois"
  },
  {
    "value": "year",
    "label": "Année"
  }
]}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Période",
  "value": "month",
  "options": [
    {
      "value": "week",
      "label": "Semaine"
    },
    {
      "value": "month",
      "label": "Mois"
    },
    {
      "value": "year",
      "label": "Année"
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

- [Source TypeScript du composant](../../../src/primitives/segmented-control.tsx) — dans le monorepo : `packages/ui/src/primitives/segmented-control.tsx` ; dans le package installé : `src/primitives/segmented-control.tsx`.
- Déclarations après build : `dist/primitives/segmented-control.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
