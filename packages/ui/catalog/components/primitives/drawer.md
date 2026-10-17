# Drawer

Tiroir modal latéral ou inférieur.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Drawer} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Drawer} from '@mdevs/ui/primitives/drawer';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface DrawerProps {
    title: string;
    description?: string;
    trigger?: ReactNode;
    children?: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: 'left' | 'right' | 'bottom';
    closeLabel?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | **Oui** | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `trigger` | Non | `ReactNode` | — | Élément React interactif ; les déclencheurs Radix asChild exigent un enfant acceptant props et ref. |
| `children` | Non | `ReactNode` | — | Contenu React ; fournir un élément interactif unique si utilisé comme déclencheur Radix. |
| `open` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `defaultOpen` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `onOpenChange` | Non | `(open: boolean) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `side` | Non | `'left' \| 'right' \| 'bottom'` | `'right'` | Consulter le contrat et le comportement ci-dessous. |
| `closeLabel` | Non | `string` | `'Fermer'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onOpenChange` | Optionnel | `(open: boolean) => void` |

## Comportement réel

Dialog Radix dans un portail avec placement left/right/bottom ; open/onOpenChange suivent le contrat contrôlé. Fournir un déclencheur interactif et un titre.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Drawer} from '@mdevs/ui/primitives/drawer';
import '@mdevs/ui/styles.css';


export function Example() {
  return <Drawer title="Paramètres rapides" trigger={<button type="button">Paramètres</button>}>Contenu du panneau.</Drawer>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "title": "Paramètres rapides",
  "description": "Ajustez votre espace."
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/drawer.tsx) — dans le monorepo : `packages/ui/src/primitives/drawer.tsx` ; dans le package installé : `src/primitives/drawer.tsx`.
- Déclarations après build : `dist/primitives/drawer.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
