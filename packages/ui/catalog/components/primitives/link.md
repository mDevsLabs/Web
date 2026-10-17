# Link

Lien natif avec focus visible.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Link} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Link} from '@mdevs/ui/primitives/link';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
// Type de props natif du composant ; cet alias descriptif n’est pas un export.
type ComponentProps = AnchorHTMLAttributes<HTMLAnchorElement>;
```


Ce composant expose des attributs React natifs ; la signature exacte figure ci-dessous.

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Ancre HTML ; target="_blank" ajoute noopener noreferrer si rel n’est pas déjà fourni. Le routage dépend du href et de l’application.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Link} from '@mdevs/ui/primitives/link';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "href": "#catalogue",
  "children": "Explorer le catalogue"
} as const;

export function Example() {
  return <Link {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "href": "#catalogue",
  "children": "Explorer le catalogue"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/link.tsx) — dans le monorepo : `packages/ui/src/primitives/link.tsx` ; dans le package installé : `src/primitives/link.tsx`.
- Déclarations après build : `dist/primitives/link.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
