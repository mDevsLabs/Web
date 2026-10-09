# NumberStepper

Nombre contrôlé avec incrément, décrément et bornes explicites.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {NumberStepper} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {NumberStepper} from '@mdevs/ui/primitives/number-stepper';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface NumberStepperProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `value` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(value: number) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `min` | Non | `number` | `0` | Consulter le contrat et le comportement ci-dessous. |
| `max` | Non | `number` | `100` | Consulter le contrat et le comportement ci-dessous. |
| `step` | Non | `number` | `1` | Consulter le contrat et le comportement ci-dessous. |
| `disabled` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(value: number) => void` |

## Comportement réel

Nombre contrôlé avec incrément, décrément et bornes explicites.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {NumberStepper} from '@mdevs/ui/primitives/number-stepper';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Quantité",
  "value": 2,
  "min": 0,
  "max": 12
} as const;

export function Example() {
  const [value, setValue] = useState<ComponentProps<typeof NumberStepper>['value']>(sampleProps.value);
  return <NumberStepper {...sampleProps} value={value} onValueChange={setValue}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Quantité",
  "value": 2,
  "min": 0,
  "max": 12
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/number-stepper.tsx) — dans le monorepo : `packages/ui/src/primitives/number-stepper.tsx` ; dans le package installé : `src/primitives/number-stepper.tsx`.
- Déclarations après build : `dist/primitives/number-stepper.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
