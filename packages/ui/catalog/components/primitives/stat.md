# Stat

Indicateur avec valeur et évolution explicites.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Stat} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Stat} from '@mdevs/ui/primitives/stat';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface StatProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: ReactNode;
    change?: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `value` | **Oui** | `ReactNode` | — | Consulter le contrat et le comportement ci-dessous. |
| `change` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `tone` | Non | `'neutral' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Affiche un indicateur fourni, son libellé et sa variation éventuelle ; aucun calcul automatique.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Stat} from '@mdevs/ui/primitives/stat';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Revenu mensuel",
  "value": "24 800 €",
  "change": "+12,4 %",
  "tone": "success"
} as const;

export function Example() {
  return <Stat {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Revenu mensuel",
  "value": "24 800 €",
  "change": "+12,4 %",
  "tone": "success"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/stat.tsx) — dans le monorepo : `packages/ui/src/primitives/stat.tsx` ; dans le package installé : `src/primitives/stat.tsx`.
- Déclarations après build : `dist/primitives/stat.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
