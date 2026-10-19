# UndoNotice

Résultat d’action avec annulation et fermeture fournies par le parent.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {UndoNotice} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {UndoNotice} from '@mdevs/ui/primitives/undo-notice';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface UndoNoticeProps extends HTMLAttributes<HTMLDivElement> {
    message: string;
    onUndo: () => void;
    onDismiss: () => void;
    pending?: boolean;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `message` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onUndo` | **Oui** | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `onDismiss` | **Oui** | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `pending` | Non | `boolean` | `false` | État fourni par le parent ; désactive les champs et le bouton de soumission. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onUndo` | **Obligatoire** | `() => void` |
| `onDismiss` | **Obligatoire** | `() => void` |

## Comportement réel

L’annulation réelle, la fenêtre de validité et les erreurs appartiennent au service/parent. Aucun timer de disparition ni restauration optimiste implicite.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {UndoNotice} from '@mdevs/ui/primitives/undo-notice';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "message": "Le document a été archivé."
} as const;

export function Example() {

  return <UndoNotice {...sampleProps} onUndo={(...args) => {console.log('onUndo', ...args);}} onDismiss={(...args) => {console.log('onDismiss', ...args);}}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "message": "Le document a été archivé."
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/undo-notice.tsx) — dans le monorepo : `packages/ui/src/primitives/undo-notice.tsx` ; dans le package installé : `src/primitives/undo-notice.tsx`.
- Déclarations après build : `dist/primitives/undo-notice.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
