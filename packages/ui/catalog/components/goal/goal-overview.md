# GoalOverview

Synthèse : objectifs.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {GoalOverview} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {GoalOverview} from '@mdevs/ui/goal/goal-overview';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/goal`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface GoalOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Goal[];
    metrics: readonly GoalMetric[];
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly Goal[]` | — | Collection en lecture ; aperçu des cinq premiers éléments. |
| `metrics` | **Oui** | `readonly GoalMetric[]` | — | Indicateurs déjà calculés par l’application ; le composant ne les agrège pas. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Types et données du domaine

Le modèle `Goal` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `title` | Titre | `string` | Oui | Chaîne applicative |
| `owner` | Responsable | `string` | Oui | Chaîne applicative |
| `progress` | Avancement (%) | `number` | Oui | Nombre fini validé par le parent |
| `dueDate` | Échéance | `string` | Oui | Chaîne YYYY-MM-DD |
| `status` | Statut | `GoalStatus` | Oui | `active`, `achieved`, `paused` |


```ts
export type Goal = {
    id?: string;
    title: string;
    owner: string;
    progress: number;
    dueDate: string;
    status: "active" | "achieved" | "paused";
};

export type GoalStatus = Goal['status'];

export interface GoalActivity extends DomainActivity {
    goalId?: string;
}

export type GoalMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalGoal' | 'activeGoal' | 'valueGoal';
};

export type GoalSettingsValues = Partial<Record<"notifyGoal" | "archiveGoal" | "approveGoal", boolean>>;
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

Affiche les indicateurs fournis, puis les cinq premiers éléments dans leur ordre reçu. Pour chaque élément, montre le champ titre et au plus deux autres champs. Le tableau complet et les calculs des indicateurs appartiennent au parent. Les propriétés change et tone des métriques ne sont pas affichées dans cette famille.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {GoalOverview, type Goal, type GoalMetric} from '@mdevs/ui/goal';
import '@mdevs/ui/styles.css';

const items: Goal[] = [{
  "id": "goal-demo-1",
  "title": "Lancer le nouveau produit",
  "owner": "Marie Dupont",
  "progress": 128,
  "dueDate": "2026-10-04",
  "status": "active"
}];
const metrics: GoalMetric[] = [
  {
    "id": "totalGoal",
    "label": "Total",
    "value": 24
  },
  {
    "id": "activeGoal",
    "label": "Actifs",
    "value": 18,
    "change": "+4 ce mois",
    "tone": "success"
  },
  {
    "id": "valueGoal",
    "label": "À traiter",
    "value": 6
  }
];

export function Example() {
  return <GoalOverview items={items} metrics={metrics}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "goal-demo-1",
      "title": "Lancer le nouveau produit",
      "owner": "Marie Dupont",
      "progress": 128,
      "dueDate": "2026-10-04",
      "status": "active"
    }
  ],
  "metrics": [
    {
      "id": "totalGoal",
      "label": "Total",
      "value": 24
    },
    {
      "id": "activeGoal",
      "label": "Actifs",
      "value": 18,
      "change": "+4 ce mois",
      "tone": "success"
    },
    {
      "id": "valueGoal",
      "label": "À traiter",
      "value": 6
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

- [Source TypeScript du composant](../../../src/components/goal/goal-overview.tsx) — dans le monorepo : `packages/ui/src/components/goal/goal-overview.tsx` ; dans le package installé : `src/components/goal/goal-overview.tsx`.
- Déclarations après build : `dist/components/goal/goal-overview.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../goal/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/goal/types.ts), [configuration](../../../src/components/goal/config.ts) et [schéma JSON](../../goal/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
