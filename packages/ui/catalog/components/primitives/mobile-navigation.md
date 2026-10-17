# MobileNavigation

Menu compact en dialogue avec fermeture après choix d’un lien.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {MobileNavigation} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {MobileNavigation} from '@mdevs/ui/primitives/mobile-navigation';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface MobileNavigationProps {
    label: string;
    items: readonly {
        id: string;
        label: string;
        href: string;
    }[];
    currentId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `items` | **Oui** | `readonly {     id: string;     label: string;     href: string; }[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `currentId` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `open` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `onOpenChange` | Non | `(open: boolean) => void` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onOpenChange` | Optionnel | `(open: boolean) => void` |

## Comportement réel

Dialogue Radix, focus piégé et retour au déclencheur. Aucun breakpoint imposé : placer le déclencheur dans la zone compacte de l’application. open/onOpenChange permettent un contrôle externe.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {MobileNavigation} from '@mdevs/ui/primitives/mobile-navigation';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Navigation",
  "items": [
    {
      "id": "home",
      "label": "Accueil",
      "href": "#home"
    },
    {
      "id": "projects",
      "label": "Projets",
      "href": "#projects"
    }
  ]
} as const;

export function Example() {

  return <MobileNavigation {...sampleProps} />;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Navigation",
  "items": [
    {
      "id": "home",
      "label": "Accueil",
      "href": "#home"
    },
    {
      "id": "projects",
      "label": "Projets",
      "href": "#projects"
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

- [Source TypeScript du composant](../../../src/primitives/mobile-navigation.tsx) — dans le monorepo : `packages/ui/src/primitives/mobile-navigation.tsx` ; dans le package installé : `src/primitives/mobile-navigation.tsx`.
- Déclarations après build : `dist/primitives/mobile-navigation.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
