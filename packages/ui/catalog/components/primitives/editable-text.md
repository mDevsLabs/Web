# EditableText

Édition inline avec validation, annulation et retour du focus.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {EditableText} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {EditableText} from '@mdevs/ui/primitives/editable-text';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface EditableTextProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string;
    onCommit: (value: string) => void;
    disabled?: boolean;
    emptyLabel?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `value` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onCommit` | **Oui** | `(value: string) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `disabled` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `emptyLabel` | Non | `string` | `'Ajouter un texte'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onCommit` | **Obligatoire** | `(value: string) => void` |

## Comportement réel

Brouillon interne, onCommit synchrone puis fermeture. Escape annule. La validation métier/asynchrone reste au parent ; le composant ne doit pas recevoir de focus automatique au montage initial.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {EditableText} from '@mdevs/ui/primitives/editable-text';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Nom du projet",
  "value": "Horizon"
} as const;

export function Example() {
  const [value, setValue] = useState<ComponentProps<typeof EditableText>['value']>(sampleProps.value);
  return <EditableText {...sampleProps} value={value} onCommit={setValue}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Nom du projet",
  "value": "Horizon"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/editable-text.tsx) — dans le monorepo : `packages/ui/src/primitives/editable-text.tsx` ; dans le package installé : `src/primitives/editable-text.tsx`.
- Déclarations après build : `dist/primitives/editable-text.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
