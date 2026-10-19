# KnowledgeArticleTimeline

Historique : base de connaissances.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {KnowledgeArticleTimeline} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {KnowledgeArticleTimeline} from '@mdevs/ui/knowledge-article/knowledge-article-timeline';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/knowledge-article`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface KnowledgeArticleTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly KnowledgeArticleActivity[];
    emptyMessage?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `events` | **Oui** | `readonly KnowledgeArticleActivity[]` | — | Événements déjà ordonnés par le parent ; aucun tri chronologique implicite. |
| `emptyMessage` | Non | `string` | `'Aucune activité.'` | Message affiché quand la collection est vide. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Types et données du domaine

Le modèle `KnowledgeArticle` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `title` | Titre | `string` | Oui | Chaîne applicative |
| `author` | Auteur | `string` | Oui | Chaîne applicative |
| `viewCount` | Consultations | `number` | Oui | Nombre fini validé par le parent |
| `updatedOn` | Modification | `string` | Oui | Chaîne YYYY-MM-DD |
| `status` | Statut | `KnowledgeArticleStatus` | Oui | `draft`, `published`, `archived` |


```ts
export type KnowledgeArticle = {
    id?: string;
    title: string;
    author: string;
    viewCount: number;
    updatedOn: string;
    status: "draft" | "published" | "archived";
};

export type KnowledgeArticleStatus = KnowledgeArticle['status'];

export interface KnowledgeArticleActivity extends DomainActivity {
    knowledgearticleId?: string;
}

export type KnowledgeArticleMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalKnowledgeArticle' | 'activeKnowledgeArticle' | 'valueKnowledgeArticle';
};

export type KnowledgeArticleSettingsValues = Partial<Record<"notifyKnowledgeArticle" | "archiveKnowledgeArticle" | "approveKnowledgeArticle", boolean>>;
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

Affiche events dans leur ordre reçu dans une liste ordonnée, avec titre, description optionnelle et <time dateTime={date}>. date est affichée telle quelle. Aucun tri, formatage localisé, abonnement temps réel ou pagination n’est réalisé ; le parent prépare les valeurs et leur ordre.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {KnowledgeArticleTimeline, type KnowledgeArticleActivity} from '@mdevs/ui/knowledge-article';
import '@mdevs/ui/styles.css';

const events: KnowledgeArticleActivity[] = [
  {
    "id": "event-1",
    "title": "Base de connaissances : création",
    "description": "Nouvel élément ajouté au catalogue.",
    "date": "2026-10-04"
  },
  {
    "id": "event-2",
    "title": "Mise à jour",
    "date": "2026-10-05"
  }
];

export function Example() {
  return <KnowledgeArticleTimeline events={events}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "events": [
    {
      "id": "event-1",
      "title": "Base de connaissances : création",
      "description": "Nouvel élément ajouté au catalogue.",
      "date": "2026-10-04"
    },
    {
      "id": "event-2",
      "title": "Mise à jour",
      "date": "2026-10-05"
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

- [Source TypeScript du composant](../../../src/components/knowledge-article/knowledge-article-timeline.tsx) — dans le monorepo : `packages/ui/src/components/knowledge-article/knowledge-article-timeline.tsx` ; dans le package installé : `src/components/knowledge-article/knowledge-article-timeline.tsx`.
- Déclarations après build : `dist/components/knowledge-article/knowledge-article-timeline.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../knowledge-article/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/knowledge-article/types.ts), [configuration](../../../src/components/knowledge-article/config.ts) et [schéma JSON](../../knowledge-article/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
