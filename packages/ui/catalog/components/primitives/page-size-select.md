# PageSizeSelect

Nombre de lignes par page contrôlé avec options explicites.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {PageSizeSelect} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {PageSizeSelect} from '@mdevs/ui/primitives/page-size-select';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface PageSizeSelectProps extends HTMLAttributes<HTMLDivElement> {
    value: number;
    onValueChange: (size: number) => void;
    options?: readonly number[];
    label?: string;
    disabled?: boolean;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `value` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(size: number) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `options` | Non | `readonly number[]` | `[10, 25, 50, 100]` | Valeurs et libellés réels ; conserver des valeurs stables. |
| `label` | Non | `string` | `'Lignes par page'` | Nom visible ou accessible selon le rendu. |
| `disabled` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(size: number) => void` |

## Comportement réel

Émet la taille choisie ; la pagination et les requêtes appartiennent au parent. Fournir une value présente dans les options entières positives.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {PageSizeSelect} from '@mdevs/ui/primitives/page-size-select';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "value": 25
} as const;

export function Example() {
  const [value, setValue] = useState<ComponentProps<typeof PageSizeSelect>['value']>(sampleProps.value);
  return <PageSizeSelect {...sampleProps} value={value} onValueChange={setValue}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "value": 25
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/page-size-select.tsx) — dans le monorepo : `packages/ui/src/primitives/page-size-select.tsx` ; dans le package installé : `src/primitives/page-size-select.tsx`.
- Déclarations après build : `dist/primitives/page-size-select.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
