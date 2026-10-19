# MilestoneList

Liste : jalons.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {MilestoneList} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {MilestoneList} from '@mdevs/ui/milestone/milestone-list';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/milestone`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface MilestoneListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Milestone[];
    onSelect?: (item: Milestone) => void;
    emptyMessage?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly Milestone[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `onSelect` | Non | `(item: Milestone) => void` | — | Reporte la sélection ; aucun chargement ou navigation automatique. |
| `emptyMessage` | Non | `string` | `'Aucun élément.'` | Message affiché quand la collection est vide. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onSelect` | Optionnel | `(item: Milestone) => void` |

## Types et données du domaine

Le modèle `Milestone` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `project` | Projet | `string` | Oui | Chaîne applicative |
| `dueDate` | Échéance | `string` | Oui | Chaîne YYYY-MM-DD |
| `progress` | Avancement (%) | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `MilestoneStatus` | Oui | `planned`, `in-progress`, `achieved`, `delayed` |


```ts
export type Milestone = {
    id?: string;
    name: string;
    project: string;
    dueDate: string;
    progress: number;
    status: "planned" | "in-progress" | "achieved" | "delayed";
};

export type MilestoneStatus = Milestone['status'];

export interface MilestoneActivity extends DomainActivity {
    milestoneId?: string;
}

export type MilestoneMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalMilestone' | 'activeMilestone' | 'valueMilestone';
};

export type MilestoneSettingsValues = Partial<Record<"notifyMilestone" | "archiveMilestone" | "approveMilestone", boolean>>;
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

Affiche toute la collection dans son ordre reçu. Quand onSelect est fourni, chaque ligne devient un bouton type="button" et appelle ce callback avec l’enregistrement complet. Sans onSelect, les lignes restent du contenu de lecture. Une collection vide affiche emptyMessage ; aucune pagination ou virtualisation n’est appliquée.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {MilestoneList, type Milestone} from '@mdevs/ui/milestone';
import '@mdevs/ui/styles.css';

const items: Milestone[] = [{
  "id": "milestone-demo-1",
  "name": "Lancement public",
  "project": "Projet démo",
  "dueDate": "2026-10-04",
  "progress": 128,
  "status": "planned"
}];

export function Example() {
  const [selected, setSelected] = useState<Milestone | null>(null);
  return <><MilestoneList items={items} onSelect={setSelected}/><p role="status">{selected ? 'Sélection : ' + selected.name : 'Aucune sélection'}</p></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "milestone-demo-1",
      "name": "Lancement public",
      "project": "Projet démo",
      "dueDate": "2026-10-04",
      "progress": 128,
      "status": "planned"
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

- [Source TypeScript du composant](../../../src/components/milestone/milestone-list.tsx) — dans le monorepo : `packages/ui/src/components/milestone/milestone-list.tsx` ; dans le package installé : `src/components/milestone/milestone-list.tsx`.
- Déclarations après build : `dist/components/milestone/milestone-list.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../milestone/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/milestone/types.ts), [configuration](../../../src/components/milestone/config.ts) et [schéma JSON](../../milestone/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
