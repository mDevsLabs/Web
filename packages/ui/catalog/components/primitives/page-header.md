# PageHeader

Titre de page, contexte de navigation et actions principales.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {PageHeader} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {PageHeader} from '@mdevs/ui/primitives/page-header';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends Omit<HTMLAttributes<HTMLElement>, 'title'>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title: string;
    description?: string;
    breadcrumbs?: ReactNode;
    actions?: ReactNode;
    headingLevel?: 1 | 2;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | **Oui** | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `breadcrumbs` | Non | `ReactNode` | — | Consulter le contrat et le comportement ci-dessous. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |
| `headingLevel` | Non | `1 \| 2` | `1` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Titre de page, contexte de navigation et actions principales.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {PageHeader} from '@mdevs/ui/primitives/page-header';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "title": "Documents",
  "description": "Consultez et organisez votre travail."
} as const;

export function Example() {

  return <PageHeader {...sampleProps} />;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "title": "Documents",
  "description": "Consultez et organisez votre travail."
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/page-header.tsx) — dans le monorepo : `packages/ui/src/primitives/page-header.tsx` ; dans le package installé : `src/primitives/page-header.tsx`.
- Déclarations après build : `dist/primitives/page-header.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
