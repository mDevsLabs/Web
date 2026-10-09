# CopyButton

Copie utilisateur avec confirmation et gestion des erreurs.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {CopyButton} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {CopyButton} from '@mdevs/ui/primitives/copy-button';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onCopy'>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onCopy'> {
    value: string;
    onCopied?: () => void;
    onError?: (error: unknown) => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `value` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onCopied` | Non | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `onError` | Non | `(error: unknown) => void` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onCopied` | Optionnel | `() => void` |
| `onError` | Optionnel | `(error: unknown) => void` |

## Comportement réel

Écrit value dans navigator.clipboard lors du clic. Le onClick natif peut empêcher l’action via preventDefault(). Succès : feedback pendant 1 800 ms et onCopied ; échec : onError. Vérifier le contexte sécurisé et gérer un éventuel refus d’accès dans le projet hôte.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {CopyButton} from '@mdevs/ui/primitives/copy-button';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "value": "npm install @mdevs/ui",
  "children": "Copier la commande"
} as const;

export function Example() {
  return <CopyButton {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "value": "npm install @mdevs/ui",
  "children": "Copier la commande"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/copy-button.tsx) — dans le monorepo : `packages/ui/src/primitives/copy-button.tsx` ; dans le package installé : `src/primitives/copy-button.tsx`.
- Déclarations après build : `dist/primitives/copy-button.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
