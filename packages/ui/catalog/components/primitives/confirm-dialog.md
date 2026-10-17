# ConfirmDialog

Confirmation explicite d’une action utilisateur.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {ConfirmDialog} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {ConfirmDialog} from '@mdevs/ui/primitives/confirm-dialog';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface ConfirmDialogProps {
    title: string;
    description: string;
    trigger: ReactNode;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | **Oui** | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | **Oui** | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `trigger` | **Oui** | `ReactNode` | — | Élément React interactif ; les déclencheurs Radix asChild exigent un enfant acceptant props et ref. |
| `onConfirm` | **Oui** | `() => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `confirmLabel` | Non | `string` | `'Confirmer'` | Consulter le contrat et le comportement ci-dessous. |
| `cancelLabel` | Non | `string` | `'Annuler'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onConfirm` | **Obligatoire** | `() => void` |

## Comportement réel

Dialog Radix avec trigger, titre et description requis. Confirmer ferme via Dialog.Close et appelle onConfirm ; le composant n’attend pas une opération asynchrone et ne gère ni pending ni erreurs.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {ConfirmDialog} from '@mdevs/ui/primitives/confirm-dialog';
import '@mdevs/ui/styles.css';


export function Example() {
  const [confirmed, setConfirmed] = useState(false);
  return <><ConfirmDialog title="Archiver ce projet ?" description="Vous pourrez le restaurer plus tard." trigger={<button type="button">Archiver</button>} onConfirm={() => setConfirmed(true)}/><p role="status">{confirmed ? "Confirmation reçue par le parent." : ""}</p></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "title": "Archiver ce projet ?",
  "description": "Vous pourrez le restaurer plus tard."
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/confirm-dialog.tsx) — dans le monorepo : `packages/ui/src/primitives/confirm-dialog.tsx` ; dans le package installé : `src/primitives/confirm-dialog.tsx`.
- Déclarations après build : `dist/primitives/confirm-dialog.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
