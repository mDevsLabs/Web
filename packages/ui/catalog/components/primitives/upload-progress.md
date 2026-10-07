# UploadProgress

Affichage de transfert avec annulation déléguée.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {UploadProgress} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {UploadProgress} from '@mdevs/ui/primitives/upload-progress';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface UploadProgressProps {
    name: string;
    progress: number;
    status?: 'uploading' | 'complete' | 'error';
    onCancel?: () => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `name` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `progress` | **Oui** | `number` | — | Consulter le contrat et le comportement ci-dessous. |
| `status` | Non | `'uploading' \| 'complete' \| 'error'` | `'uploading'` | Valeur du contrat ; une chaîne vide signifie tous les statuts pour les filtres. |
| `onCancel` | Non | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onCancel` | Optionnel | `() => void` |

## Comportement réel

Affiche la progression bornée à 0..100 et le statut uploading/complete/error. onCancel apparaît uniquement pendant uploading. Aucun transfert de fichier ni annulation réseau n’est géré.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {UploadProgress} from '@mdevs/ui/primitives/upload-progress';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "name": "rapport.pdf",
  "progress": 72
} as const;

export function Example() {
  return <UploadProgress {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "name": "rapport.pdf",
  "progress": 72
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/upload-progress.tsx) — dans le monorepo : `packages/ui/src/primitives/upload-progress.tsx` ; dans le package installé : `src/primitives/upload-progress.tsx`.
- Déclarations après build : `dist/primitives/upload-progress.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
