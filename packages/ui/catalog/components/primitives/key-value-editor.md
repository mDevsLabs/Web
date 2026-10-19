# KeyValueEditor

Paires clé/valeur contrôlées avec validation de clés uniques.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {KeyValueEditor} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {KeyValueEditor} from '@mdevs/ui/primitives/key-value-editor';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface KeyValueEditorProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: readonly {
        id: string;
        key: string;
        value: string;
    }[];
    onValueChange: (value: {
        id: string;
        key: string;
        value: string;
    }[]) => void;
    disabled?: boolean;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `value` | **Oui** | `readonly {     id: string;     key: string;     value: string; }[]` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(value: {     id: string;     key: string;     value: string; }[]) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `disabled` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(value: {     id: string;     key: string;     value: string; }[]) => void` |

## Comportement réel

Signale les doublons de clé après trim sans bloquer ni persister la saisie. Le parent décide de la validation avant sauvegarde. Les id de lignes doivent être uniques et stables.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {KeyValueEditor} from '@mdevs/ui/primitives/key-value-editor';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Métadonnées",
  "value": [
    {
      "id": "a",
      "key": "environment",
      "value": "production"
    }
  ]
} as const;

export function Example() {
  const [value, setValue] = useState<ComponentProps<typeof KeyValueEditor>['value']>(sampleProps.value);
  return <KeyValueEditor {...sampleProps} value={value} onValueChange={setValue}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Métadonnées",
  "value": [
    {
      "id": "a",
      "key": "environment",
      "value": "production"
    }
  ]
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/key-value-editor.tsx) — dans le monorepo : `packages/ui/src/primitives/key-value-editor.tsx` ; dans le package installé : `src/primitives/key-value-editor.tsx`.
- Déclarations après build : `dist/primitives/key-value-editor.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
