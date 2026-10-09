# GlassCard

Carte avec en-tête, actions, contenu et pied.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {GlassCard} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {GlassCard} from '@mdevs/ui/primitives/glass-card';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends Omit<HTMLAttributes<HTMLElement>, 'title'>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface GlassCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title?: ReactNode;
    description?: ReactNode;
    footer?: ReactNode;
    actions?: ReactNode;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `ReactNode` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `ReactNode` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `footer` | Non | `ReactNode` | — | Consulter le contrat et le comportement ci-dessous. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Article avec titre, description, actions et footer optionnels. Un titre de type string relie l’article à son h3 ; un titre ReactNode personnalisé exige une vérification du nom accessible.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {GlassCard} from '@mdevs/ui/primitives/glass-card';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "title": "Un verre discret",
  "description": "Reflets doux et contraste lisible."
} as const;

export function Example() {
  return <GlassCard {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "title": "Un verre discret",
  "description": "Reflets doux et contraste lisible."
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/glass-card.tsx) — dans le monorepo : `packages/ui/src/primitives/glass-card.tsx` ; dans le package installé : `src/primitives/glass-card.tsx`.
- Déclarations après build : `dist/primitives/glass-card.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
