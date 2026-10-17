# Tooltip

Aide survolable et disponible au focus.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Tooltip} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Tooltip} from '@mdevs/ui/primitives/tooltip';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    delayDuration?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `content` | **Oui** | `ReactNode` | — | Consulter le contrat et le comportement ci-dessous. |
| `children` | **Oui** | `ReactNode` | — | Contenu React ; fournir un élément interactif unique si utilisé comme déclencheur Radix. |
| `delayDuration` | Non | `number` | `350` | Consulter le contrat et le comportement ci-dessous. |
| `side` | Non | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Tooltip Radix dont children est le déclencheur asChild et content la bulle. Fournir un élément interactif acceptant props et ref ; la bulle ne remplace pas le nom accessible du déclencheur.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Tooltip} from '@mdevs/ui/primitives/tooltip';
import '@mdevs/ui/styles.css';


export function Example() {
  return <Tooltip content="Enregistrer le document"><button type="button">Enregistrer</button></Tooltip>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "content": "Enregistrer le document",
  "children": "Déclencheur à fournir"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/tooltip.tsx) — dans le monorepo : `packages/ui/src/primitives/tooltip.tsx` ; dans le package installé : `src/primitives/tooltip.tsx`.
- Déclarations après build : `dist/primitives/tooltip.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
