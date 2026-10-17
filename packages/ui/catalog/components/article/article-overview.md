# ArticleOverview

Synthèse : articles.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {ArticleOverview} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {ArticleOverview} from '@mdevs/ui/article/article-overview';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/article`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface ArticleOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Article[];
    metrics: readonly ArticleMetric[];
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly Article[]` | — | Collection en lecture ; aperçu des cinq premiers éléments. |
| `metrics` | **Oui** | `readonly ArticleMetric[]` | — | Indicateurs déjà calculés par l’application ; le composant ne les agrège pas. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Types et données du domaine

Le modèle `Article` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `title` | Titre | `string` | Oui | Chaîne applicative |
| `author` | Auteur | `string` | Oui | Chaîne applicative |
| `publishedOn` | Publication | `string` | Oui | Chaîne YYYY-MM-DD |
| `wordCount` | Mots | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `ArticleStatus` | Oui | `draft`, `review`, `published`, `archived` |


```ts
export type Article = {
    id?: string;
    title: string;
    author: string;
    publishedOn: string;
    wordCount: number;
    status: "draft" | "review" | "published" | "archived";
};

export type ArticleStatus = Article['status'];

export interface ArticleActivity extends DomainActivity {
    articleId?: string;
}

export type ArticleMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalArticle' | 'activeArticle' | 'valueArticle';
};

export type ArticleSettingsValues = Partial<Record<"notifyArticle" | "archiveArticle" | "approveArticle", boolean>>;
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
import {ArticleOverview, type Article, type ArticleMetric} from '@mdevs/ui/article';
import '@mdevs/ui/styles.css';

const items: Article[] = [{
  "id": "article-demo-1",
  "title": "Créer une interface lisible",
  "author": "Auteur démo",
  "publishedOn": "2026-10-04",
  "wordCount": 128,
  "status": "draft"
}];
const metrics: ArticleMetric[] = [
  {
    "id": "totalArticle",
    "label": "Total",
    "value": 24
  },
  {
    "id": "activeArticle",
    "label": "Actifs",
    "value": 18,
    "change": "+4 ce mois",
    "tone": "success"
  },
  {
    "id": "valueArticle",
    "label": "À traiter",
    "value": 6
  }
];

export function Example() {
  return <ArticleOverview items={items} metrics={metrics}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "article-demo-1",
      "title": "Créer une interface lisible",
      "author": "Auteur démo",
      "publishedOn": "2026-10-04",
      "wordCount": 128,
      "status": "draft"
    }
  ],
  "metrics": [
    {
      "id": "totalArticle",
      "label": "Total",
      "value": 24
    },
    {
      "id": "activeArticle",
      "label": "Actifs",
      "value": 18,
      "change": "+4 ce mois",
      "tone": "success"
    },
    {
      "id": "valueArticle",
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

- [Source TypeScript du composant](../../../src/components/article/article-overview.tsx) — dans le monorepo : `packages/ui/src/components/article/article-overview.tsx` ; dans le package installé : `src/components/article/article-overview.tsx`.
- Déclarations après build : `dist/components/article/article-overview.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../article/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/article/types.ts), [configuration](../../../src/components/article/config.ts) et [schéma JSON](../../article/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
