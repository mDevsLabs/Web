# DateRangeInput

Dates de début et fin avec bornes natives coordonnées.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {DateRangeInput} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {DateRangeInput} from '@mdevs/ui/primitives/date-range-input';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface DateRangeInputProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: {
        start: string;
        end: string;
    };
    onValueChange: (value: {
        start: string;
        end: string;
    }) => void;
    min?: string;
    max?: string;
    required?: boolean;
    disabled?: boolean;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `value` | **Oui** | `{     start: string;     end: string; }` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(value: {     start: string;     end: string; }) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `min` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `max` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `required` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `disabled` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(value: {     start: string;     end: string; }) => void` |

## Comportement réel

Chaînes YYYY-MM-DD contrôlées. min/max HTML établissent une validation native, pas une correction forcée des données reçues ni une conversion de fuseau. Le parent valide la cohérence métier.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {DateRangeInput} from '@mdevs/ui/primitives/date-range-input';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Période",
  "value": {
    "start": "2026-10-01",
    "end": "2026-10-15"
  }
} as const;

export function Example() {
  const [value, setValue] = useState<ComponentProps<typeof DateRangeInput>['value']>(sampleProps.value);
  return <DateRangeInput {...sampleProps} value={value} onValueChange={setValue}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Période",
  "value": {
    "start": "2026-10-01",
    "end": "2026-10-15"
  }
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/date-range-input.tsx) — dans le monorepo : `packages/ui/src/primitives/date-range-input.tsx` ; dans le package installé : `src/primitives/date-range-input.tsx`.
- Déclarations après build : `dist/primitives/date-range-input.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
