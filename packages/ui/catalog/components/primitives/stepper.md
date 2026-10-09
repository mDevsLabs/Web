# Stepper

Étapes d’un parcours avec état textuel.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Stepper} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Stepper} from '@mdevs/ui/primitives/stepper';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLOListElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
    steps: readonly string[];
    currentStep: number;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `steps` | **Oui** | `readonly string[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `currentStep` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Liste ordonnée d’étapes ; currentStep est un index à partir de zéro, les étapes précédentes sont marquées terminées. Aucune navigation de flux n’est déclenchée.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Stepper} from '@mdevs/ui/primitives/stepper';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "steps": [
    "Compte",
    "Profil",
    "Validation"
  ],
  "currentStep": 1
} as const;

export function Example() {
  return <Stepper {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "steps": [
    "Compte",
    "Profil",
    "Validation"
  ],
  "currentStep": 1
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/stepper.tsx) — dans le monorepo : `packages/ui/src/primitives/stepper.tsx` ; dans le package installé : `src/primitives/stepper.tsx`.
- Déclarations après build : `dist/primitives/stepper.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
