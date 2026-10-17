# RadioGroup

Choix exclusif contrôlé ou autonome.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {RadioGroup} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {RadioGroup} from '@mdevs/ui/primitives/radio-group';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
    label: string;
    name: string;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `name` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `options` | **Oui** | `readonly {     value: string;     label: string;     disabled?: boolean; }[]` | — | Valeurs et libellés réels ; conserver des valeurs stables. |
| `value` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `defaultValue` | Non | `string` | `''` | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | Non | `(value: string) => void` | — | Le parent met à jour value si le composant est contrôlé. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | Optionnel | `(value: string) => void` |

## Comportement réel

Fieldset nommé par label. value contrôle la sélection ; sinon defaultValue initialise l’état interne. onValueChange reçoit la valeur choisie. Les valeurs doivent être uniques.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {RadioGroup} from '@mdevs/ui/primitives/radio-group';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Abonnement",
  "name": "subscription",
  "options": [
    {
      "value": "monthly",
      "label": "Mensuel"
    },
    {
      "value": "yearly",
      "label": "Annuel"
    }
  ],
  "defaultValue": "monthly"
} as const;

export function Example() {
  return <RadioGroup {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Abonnement",
  "name": "subscription",
  "options": [
    {
      "value": "monthly",
      "label": "Mensuel"
    },
    {
      "value": "yearly",
      "label": "Annuel"
    }
  ],
  "defaultValue": "monthly"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/radio-group.tsx) — dans le monorepo : `packages/ui/src/primitives/radio-group.tsx` ; dans le package installé : `src/primitives/radio-group.tsx`.
- Déclarations après build : `dist/primitives/radio-group.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
