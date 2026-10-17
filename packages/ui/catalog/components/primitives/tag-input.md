# TagInput

Étiquettes contrôlées avec ajout clavier et suppression.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {TagInput} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {TagInput} from '@mdevs/ui/primitives/tag-input';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface TagInputProps {
    value: readonly string[];
    onValueChange: (tags: string[]) => void;
    label: string;
    placeholder?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `value` | **Oui** | `readonly string[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(tags: string[]) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `placeholder` | Non | `string` | `'Ajouter une étiquette'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(tags: string[]) => void` |

## Comportement réel

value est contrôlé et onValueChange obligatoire. Entrée ajoute un texte trim() non vide s’il n’existe pas déjà ; le bouton de suppression renvoie la nouvelle collection. La composition IME est respectée et le parent conserve l’état.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {TagInput} from '@mdevs/ui/primitives/tag-input';
import '@mdevs/ui/styles.css';


export function Example() {
  const [tags, setTags] = useState<string[]>(['React']);
  return <TagInput label="Compétences" value={tags} onValueChange={setTags}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "value": [
    "Design",
    "React"
  ],
  "label": "Compétences"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/tag-input.tsx) — dans le monorepo : `packages/ui/src/primitives/tag-input.tsx` ; dans le package installé : `src/primitives/tag-input.tsx`.
- Déclarations après build : `dist/primitives/tag-input.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
