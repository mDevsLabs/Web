# CharacterCountTextarea

Texte contrôlé, limite native et compteur lié au champ.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {CharacterCountTextarea} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {CharacterCountTextarea} from '@mdevs/ui/primitives/character-count-textarea';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface CharacterCountTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `value` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(value: string) => void` | — | Le parent met à jour value si le composant est contrôlé. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(value: string) => void` |

## Comportement réel

Compteur de longueur UTF-16, cohérent avec maxLength HTML ; aucune normalisation de graphemes ni sauvegarde automatique.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {CharacterCountTextarea} from '@mdevs/ui/primitives/character-count-textarea';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Description",
  "value": "Un projet clair.",
  "maxLength": 200
} as const;

export function Example() {
  const [value, setValue] = useState<ComponentProps<typeof CharacterCountTextarea>['value']>(sampleProps.value);
  return <CharacterCountTextarea {...sampleProps} value={value} onValueChange={setValue}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Description",
  "value": "Un projet clair.",
  "maxLength": 200
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/character-count-textarea.tsx) — dans le monorepo : `packages/ui/src/primitives/character-count-textarea.tsx` ; dans le package installé : `src/primitives/character-count-textarea.tsx`.
- Déclarations après build : `dist/primitives/character-count-textarea.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
