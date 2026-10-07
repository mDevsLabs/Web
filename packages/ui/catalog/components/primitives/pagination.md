# Pagination

Pagination bornée avec annonce de la page.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Pagination} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Pagination} from '@mdevs/ui/primitives/pagination';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends Omit<HTMLAttributes<HTMLElement>, 'onChange'>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    label?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `page` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `totalPages` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `onPageChange` | **Oui** | `(page: number) => void` | — | Le parent met à jour page et découpe la collection. |
| `label` | Non | `string` | `'Pagination'` | Nom visible ou accessible selon le rendu. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onPageChange` | **Obligatoire** | `(page: number) => void` |

## Comportement réel

page et totalPages sont contrôlés ; le rendu borne page à 1..max(1, floor(totalPages)). Les boutons appellent onPageChange. Le parent doit changer page, découper les données et gérer le chargement.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {Pagination} from '@mdevs/ui/primitives/pagination';
import '@mdevs/ui/styles.css';


export function Example() {
  const [page, setPage] = useState(1);
  return <Pagination page={page} totalPages={8} onPageChange={setPage}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "page": 1,
  "totalPages": 8
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/pagination.tsx) — dans le monorepo : `packages/ui/src/primitives/pagination.tsx` ; dans le package installé : `src/primitives/pagination.tsx`.
- Déclarations après build : `dist/primitives/pagination.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
