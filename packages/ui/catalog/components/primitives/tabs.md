# Tabs

Onglets avec activation et navigation au clavier.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Tabs} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Tabs} from '@mdevs/ui/primitives/tabs';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface TabsProps {
    items: readonly {
        id: string;
        label: string;
        content: ReactNode;
        disabled?: boolean;
    }[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    label: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly {     id: string;     label: string;     content: ReactNode;     disabled?: boolean; }[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `value` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `defaultValue` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | Non | `(value: string) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | Optionnel | `(value: string) => void` |

## Comportement réel

Tabs Radix avec un onglet par id. Le premier id initialise defaultValue quand il est absent ; value/onValueChange permettent un contrôle parent. Les panneaux viennent de item.content.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Tabs} from '@mdevs/ui/primitives/tabs';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Sections",
  "items": [
    {
      "id": "overview",
      "label": "Vue générale",
      "content": "Vue générale du projet."
    },
    {
      "id": "activity",
      "label": "Activité",
      "content": "Historique récent."
    }
  ]
} as const;

export function Example() {
  return <Tabs {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Sections",
  "items": [
    {
      "id": "overview",
      "label": "Vue générale",
      "content": "Vue générale du projet."
    },
    {
      "id": "activity",
      "label": "Activité",
      "content": "Historique récent."
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

- [Source TypeScript du composant](../../../src/primitives/tabs.tsx) — dans le monorepo : `packages/ui/src/primitives/tabs.tsx` ; dans le package installé : `src/primitives/tabs.tsx`.
- Déclarations après build : `dist/primitives/tabs.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
