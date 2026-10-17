# RestaurantMenuOverview

Synthèse : menus de restaurant.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {RestaurantMenuOverview} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {RestaurantMenuOverview} from '@mdevs/ui/restaurant-menu/restaurant-menu-overview';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/restaurant-menu`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface RestaurantMenuOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RestaurantMenu[];
    metrics: readonly RestaurantMenuMetric[];
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly RestaurantMenu[]` | — | Collection en lecture ; aperçu des cinq premiers éléments. |
| `metrics` | **Oui** | `readonly RestaurantMenuMetric[]` | — | Indicateurs déjà calculés par l’application ; le composant ne les agrège pas. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Types et données du domaine

Le modèle `RestaurantMenu` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `restaurant` | Restaurant | `string` | Oui | Chaîne applicative |
| `dishCount` | Plats | `number` | Oui | Nombre fini validé par le parent |
| `averagePrice` | Prix moyen | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `RestaurantMenuStatus` | Oui | `draft`, `active`, `seasonal` |


```ts
export type RestaurantMenu = {
    id?: string;
    name: string;
    restaurant: string;
    dishCount: number;
    averagePrice: number;
    status: "draft" | "active" | "seasonal";
};

export type RestaurantMenuStatus = RestaurantMenu['status'];

export interface RestaurantMenuActivity extends DomainActivity {
    restaurantmenuId?: string;
}

export type RestaurantMenuMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalRestaurantMenu' | 'activeRestaurantMenu' | 'valueRestaurantMenu';
};

export type RestaurantMenuSettingsValues = Partial<Record<"notifyRestaurantMenu" | "archiveRestaurantMenu" | "approveRestaurantMenu", boolean>>;
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
import {RestaurantMenuOverview, type RestaurantMenu, type RestaurantMenuMetric} from '@mdevs/ui/restaurant-menu';
import '@mdevs/ui/styles.css';

const items: RestaurantMenu[] = [{
  "id": "restaurant-menu-demo-1",
  "name": "Carte d’automne",
  "restaurant": "Restaurant démo",
  "dishCount": 128,
  "averagePrice": 128,
  "status": "draft"
}];
const metrics: RestaurantMenuMetric[] = [
  {
    "id": "totalRestaurantMenu",
    "label": "Total",
    "value": 24
  },
  {
    "id": "activeRestaurantMenu",
    "label": "Actifs",
    "value": 18,
    "change": "+4 ce mois",
    "tone": "success"
  },
  {
    "id": "valueRestaurantMenu",
    "label": "À traiter",
    "value": 6
  }
];

export function Example() {
  return <RestaurantMenuOverview items={items} metrics={metrics}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "restaurant-menu-demo-1",
      "name": "Carte d’automne",
      "restaurant": "Restaurant démo",
      "dishCount": 128,
      "averagePrice": 128,
      "status": "draft"
    }
  ],
  "metrics": [
    {
      "id": "totalRestaurantMenu",
      "label": "Total",
      "value": 24
    },
    {
      "id": "activeRestaurantMenu",
      "label": "Actifs",
      "value": 18,
      "change": "+4 ce mois",
      "tone": "success"
    },
    {
      "id": "valueRestaurantMenu",
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

- [Source TypeScript du composant](../../../src/components/restaurant-menu/restaurant-menu-overview.tsx) — dans le monorepo : `packages/ui/src/components/restaurant-menu/restaurant-menu-overview.tsx` ; dans le package installé : `src/components/restaurant-menu/restaurant-menu-overview.tsx`.
- Déclarations après build : `dist/components/restaurant-menu/restaurant-menu-overview.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../restaurant-menu/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/restaurant-menu/types.ts), [configuration](../../../src/components/restaurant-menu/config.ts) et [schéma JSON](../../restaurant-menu/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
