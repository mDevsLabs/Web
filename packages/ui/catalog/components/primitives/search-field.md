# SearchField

Formulaire de recherche explicite avec envoi et effacement.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {SearchField} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {SearchField} from '@mdevs/ui/primitives/search-field';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit'>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface SearchFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    onSearch: (query: string) => void;
    pending?: boolean;
    placeholder?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `value` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(value: string) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `onSearch` | **Oui** | `(query: string) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `pending` | Non | `boolean` | `false` | État fourni par le parent ; désactive les champs et le bouton de soumission. |
| `placeholder` | Non | `string` | `'Rechercher…'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(value: string) => void` |
| `onSearch` | **Obligatoire** | `(query: string) => void` |

## Comportement réel

Formulaire de recherche explicite avec envoi et effacement.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {SearchField} from '@mdevs/ui/primitives/search-field';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Rechercher des documents",
  "value": ""
} as const;

export function Example() {
  const [value, setValue] = useState<ComponentProps<typeof SearchField>['value']>(sampleProps.value);
  return <SearchField {...sampleProps} value={value} onValueChange={setValue} onSearch={(...args) => {console.log('onSearch', ...args);}}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Rechercher des documents",
  "value": ""
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/search-field.tsx) — dans le monorepo : `packages/ui/src/primitives/search-field.tsx` ; dans le package installé : `src/primitives/search-field.tsx`.
- Déclarations après build : `dist/primitives/search-field.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
