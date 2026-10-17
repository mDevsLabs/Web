# AppShell

Structure applicative avec header, navigation et contenu principal nommé.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {AppShell} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {AppShell} from '@mdevs/ui/primitives/app-shell';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
    header?: ReactNode;
    sidebar?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;
    mainId?: string;
    mainLabel?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `header` | Non | `ReactNode` | — | Consulter le contrat et le comportement ci-dessous. |
| `sidebar` | Non | `ReactNode` | — | Consulter le contrat et le comportement ci-dessous. |
| `footer` | Non | `ReactNode` | — | Consulter le contrat et le comportement ci-dessous. |
| `children` | Non | `ReactNode` | — | Contenu React ; fournir un élément interactif unique si utilisé comme déclencheur Radix. |
| `mainId` | Non | `string` | `'main-content'` | Consulter le contrat et le comportement ci-dessous. |
| `mainLabel` | Non | `string` | `'Contenu principal'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Créer au plus un main actif dans la page. mainId doit être unique ; composer SkipLink au-dessus avec la même cible. Le layout replie la sidebar au-dessus du contenu sur petit écran.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {AppShell} from '@mdevs/ui/primitives/app-shell';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "header": "Horizon",
  "sidebar": "Navigation",
  "children": "Votre contenu principal."
} as const;

export function Example() {

  return <AppShell {...sampleProps} />;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "header": "Horizon",
  "sidebar": "Navigation",
  "children": "Votre contenu principal."
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/app-shell.tsx) — dans le monorepo : `packages/ui/src/primitives/app-shell.tsx` ; dans le package installé : `src/primitives/app-shell.tsx`.
- Déclarations après build : `dist/primitives/app-shell.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
