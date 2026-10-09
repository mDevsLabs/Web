# ConnectionBanner

Connectivité fournie par le parent avec relance optionnelle.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {ConnectionBanner} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {ConnectionBanner} from '@mdevs/ui/primitives/connection-banner';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface ConnectionBannerProps extends HTMLAttributes<HTMLDivElement> {
    state: 'online' | 'offline' | 'reconnecting';
    onReconnect?: () => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `state` | **Oui** | `'online' \| 'offline' \| 'reconnecting'` | — | Consulter le contrat et le comportement ci-dessous. |
| `onReconnect` | Non | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onReconnect` | Optionnel | `() => void` |

## Comportement réel

Affiche un état explicite ; aucun navigateur online event, test réseau ou mécanisme de reconnexion automatique n’est installé.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {ConnectionBanner} from '@mdevs/ui/primitives/connection-banner';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "state": "offline"
} as const;

export function Example() {

  return <ConnectionBanner {...sampleProps} />;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "state": "offline"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/connection-banner.tsx) — dans le monorepo : `packages/ui/src/primitives/connection-banner.tsx` ; dans le package installé : `src/primitives/connection-banner.tsx`.
- Déclarations après build : `dist/primitives/connection-banner.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
