# ConsentField

Consentement requis et contenu de conditions lié au contrôle.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {ConsentField} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {ConsentField} from '@mdevs/ui/primitives/consent-field';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends HTMLAttributes<HTMLDivElement>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface ConsentFieldProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    children?: ReactNode;
    required?: boolean;
    disabled?: boolean;
    name?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `label` | **Oui** | `string` | — | Nom visible ou accessible selon le rendu. |
| `checked` | **Oui** | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `onCheckedChange` | **Oui** | `(checked: boolean) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `children` | Non | `ReactNode` | — | Contenu React ; fournir un élément interactif unique si utilisé comme déclencheur Radix. |
| `required` | Non | `boolean` | `true` | Consulter le contrat et le comportement ci-dessous. |
| `disabled` | Non | `boolean` | — | Consulter le contrat et le comportement ci-dessous. |
| `name` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onCheckedChange` | **Obligatoire** | `(checked: boolean) => void` |

## Comportement réel

Consentement requis et contenu de conditions lié au contrôle.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState, type ComponentProps} from 'react';
import {ConsentField} from '@mdevs/ui/primitives/consent-field';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "label": "J’accepte les conditions",
  "checked": false,
  "children": "Lisez les conditions du service avant de continuer."
} as const;

export function Example() {
  const [checked, setChecked] = useState<ComponentProps<typeof ConsentField>['checked']>(sampleProps.checked);
  return <ConsentField {...sampleProps} checked={checked} onCheckedChange={setChecked}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "label": "J’accepte les conditions",
  "checked": false,
  "children": "Lisez les conditions du service avant de continuer."
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/consent-field.tsx) — dans le monorepo : `packages/ui/src/primitives/consent-field.tsx` ; dans le package installé : `src/primitives/consent-field.tsx`.
- Déclarations après build : `dist/primitives/consent-field.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
