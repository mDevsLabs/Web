# RetryPanel

Échec de chargement avec relance et attente contrôlées.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {RetryPanel} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {RetryPanel} from '@mdevs/ui/primitives/retry-panel';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface RetryPanelProps extends HTMLAttributes<HTMLDivElement> {
    message: string;
    onRetry: () => void;
    pending?: boolean;
    retryLabel?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `message` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onRetry` | **Oui** | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `pending` | Non | `boolean` | `false` | État fourni par le parent ; désactive les champs et le bouton de soumission. |
| `retryLabel` | Non | `string` | `'Réessayer'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onRetry` | **Obligatoire** | `() => void` |

## Comportement réel

Échec de chargement avec relance et attente contrôlées.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {RetryPanel} from '@mdevs/ui/primitives/retry-panel';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "message": "Impossible de charger les documents."
} as const;

export function Example() {

  return <RetryPanel {...sampleProps} onRetry={(...args) => {console.log('onRetry', ...args);}}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "message": "Impossible de charger les documents."
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/retry-panel.tsx) — dans le monorepo : `packages/ui/src/primitives/retry-panel.tsx` ; dans le package installé : `src/primitives/retry-panel.tsx`.
- Déclarations après build : `dist/primitives/retry-panel.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
