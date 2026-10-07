# CommandPalette

Palette de recherche d’actions avec focus modal.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {CommandPalette} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {CommandPalette} from '@mdevs/ui/primitives/command-palette';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface CommandItem {
    id: string;
    label: string;
    keywords?: string;
    onSelect: () => void;
}

export interface CommandPaletteProps {
    items: readonly CommandItem[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
    title?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly CommandItem[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `open` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `onOpenChange` | Non | `(open: boolean) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `trigger` | Non | `ReactNode` | — | Élément React interactif ; les déclencheurs Radix asChild exigent un enfant acceptant props et ref. |
| `title` | Non | `string` | `'Rechercher une action'` | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onOpenChange` | Optionnel | `(open: boolean) => void` |
| `CommandItem.onSelect` | **Obligatoire dans cet objet** | `() => void` |

## Comportement réel

Dialog Radix avec recherche locale sur label et keywords. La fermeture remet la recherche à zéro. Chaque CommandItem exige onSelect ; la sélection exécute l’action et demande la fermeture via onOpenChange. Aucun écouteur global de raccourci n’est installé.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {CommandPalette} from '@mdevs/ui/primitives/command-palette';
import '@mdevs/ui/styles.css';


export function Example() {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState('');
  return <><CommandPalette open={open} onOpenChange={setOpen} trigger={<button type="button">Rechercher une action</button>} items={[{id:"new", label:"Créer un document", keywords:"nouveau", onSelect:() => setAction("new")}]} /><p role="status">{action}</p></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": []
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/command-palette.tsx) — dans le monorepo : `packages/ui/src/primitives/command-palette.tsx` ; dans le package installé : `src/primitives/command-palette.tsx`.
- Déclarations après build : `dist/primitives/command-palette.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
