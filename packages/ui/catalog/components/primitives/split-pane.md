# SplitPane

Deux panneaux avec largeur contrôlée par un curseur clavier natif.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {SplitPane} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {SplitPane} from '@mdevs/ui/primitives/split-pane';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface SplitPaneProps extends HTMLAttributes<HTMLDivElement> {
    primary: ReactNode;
    secondary: ReactNode;
    value: number;
    onValueChange: (percent: number) => void;
    min?: number;
    max?: number;
    label?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `primary` | **Oui** | `ReactNode` | — | Consulter le contrat et le comportement ci-dessous. |
| `secondary` | **Oui** | `ReactNode` | — | Consulter le contrat et le comportement ci-dessous. |
| `value` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(percent: number) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `min` | Non | `number` | `20` | Consulter le contrat et le comportement ci-dessous. |
| `max` | Non | `number` | `80` | Consulter le contrat et le comportement ci-dessous. |
| `label` | Non | `string` | `'Largeur du premier panneau'` | Nom visible ou accessible selon le rendu. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(percent: number) => void` |

## Comportement réel

Le contrôle natif modifie la proportion du premier panneau (10–90 %). Les panneaux s’empilent sous 640 px ; pas de séparateur à glisser ni persistance implicite. Donner un label approprié au contrôle.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {SplitPane} from '@mdevs/ui/primitives/split-pane';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "primary": "Liste des documents",
  "secondary": "Détails du document",
  "value": 40
} as const;

export function Example() {
  const [value, setValue] = useState<ComponentProps<typeof SplitPane>['value']>(sampleProps.value);
  return <SplitPane {...sampleProps} value={value} onValueChange={setValue}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "primary": "Liste des documents",
  "secondary": "Détails du document",
  "value": 40
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/split-pane.tsx) — dans le monorepo : `packages/ui/src/primitives/split-pane.tsx` ; dans le package installé : `src/primitives/split-pane.tsx`.
- Déclarations après build : `dist/primitives/split-pane.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
