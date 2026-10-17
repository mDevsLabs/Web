# FileDropzone

Sélection clavier ou dépôt de fichiers avec contrôle local de taille.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {FileDropzone} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {FileDropzone} from '@mdevs/ui/primitives/file-dropzone';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface FileDropzoneProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    onFiles: (files: File[]) => void;
    onRejected?: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxBytes?: number;
    disabled?: boolean;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `onFiles` | **Oui** | `(files: File[]) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `onRejected` | Non | `(files: File[]) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `accept` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `multiple` | Non | `boolean` | `false` | Consulter le contrat et le comportement ci-dessous. |
| `maxBytes` | Non | `number` | `10 * 1024 * 1024` | Consulter le contrat et le comportement ci-dessous. |
| `disabled` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onFiles` | **Obligatoire** | `(files: File[]) => void` |
| `onRejected` | Optionnel | `(files: File[]) => void` |

## Comportement réel

Sélection et dépôt sans transfert réseau. accept guide le sélecteur natif, pas le dépôt ; maxBytes contrôle uniquement la taille locale. Le service hôte doit valider MIME, extension, contenu et limites. onRejected signale les dépassements de taille.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {FileDropzone} from '@mdevs/ui/primitives/file-dropzone';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Joindre des documents",
  "multiple": true,
  "maxBytes": 10485760
} as const;

export function Example() {

  return <FileDropzone {...sampleProps} onFiles={(...args) => {console.log('onFiles', ...args);}}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Joindre des documents",
  "multiple": true,
  "maxBytes": 10485760
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/file-dropzone.tsx) — dans le monorepo : `packages/ui/src/primitives/file-dropzone.tsx` ; dans le package installé : `src/primitives/file-dropzone.tsx`.
- Déclarations après build : `dist/primitives/file-dropzone.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
