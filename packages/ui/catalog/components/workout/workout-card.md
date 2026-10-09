# WorkoutCard

Fiche : entraînements.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {WorkoutCard} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {WorkoutCard} from '@mdevs/ui/workout/workout-card';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/workout`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface WorkoutCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Workout;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `item` | **Oui** | `Workout` | — | Enregistrement affiché ; les champs sont définis par le schéma du domaine. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Types et données du domaine

Le modèle `Workout` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `title` | Titre | `string` | Oui | Chaîne applicative |
| `activity` | Activité | `string` | Oui | Chaîne applicative |
| `durationMinutes` | Durée (min) | `number` | Oui | Nombre fini validé par le parent |
| `calories` | Calories | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `WorkoutStatus` | Oui | `planned`, `completed`, `skipped` |


```ts
export type Workout = {
    id?: string;
    title: string;
    activity: string;
    durationMinutes: number;
    calories: number;
    status: "planned" | "completed" | "skipped";
};

export type WorkoutStatus = Workout['status'];

export interface WorkoutActivity extends DomainActivity {
    workoutId?: string;
}

export type WorkoutMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalWorkout' | 'activeWorkout' | 'valueWorkout';
};

export type WorkoutSettingsValues = Partial<Record<"notifyWorkout" | "archiveWorkout" | "approveWorkout", boolean>>;
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

Affiche une fiche dans une section de domaine : le titre provient du champ titleKey sauf si title est fourni. Les autres champs apparaissent dans une liste de descriptions ; le statut reçoit un badge. Les valeurs vides deviennent « — ». Aucun bouton ou callback de sélection n’est ajouté.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {WorkoutCard, type Workout} from '@mdevs/ui/workout';
import '@mdevs/ui/styles.css';

const item: Workout = {
  "id": "workout-demo-1",
  "title": "Course du matin",
  "activity": "Activité démo",
  "durationMinutes": 128,
  "calories": 128,
  "status": "planned"
};

export function Example() {
  return <WorkoutCard item={item}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "item": {
    "id": "workout-demo-1",
    "title": "Course du matin",
    "activity": "Activité démo",
    "durationMinutes": 128,
    "calories": 128,
    "status": "planned"
  }
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/components/workout/workout-card.tsx) — dans le monorepo : `packages/ui/src/components/workout/workout-card.tsx` ; dans le package installé : `src/components/workout/workout-card.tsx`.
- Déclarations après build : `dist/components/workout/workout-card.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../workout/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/workout/types.ts), [configuration](../../../src/components/workout/config.ts) et [schéma JSON](../../workout/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
