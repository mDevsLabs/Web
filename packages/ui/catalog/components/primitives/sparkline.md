# Sparkline

Tendance SVG compacte avec résumé et valeurs textuelles accessibles.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Sparkline} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Sparkline} from '@mdevs/ui/primitives/sparkline';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface SparklineProps extends HTMLAttributes<HTMLElement> {
    label: string;
    values: readonly number[];
    width?: number;
    height?: number;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `values` | **Oui** | `readonly number[]` | — | État contrôlé des réglages ; une clé absente se rend comme false. |
| `width` | Non | `number` | `160` | Consulter le contrat et le comportement ci-dessous. |
| `height` | Non | `number` | `48` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Filtre les valeurs non finies pour tracer une tendance ordonnée dans l’ordre reçu. Les valeurs textuelles sont accessibles ; aucune interprétation de dates ni interaction au survol.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Sparkline} from '@mdevs/ui/primitives/sparkline';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Tendance des inscriptions",
  "values": [
    4,
    8,
    6,
    12,
    10,
    16
  ]
} as const;

export function Example() {

  return <Sparkline {...sampleProps} />;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Tendance des inscriptions",
  "values": [
    4,
    8,
    6,
    12,
    10,
    16
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

- [Source TypeScript du composant](../../../src/primitives/sparkline.tsx) — dans le monorepo : `packages/ui/src/primitives/sparkline.tsx` ; dans le package installé : `src/primitives/sparkline.tsx`.
- Déclarations après build : `dist/primitives/sparkline.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
