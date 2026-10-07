# ToastProvider

Notifications locales avec durées et nettoyage des temporisateurs.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {ToastProvider} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {ToastProvider} from '@mdevs/ui/primitives/toast-provider';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les éventuels types auxiliaires exportés se trouvent dans le même module ciblé.

## Contrat public et obligations


```ts
export interface ToastMessage {
    id: string;
    title: string;
    description?: string;
    tone?: 'info' | 'success' | 'warning' | 'danger';
}

export interface ToastInput extends Omit<ToastMessage, 'id'> {
    duration?: number;
}

// Type de props natif du composant ; cet alias descriptif n’est pas un export.
type ComponentProps = {
    children: ReactNode;
};
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `children` | **Oui** | `ReactNode` | — | Contenu React ; fournir un élément interactif unique si utilisé comme déclencheur Radix. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Comportement réel

Contexte de notifications : useToast() exige ce provider. notify renvoie un id, dismiss(id) retire le message. Trois messages maximum sont conservés dans l’affichage ; durée de 5 000 ms par défaut, <=0 conserve le message. Le provider nettoie les timers au démontage.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {ToastProvider, useToast} from '@mdevs/ui/primitives/toast-provider';
import '@mdevs/ui/styles.css';

function NotifyButton() {
  const {notify} = useToast();
  return <button type="button" onClick={() => notify({title:"Préférences mises à jour", tone:"success"})}>Afficher une notification</button>;
}

export function Example() {
  return <ToastProvider><NotifyButton/></ToastProvider>;
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

- [Source TypeScript du composant](../../../src/primitives/toast-provider.tsx) — dans le monorepo : `packages/ui/src/primitives/toast-provider.tsx` ; dans le package installé : `src/primitives/toast-provider.tsx`.
- Déclarations après build : `dist/primitives/toast-provider.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../primitives/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
