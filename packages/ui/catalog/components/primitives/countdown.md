# Countdown

Compte à rebours local avec nettoyage du timer au démontage.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Countdown} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Countdown} from '@mdevs/ui/primitives/countdown';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLSpanElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface CountdownProps extends HTMLAttributes<HTMLSpanElement> {
    seconds: number;
    label?: string;
    onElapsed?: () => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `seconds` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `label` | Non | `string` | `'Temps restant'` | Nom visible ou accessible selon le rendu. |
| `onElapsed` | Non | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onElapsed` | Optionnel | `() => void` |

## Comportement réel

Décompte de secondes depuis le montage ou changement de seconds. Les timers peuvent être retardés en arrière-plan ; ce composant n’est pas une horloge d’expiration fiable pour sécurité/session. onElapsed intervient quand un décompte positif atteint zéro.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Countdown} from '@mdevs/ui/primitives/countdown';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "seconds": 90
} as const;

export function Example() {

  return <Countdown {...sampleProps} />;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "seconds": 90
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/countdown.tsx) — dans le monorepo : `packages/ui/src/primitives/countdown.tsx` ; dans le package installé : `src/primitives/countdown.tsx`.
- Déclarations après build : `dist/primitives/countdown.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
