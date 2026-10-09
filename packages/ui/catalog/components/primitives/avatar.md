# Avatar

Avatar avec initiales si l’image est absente ou échoue.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Avatar} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Avatar} from '@mdevs/ui/primitives/avatar';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLSpanElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
    src?: string;
    name: string;
    size?: number;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `src` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `name` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `size` | Non | `number` | `40` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Affiche une image si src existe ; après erreur, affiche les initiales des deux premiers mots de name. Le changement de src réinitialise l’erreur. Le conteneur est role="img" nommé par name.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {Avatar} from '@mdevs/ui/primitives/avatar';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "name": "Marie Dupont"
} as const;

export function Example() {
  return <Avatar {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "name": "Marie Dupont"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/avatar.tsx) — dans le monorepo : `packages/ui/src/primitives/avatar.tsx` ; dans le package installé : `src/primitives/avatar.tsx`.
- Déclarations après build : `dist/primitives/avatar.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
