# Popover

Contenu contextuel avec fermeture et retour de focus.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Popover} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Popover} from '@mdevs/ui/primitives/popover';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface PopoverProps {
    trigger: ReactNode;
    children?: ReactNode;
    label: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: 'top' | 'right' | 'bottom' | 'left';
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `trigger` | **Oui** | `ReactNode` | — | Élément React interactif ; les déclencheurs Radix asChild exigent un enfant acceptant props et ref. |
| `children` | Non | `ReactNode` | — | Contenu React ; fournir un élément interactif unique si utilisé comme déclencheur Radix. |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `open` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `onOpenChange` | Non | `(open: boolean) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `side` | Non | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onOpenChange` | Optionnel | `(open: boolean) => void` |

## Comportement réel

Popover Radix nommé par label avec trigger obligatoire asChild. open et onOpenChange contrôlent l’ouverture ; side configure le placement.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Popover} from '@mdevs/ui/primitives/popover';
import '@mdevs/ui/styles.css';


export function Example() {
  return <Popover label="Informations" trigger={<button type="button">Détails</button>}>Informations supplémentaires.</Popover>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Informations"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/popover.tsx) — dans le monorepo : `packages/ui/src/primitives/popover.tsx` ; dans le package installé : `src/primitives/popover.tsx`.
- Déclarations après build : `dist/primitives/popover.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
