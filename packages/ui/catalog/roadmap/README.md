# Feuilles de route — domaine Roadmap

Gérez vos feuilles de route depuis une interface claire.

Ce domaine fournit dix composants importables indépendamment, avec un modèle `Roadmap` propre et dix rendus partagés. Les données, règles métier et opérations de service sont fournies par le projet hôte.

## Import public


```tsx
import {RoadmapForm, RoadmapTable, RoadmapFilters, type Roadmap, type RoadmapStatus} from '@mdevs/ui/roadmap';
import '@mdevs/ui/styles.css';
```

Pour un import individuel, utiliser le sous-chemin exact du tableau ci-dessous. Les types de domaine sont exportés par le module de catégorie, ainsi que par @mdevs/ui.


| Composant | Famille | Import ciblé | Fiche détaillée | Source |
| --- | --- | --- | --- | --- |
| `RoadmapOverview` | Overview | `@mdevs/ui/roadmap/roadmap-overview` | [API et exemple](../components/roadmap/roadmap-overview.md) | [TypeScript](../../src/components/roadmap/roadmap-overview.tsx) |
| `RoadmapCard` | Card | `@mdevs/ui/roadmap/roadmap-card` | [API et exemple](../components/roadmap/roadmap-card.md) | [TypeScript](../../src/components/roadmap/roadmap-card.tsx) |
| `RoadmapList` | List | `@mdevs/ui/roadmap/roadmap-list` | [API et exemple](../components/roadmap/roadmap-list.md) | [TypeScript](../../src/components/roadmap/roadmap-list.tsx) |
| `RoadmapTable` | Table | `@mdevs/ui/roadmap/roadmap-table` | [API et exemple](../components/roadmap/roadmap-table.md) | [TypeScript](../../src/components/roadmap/roadmap-table.tsx) |
| `RoadmapForm` | Form | `@mdevs/ui/roadmap/roadmap-form` | [API et exemple](../components/roadmap/roadmap-form.md) | [TypeScript](../../src/components/roadmap/roadmap-form.tsx) |
| `RoadmapFilters` | Filters | `@mdevs/ui/roadmap/roadmap-filters` | [API et exemple](../components/roadmap/roadmap-filters.md) | [TypeScript](../../src/components/roadmap/roadmap-filters.tsx) |
| `RoadmapTimeline` | Timeline | `@mdevs/ui/roadmap/roadmap-timeline` | [API et exemple](../components/roadmap/roadmap-timeline.md) | [TypeScript](../../src/components/roadmap/roadmap-timeline.tsx) |
| `RoadmapStats` | Stats | `@mdevs/ui/roadmap/roadmap-stats` | [API et exemple](../components/roadmap/roadmap-stats.md) | [TypeScript](../../src/components/roadmap/roadmap-stats.tsx) |
| `RoadmapEmptyState` | EmptyState | `@mdevs/ui/roadmap/roadmap-empty-state` | [API et exemple](../components/roadmap/roadmap-empty-state.md) | [TypeScript](../../src/components/roadmap/roadmap-empty-state.tsx) |
| `RoadmapSettings` | Settings | `@mdevs/ui/roadmap/roadmap-settings` | [API et exemple](../components/roadmap/roadmap-settings.md) | [TypeScript](../../src/components/roadmap/roadmap-settings.tsx) |

## Modèle et valeurs admises

Le modèle `Roadmap` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `owner` | Responsable | `string` | Oui | Chaîne applicative |
| `quarter` | Trimestre | `string` | Oui | Chaîne applicative |
| `initiativeCount` | Initiatives | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `RoadmapStatus` | Oui | `draft`, `published`, `archived` |


```ts
export type Roadmap = {
    id?: string;
    name: string;
    owner: string;
    quarter: string;
    initiativeCount: number;
    status: "draft" | "published" | "archived";
};

export type RoadmapStatus = Roadmap['status'];

export interface RoadmapActivity extends DomainActivity {
    roadmapId?: string;
}

export type RoadmapMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalRoadmap' | 'activeRoadmap' | 'valueRoadmap';
};

export type RoadmapSettingsValues = Partial<Record<"notifyRoadmap" | "archiveRoadmap" | "approveRoadmap", boolean>>;
```

Les structures Activity et Metric reprennent les bases suivantes ; elles servent de référence, pas de chemin d’import public :


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

## Paramètres configurables

Les trois interrupteurs appartiennent au contrat `RoadmapSettingsValues`. L’application actualise values et peut persister ces préférences dans son propre service.


| Clé exacte | Libellé | Aide |
| --- | --- | --- |
| `notifyRoadmap` | Notifications : feuilles de route | Recevoir un signal lors des changements. |
| `archiveRoadmap` | Archivage automatique | Archiver les éléments terminés de la section feuilles de route. |
| `approveRoadmap` | Validation requise | Demander une validation avant publication ou activation. |

## Flux d’intégration recommandé

1. Charger ou construire des enregistrements `Roadmap` dans le parent et conserver des id stables.
2. Rendre Form pour une saisie : fournir onSubmit, gérer pending dans le parent et afficher ses erreurs métier. Le formulaire est natif et non contrôlé ; initialValues est une initialisation au montage.
3. Rendre Filters avec query/status contrôlés ; appliquer les critères aux items dans le parent.
4. Passer la collection filtrée à Table ou List. Table trie localement ; List transmet un élément à onSelect seulement si ce callback est fourni.
5. Rendre Stats ou Overview avec des métriques déjà calculées ; Timeline avec des événements déjà ordonnés.
6. Actualiser les préférences dans Settings via onChange(key, value). Fournir EmptyState avec actionLabel et onAction si une création doit être proposée.

### Recherche contrôlée et résultats


```tsx
'use client';
import {useState} from 'react';
import {RoadmapFilters, type RoadmapStatus, RoadmapTable, type Roadmap} from '@mdevs/ui/roadmap';
import '@mdevs/ui/styles.css';

const items: Roadmap[] = [{
  "id": "roadmap-demo-1",
  "name": "Produit 2027",
  "owner": "Marie Dupont",
  "quarter": "Trimestre démo",
  "initiativeCount": 128,
  "status": "draft"
}];

export function Example() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<RoadmapStatus | ''>('');
  const visible = items.filter(item =>
    (!status || item.status === status) &&
    String(item.name).toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  return <><RoadmapFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus}/><RoadmapTable items={visible}/></>;
}
```

## Comportement par famille

### Overview

Affiche les indicateurs fournis, puis les cinq premiers éléments dans leur ordre reçu. Pour chaque élément, montre le champ titre et au plus deux autres champs. Le tableau complet et les calculs des indicateurs appartiennent au parent. Les propriétés change et tone des métriques ne sont pas affichées dans cette famille.

### Card

Affiche une fiche dans une section de domaine : le titre provient du champ titleKey sauf si title est fourni. Les autres champs apparaissent dans une liste de descriptions ; le statut reçoit un badge. Les valeurs vides deviennent « — ». Aucun bouton ou callback de sélection n’est ajouté.

### List

Affiche toute la collection dans son ordre reçu. Quand onSelect est fourni, chaque ligne devient un bouton type="button" et appelle ce callback avec l’enregistrement complet. Sans onSelect, les lignes restent du contenu de lecture. Une collection vide affiche emptyMessage ; aucune pagination ou virtualisation n’est appliquée.

### Table

Rend toutes les colonnes du schéma et tous les éléments. Les boutons d’en-tête basculent un tri local ascendant/descendant ; les nombres sont comparés numériquement et les autres valeurs avec localeCompare({numeric:true}). Le tri copie la collection et ne modifie pas items. Il ne déclenche aucun tri serveur, callback, pagination ou chargement. La région est focalisable et défile horizontalement ; aria-sort décrit la colonne active.

### Form

Utilise un formulaire HTML et des champs natifs non contrôlés. initialValues fournit les defaultValue lors du montage ; une mise à jour ultérieure de cette prop ne réinitialise pas automatiquement les valeurs saisies. Pour éditer un autre enregistrement, remonter le formulaire avec une key stable différente. La validation required/email/url/date/number est celle du navigateur. Après validation native, le submit appelle preventDefault(), lit FormData, trim() les chaînes et convertit les nombres avec Number(). Le callback onSubmit reçoit les champs du schéma, sans id. Son contrat retourne void : le composant n’attend pas une Promise, ne positionne pas pending et ne traite pas les erreurs métier. Le parent gère pending, persistance, erreurs et éventuelle réinitialisation ; pending désactive le fieldset et le bouton.

### Filters

query et status sont contrôlés. Le champ de recherche appelle onQueryChange à chaque saisie ; le select appelle onStatusChange avec un statut ou "". Sans onStatusChange, le select est désactivé. Réinitialiser appelle onQueryChange("") puis, s’il existe, onStatusChange(""). Le composant ne filtre aucune collection et n’applique ni temporisation ni requête réseau : le parent applique les critères et fournit les résultats aux vues.

### Timeline

Affiche events dans leur ordre reçu dans une liste ordonnée, avec titre, description optionnelle et <time dateTime={date}>. date est affichée telle quelle. Aucun tri, formatage localisé, abonnement temps réel ou pagination n’est réalisé ; le parent prépare les valeurs et leur ordre.

### Stats

Affiche les métriques reçues dans une liste de descriptions. label, value et change sont présentés tels quels ; tone devient data-tone. Aucun calcul, format monétaire ou comparaison automatique n’est effectué. Les identifiants métriques doivent respecter l’union du domaine.

### EmptyState

Affiche un message et un marqueur décoratif. Le bouton d’action existe uniquement quand actionLabel et onAction sont tous les deux fournis ; il appelle onAction. Aucun enregistrement, routage ou formulaire n’est créé automatiquement.

### Settings

Affiche les réglages déclarés dans config.settings. Chaque case possède role="switch", un label et une aide reliée par aria-describedby. checked vaut Boolean(values[key]) ; une clé absente correspond à false. Le callback onChange(key, boolean) est obligatoire et doit mettre à jour les valeurs contrôlées dans le parent. Le composant ne stocke pas les préférences, ne les enregistre pas et ne fournit pas de bouton de confirmation.
## Données de démonstration

Ces valeurs sont fictives ; ne pas les utiliser comme informations de production ni comme contrat de service.


```json
{
  "id": "roadmap-demo-1",
  "name": "Produit 2027",
  "owner": "Marie Dupont",
  "quarter": "Trimestre démo",
  "initiativeCount": 128,
  "status": "draft"
}
```

## Vérifications spécifiques

- Les statuts entrants respectent l’union `RoadmapStatus`, sans traduction implicite des valeurs.
- Les champs number ne deviennent pas des chaînes JSON lors de la construction des données React.
- Changer d’enregistrement d’édition remonte le formulaire via une key différente si nécessaire.
- Les callbacks de filtres et réglages changent l’état du parent ; les composants ne font pas la recherche ni la sauvegarde.
- La sélection de List, le tri de Table et la soumission de Form restent testables au clavier.

## Sources et guides

- [Schéma machine et fixture](schema.json).
- [Contrats TypeScript](../../src/components/roadmap/types.ts) et [configuration des champs](../../src/components/roadmap/config.ts).
- [Rendus métier partagés](../../src/internal/domain.tsx) (internes).
- [Instructions agents](../../AGENTS.md), [guide agents complet](../docs/AI_AGENTS.md) et [API générale](../docs/API.md).

Dans le monorepo, préfixer les chemins de source du package par packages/ui/. Dans une installation, les mêmes fichiers se trouvent sous node_modules/@mdevs/ui/.
