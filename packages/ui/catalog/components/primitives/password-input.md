# PasswordInput

Mot de passe avec visibilité contrôlée par l’utilisateur.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {PasswordInput} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {PasswordInput} from '@mdevs/ui/primitives/password-input';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations

Héritage exact : `extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>`. Les attributs hérités sont définis par React ou Radix ; les options propres sont listées ci-dessous.


```ts
export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    showLabel?: string;
    hideLabel?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `showLabel` | Non | `string` | `'Afficher le mot de passe'` | Consulter le contrat et le comportement ci-dessous. |
| `hideLabel` | Non | `string` | `'Masquer le mot de passe'` | Consulter le contrat et le comportement ci-dessous. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Champ mot de passe avec bouton d’affichage/masquage. La valeur et la validation restent celles de l’input natif ; vérifier le label du champ.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {PasswordInput} from '@mdevs/ui/primitives/password-input';
import '@mdevs/ui/styles.css';

const sampleProps = {
  "aria-label": "Mot de passe",
  "defaultValue": "secret-demo"
} as const;

export function Example() {
  return <PasswordInput {...sampleProps}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "aria-label": "Mot de passe",
  "defaultValue": "secret-demo"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/primitives/password-input.tsx) — dans le monorepo : `packages/ui/src/primitives/password-input.tsx` ; dans le package installé : `src/primitives/password-input.tsx`.
- Déclarations après build : `dist/primitives/password-input.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
