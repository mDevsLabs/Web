# HabitEmptyState

État vide : habitudes.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {HabitEmptyState} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {HabitEmptyState} from '@mdevs/ui/habit/habit-empty-state';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/habit`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface HabitEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `message` | Non | `string` | `'Les éléments apparaîtront ici une fois créés.'` | Consulter le contrat et le comportement ci-dessous. |
| `actionLabel` | Non | `string` | — | Consulter le contrat et le comportement ci-dessous. |
| `onAction` | Non | `() => void` | — | Action exécutée seulement si le bouton d’état vide est affiché. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onAction` | Optionnel | `() => void` |

## Types et données du domaine

Le modèle `Habit` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `frequency` | Fréquence | `string` | Oui | Chaîne applicative |
| `streakDays` | Série (jours) | `number` | Oui | Nombre fini validé par le parent |
| `targetDays` | Objectif (jours) | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `HabitStatus` | Oui | `active`, `paused`, `completed` |


```ts
export type Habit = {
    id?: string;
    name: string;
    frequency: string;
    streakDays: number;
    targetDays: number;
    status: "active" | "paused" | "completed";
};

export type HabitStatus = Habit['status'];

export interface HabitActivity extends DomainActivity {
    habitId?: string;
}

export type HabitMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalHabit' | 'activeHabit' | 'valueHabit';
};

export type HabitSettingsValues = Partial<Record<"notifyHabit" | "archiveHabit" | "approveHabit", boolean>>;
```

Structures de référence partagées dans le code interne (lecture uniquement ; ne pas importer de sous-chemin internal) :


```ts
export interface DomainActivity {
    id: string;
    title: string;
    description?: string;
    date: string;
}

export interface DomainMetric {
    id: string;
    label: string;
    value: string | number;
    change?: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

export interface DomainFrameProps extends HTMLAttributes<HTMLElement> {
    title?: string;
    description?: string;
    actions?: ReactNode;
}
```

## Comportement réel

Affiche un message et un marqueur décoratif. Le bouton d’action existe uniquement quand actionLabel et onAction sont tous les deux fournis ; il appelle onAction. Aucun enregistrement, routage ou formulaire n’est créé automatiquement.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {HabitEmptyState} from '@mdevs/ui/habit';
import '@mdevs/ui/styles.css';


export function Example() {
  const [requested, setRequested] = useState(false);
  return <><HabitEmptyState message="Aucun élément disponible." actionLabel="Créer" onAction={() => setRequested(true)}/><p role="status">{requested ? 'Le parent peut ouvrir son formulaire de création.' : ''}</p></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "message": "Aucun élément dans habitudes.",
  "actionLabel": "Créer"
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/components/habit/habit-empty-state.tsx) — dans le monorepo : `packages/ui/src/components/habit/habit-empty-state.tsx` ; dans le package installé : `src/components/habit/habit-empty-state.tsx`.
- Déclarations après build : `dist/components/habit/habit-empty-state.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../habit/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/habit/types.ts), [configuration](../../../src/components/habit/config.ts) et [schéma JSON](../../habit/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
