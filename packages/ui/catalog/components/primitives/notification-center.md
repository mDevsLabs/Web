# NotificationCenter

Notifications avec état de lecture contrôlé.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {NotificationCenter} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {NotificationCenter} from '@mdevs/ui/primitives/notification-center';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface NotificationItem {
    id: string;
    title: string;
    description?: string;
    date: string;
    read?: boolean;
}

export interface NotificationCenterProps {
    notifications: readonly NotificationItem[];
    onMarkRead?: (id: string) => void;
    label?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `notifications` | **Oui** | `readonly NotificationItem[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `onMarkRead` | Non | `(id: string) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `label` | Non | `string` | `'Notifications'` | Nom visible ou accessible selon le rendu. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onMarkRead` | Optionnel | `(id: string) => void` |

## Comportement réel

Affiche la collection dans l’ordre reçu. Les notifications non lues affichent un badge ; si onMarkRead existe, un bouton transmet l’id. Le parent actualise read et persiste ce changement.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {NotificationCenter} from '@mdevs/ui/primitives/notification-center';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "notifications": [
    {
      "id": "1",
      "title": "Bienvenue dans votre espace",
      "date": "2026-10-04",
      "read": false
    }
  ]
} as const;

export function Example() {
  return <NotificationCenter {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "notifications": [
    {
      "id": "1",
      "title": "Bienvenue dans votre espace",
      "date": "2026-10-04",
      "read": false
    }
  ]
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/notification-center.tsx) — dans le monorepo : `packages/ui/src/primitives/notification-center.tsx` ; dans le package installé : `src/primitives/notification-center.tsx`.
- Déclarations après build : `dist/primitives/notification-center.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
