# Accordion

Sections repliables sans gestion de focus artisanale.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Accordion} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Accordion} from '@mdevs/ui/primitives/accordion';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface AccordionProps {
    items: readonly {
        id: string;
        title: string;
        content: ReactNode;
        disabled?: boolean;
    }[];
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly {     id: string;     title: string;     content: ReactNode;     disabled?: boolean; }[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `defaultValue` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `value` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | Non | `(value: string) => void` | — | Le parent met à jour value si le composant est contrôlé. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | Optionnel | `(value: string) => void` |

## Comportement réel

Accordion Radix single et collapsible. Un seul id peut être ouvert ; value/onValueChange contrôlent l’ouverture, defaultValue l’initialise.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Accordion} from '@mdevs/ui/primitives/accordion';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "items": [
    {
      "id": "install",
      "title": "Comment installer ?",
      "content": "Installez les packages et importez styles.css."
    },
    {
      "id": "theme",
      "title": "Comment personnaliser ?",
      "content": "Utilisez ThemeProvider et les variables CSS."
    }
  ]
} as const;

export function Example() {
  return <Accordion {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "install",
      "title": "Comment installer ?",
      "content": "Installez les packages et importez styles.css."
    },
    {
      "id": "theme",
      "title": "Comment personnaliser ?",
      "content": "Utilisez ThemeProvider et les variables CSS."
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

- [Source TypeScript du composant](../../../src/primitives/accordion.tsx) — dans le monorepo : `packages/ui/src/primitives/accordion.tsx` ; dans le package installé : `src/primitives/accordion.tsx`.
- Déclarations après build : `dist/primitives/accordion.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
