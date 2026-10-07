# SessionTimeoutPrompt

Dialogue d’expiration contrôlé avec continuer et se déconnecter.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {SessionTimeoutPrompt} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {SessionTimeoutPrompt} from '@mdevs/ui/primitives/session-timeout-prompt';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface SessionTimeoutPromptProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    secondsRemaining: number;
    onContinue: () => void;
    onSignOut: () => void;
    pending?: boolean;
    onReturnFocus?: () => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `open` | **Oui** | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `onOpenChange` | **Oui** | `(open: boolean) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `secondsRemaining` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `onContinue` | **Oui** | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `onSignOut` | **Oui** | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `pending` | Non | `boolean` | `false` | État fourni par le parent ; désactive les champs et le bouton de soumission. |
| `onReturnFocus` | Non | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onOpenChange` | **Obligatoire** | `(open: boolean) => void` |
| `onContinue` | **Obligatoire** | `() => void` |
| `onSignOut` | **Obligatoire** | `() => void` |
| `onReturnFocus` | Optionnel | `() => void` |

## Comportement réel

État de session et expiration contrôlés par le parent/service. Aucun rafraîchissement de token ni déconnexion automatique. Sans déclencheur, fournir onReturnFocus pour une cible existante. Échap demande onOpenChange(false), sans renouveler implicitement la session.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {SessionTimeoutPrompt} from '@mdevs/ui/primitives/session-timeout-prompt';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "open": false,
  "secondsRemaining": 60
} as const;

export function Example() {
  const [open, setOpen] = useState<ComponentProps<typeof SessionTimeoutPrompt>['open']>(sampleProps.open);
  return <SessionTimeoutPrompt {...sampleProps} open={open} onOpenChange={setOpen} onContinue={(...args) => {console.log('onContinue', ...args);}} onSignOut={(...args) => {console.log('onSignOut', ...args);}}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "open": false,
  "secondsRemaining": 60
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/session-timeout-prompt.tsx) — dans le monorepo : `packages/ui/src/primitives/session-timeout-prompt.tsx` ; dans le package installé : `src/primitives/session-timeout-prompt.tsx`.
- Déclarations après build : `dist/primitives/session-timeout-prompt.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
