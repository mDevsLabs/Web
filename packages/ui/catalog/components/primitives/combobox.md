# Combobox

Choix recherchable avec navigation clavier et liste ARIA.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Combobox} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Combobox} from '@mdevs/ui/primitives/combobox';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface ComboboxProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    emptyMessage?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `options` | **Oui** | `readonly {     value: string;     label: string;     disabled?: boolean; }[]` | — | Valeurs et libellés réels ; conserver des valeurs stables. |
| `value` | **Oui** | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onValueChange` | **Oui** | `(value: string) => void` | — | Le parent met à jour value si le composant est contrôlé. |
| `disabled` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `placeholder` | Non | `string` | `'Rechercher…'` | Consulter le contrat et le comportement ci-dessous. |
| `emptyMessage` | Non | `string` | `'Aucun choix disponible.'` | Message affiché quand la collection est vide. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValueChange` | **Obligatoire** | `(value: string) => void` |

## Comportement réel

Liste recherchable locale ; Flèche haut/bas saute les choix désactivés, Entrée choisit, Échap ferme. Le focus reste sur le champ via aria-activedescendant. Unicité des valeurs exigée ; pas de portail ni virtualisation. Ajouter une recherche serveur dans le parent pour des volumes importants.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {Combobox} from '@mdevs/ui/primitives/combobox';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "Équipe",
  "value": "design",
  "options": [
    {
      "value": "design",
      "label": "Design"
    },
    {
      "value": "dev",
      "label": "Développement"
    },
    {
      "value": "sales",
      "label": "Ventes",
      "disabled": true
    }
  ]
} as const;

export function Example() {
  const [value, setValue] = useState<ComponentProps<typeof Combobox>['value']>(sampleProps.value);
  return <Combobox {...sampleProps} value={value} onValueChange={setValue}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "Équipe",
  "value": "design",
  "options": [
    {
      "value": "design",
      "label": "Design"
    },
    {
      "value": "dev",
      "label": "Développement"
    },
    {
      "value": "sales",
      "label": "Ventes",
      "disabled": true
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

- [Source TypeScript du composant](../../../src/primitives/combobox.tsx) — dans le monorepo : `packages/ui/src/primitives/combobox.tsx` ; dans le package installé : `src/primitives/combobox.tsx`.
- Déclarations après build : `dist/primitives/combobox.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
