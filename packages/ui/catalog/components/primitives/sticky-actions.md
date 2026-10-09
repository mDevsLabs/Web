# StickyActions

Barre d’actions persistante dans le flux de défilement.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {StickyActions} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {StickyActions} from '@mdevs/ui/primitives/sticky-actions';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface StickyActionsProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    position?: 'top' | 'bottom';
    children?: ReactNode;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `position` | Non | `'top' \| 'bottom'` | `'bottom'` | Consulter le contrat et le comportement ci-dessous. |
| `children` | Non | `ReactNode` | — | Contenu React ; fournir un élément interactif unique si utilisé comme déclencheur Radix. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

position:sticky dans le conteneur de défilement ; pas de portail ni élément fixed global. Vérifier qu’elle ne masque pas les champs/focus au zoom ou dans un conteneur bas.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {StickyActions} from '@mdevs/ui/primitives/sticky-actions';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Actions du formulaire",
  "children": "Vos actions restent disponibles."
} as const;

export function Example() {

  return <StickyActions {...sampleProps} />;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Actions du formulaire",
  "children": "Vos actions restent disponibles."
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/sticky-actions.tsx) — dans le monorepo : `packages/ui/src/primitives/sticky-actions.tsx` ; dans le package installé : `src/primitives/sticky-actions.tsx`.
- Déclarations après build : `dist/primitives/sticky-actions.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
