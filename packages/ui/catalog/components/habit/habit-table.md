# HabitTable

Tableau triable : habitudes.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {HabitTable} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {HabitTable} from '@mdevs/ui/habit/habit-table';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/habit`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface HabitTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Habit[];
    emptyMessage?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly Habit[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `emptyMessage` | Non | `string` | `'Aucun élément.'` | Message affiché quand la collection est vide. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

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

Rend toutes les colonnes du schéma et tous les éléments. Les boutons d’en-tête basculent un tri local ascendant/descendant ; les nombres sont comparés numériquement et les autres valeurs avec localeCompare({numeric:true}). Le tri copie la collection et ne modifie pas items. Il ne déclenche aucun tri serveur, callback, pagination ou chargement. La région est focalisable et défile horizontalement ; aria-sort décrit la colonne active.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {HabitTable, type Habit} from '@mdevs/ui/habit';
import '@mdevs/ui/styles.css';

const items: Habit[] = [{
  "id": "habit-demo-1",
  "name": "Lire chaque jour",
  "frequency": "Fréquence démo",
  "streakDays": 128,
  "targetDays": 128,
  "status": "active"
}];

export function Example() {
  return <HabitTable items={items} emptyMessage="Aucun résultat."/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "habit-demo-1",
      "name": "Lire chaque jour",
      "frequency": "Fréquence démo",
      "streakDays": 128,
      "targetDays": 128,
      "status": "active"
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

- [Source TypeScript du composant](../../../src/components/habit/habit-table.tsx) — dans le monorepo : `packages/ui/src/components/habit/habit-table.tsx` ; dans le package installé : `src/components/habit/habit-table.tsx`.
- Déclarations après build : `dist/components/habit/habit-table.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../habit/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/habit/types.ts), [configuration](../../../src/components/habit/config.ts) et [schéma JSON](../../habit/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
