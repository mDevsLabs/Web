# CodeBlock

Bloc de code sélectionnable avec copie et gestion d’erreur locale.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {CodeBlock} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {CodeBlock} from '@mdevs/ui/primitives/code-block';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface CodeBlockProps extends HTMLAttributes<HTMLElement> {
    code: string;
    language?: string;
    label?: string;
    copyLabel?: string;
    onCopied?: () => void;
    onCopyError?: (error: unknown) => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `code` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `language` | Non | `string` | `'text'` | Consulter le contrat et le comportement ci-dessous. |
| `label` | Non | `string` | `'Exemple de code'` | Nom visible ou accessible selon le rendu. |
| `copyLabel` | Non | `string` | `'Copier le code'` | Consulter le contrat et le comportement ci-dessous. |
| `onCopied` | Non | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `onCopyError` | Non | `(error: unknown) => void` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onCopied` | Optionnel | `() => void` |
| `onCopyError` | Optionnel | `(error: unknown) => void` |

## Comportement réel

Texte React échappé, sans injection HTML ni coloration syntaxique. La copie requiert un contexte sécurisé et le presse-papiers disponible ; une erreur conserve le code sélectionnable.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {CodeBlock} from '@mdevs/ui/primitives/code-block';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "code": "import {Button} from '@mdevs/ui';",
  "language": "tsx",
  "label": "Premier import"
} as const;

export function Example() {

  return <CodeBlock {...sampleProps} />;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "code": "import {Button} from '@mdevs/ui';",
  "language": "tsx",
  "label": "Premier import"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/code-block.tsx) — dans le monorepo : `packages/ui/src/primitives/code-block.tsx` ; dans le package installé : `src/primitives/code-block.tsx`.
- Déclarations après build : `dist/primitives/code-block.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
