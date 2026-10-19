# Dialog

Fenêtre modale avec focus géré par Radix.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Dialog} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Dialog} from '@mdevs/ui/primitives/dialog';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface DialogProps {
    title: string;
    description?: string;
    trigger?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    closeLabel?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | **Oui** | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `trigger` | Non | `ReactNode` | — | Élément React interactif ; les déclencheurs Radix asChild exigent un enfant acceptant props et ref. |
| `children` | Non | `ReactNode` | — | Contenu React ; fournir un élément interactif unique si utilisé comme déclencheur Radix. |
| `footer` | Non | `ReactNode` | — | Consulter le contrat et le comportement ci-dessous. |
| `open` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `defaultOpen` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `onOpenChange` | Non | `(open: boolean) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `closeLabel` | Non | `string` | `'Fermer'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onOpenChange` | Optionnel | `(open: boolean) => void` |

## Comportement réel

Dialog Radix avec titre requis, description optionnelle, déclencheur asChild et contenu dans un portail. open/onOpenChange donnent un contrôle parent ; defaultOpen initialise le mode autonome. Les styles de portail viennent de ThemeProvider.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Dialog} from '@mdevs/ui/primitives/dialog';
import '@mdevs/ui/styles.css';


export function Example() {
  return <Dialog title="Détails du projet" description="Informations du projet courant." trigger={<button type="button">Ouvrir</button>}>Contenu du dialogue.</Dialog>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "title": "Créer un projet",
  "description": "Choisissez un nom et un espace."
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/dialog.tsx) — dans le monorepo : `packages/ui/src/primitives/dialog.tsx` ; dans le package installé : `src/primitives/dialog.tsx`.
- Déclarations après build : `dist/primitives/dialog.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
