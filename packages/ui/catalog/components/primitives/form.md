# Form

Formulaire natif avec soumission FormData optionnelle.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {Form} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {Form} from '@mdevs/ui/primitives/form';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
    onValuesSubmit?: (data: FormData) => void;
    onSubmit?: FormHTMLAttributes<HTMLFormElement>['onSubmit'];
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `onValuesSubmit` | Non | `(data: FormData) => void` | — | Consulter le contrat et le comportement ci-dessous. |
| `onSubmit` | Non | `FormHTMLAttributes<HTMLFormElement>['onSubmit']` | — | Reçoit les données validées par le navigateur ; l’application gère persistance, erreurs et attente. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onValuesSubmit` | Optionnel | `(data: FormData) => void` |
| `onSubmit` | Optionnel | `FormHTMLAttributes<HTMLFormElement>['onSubmit']` |

## Comportement réel

Le onSubmit natif est appelé d’abord. Si l’événement n’est pas empêché et onValuesSubmit est présent, le composant empêche la soumission native et passe FormData à onValuesSubmit. Aucun retour Promise ou état pending n’est attendu.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {Form} from '@mdevs/ui/primitives/form';
import '@mdevs/ui/styles.css';


export function Example() {
  const [name, setName] = useState('');
  return <><Form onValuesSubmit={data => setName(String(data.get("name") ?? ""))}><label htmlFor="form-name">Nom</label><input id="form-name" name="name" required/><button type="submit">Valider</button></Form><p role="status">{name}</p></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/form.tsx) — dans le monorepo : `packages/ui/src/primitives/form.tsx` ; dans le package installé : `src/primitives/form.tsx`.
- Déclarations après build : `dist/primitives/form.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
