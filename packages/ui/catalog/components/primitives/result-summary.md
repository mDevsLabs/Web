# ResultSummary

Résumé de la plage visible et du nombre total de résultats.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {ResultSummary} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {ResultSummary} from '@mdevs/ui/primitives/result-summary';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLParagraphElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface ResultSummaryProps extends HTMLAttributes<HTMLParagraphElement> {
    total: number;
    page: number;
    pageSize: number;
    label?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `total` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `page` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `pageSize` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `label` | Non | `string` | `'résultats'` | Nom visible ou accessible selon le rendu. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Résumé de la plage visible et du nombre total de résultats.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {ResultSummary} from '@mdevs/ui/primitives/result-summary';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "total": 128,
  "page": 2,
  "pageSize": 25
} as const;

export function Example() {

  return <ResultSummary {...sampleProps} />;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "total": 128,
  "page": 2,
  "pageSize": 25
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/result-summary.tsx) — dans le monorepo : `packages/ui/src/primitives/result-summary.tsx` ; dans le package installé : `src/primitives/result-summary.tsx`.
- Déclarations après build : `dist/primitives/result-summary.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
