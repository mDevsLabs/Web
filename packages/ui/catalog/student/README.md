# Apprenants — domaine Student

Gérez vos apprenants depuis une interface claire.

Ce domaine fournit dix composants importables indépendamment, avec un modèle `Student` propre et dix rendus partagés. Les données, règles métier et opérations de service sont fournies par le projet hôte.

## Import public


```tsx
import {StudentForm, StudentTable, StudentFilters, type Student, type StudentStatus} from '@mdevs/ui/student';
import '@mdevs/ui/styles.css';
```

Pour un import individuel, utiliser le sous-chemin exact du tableau ci-dessous. Les types de domaine sont exportés par le module de catégorie, ainsi que par @mdevs/ui.


| Composant | Famille | Import ciblé | Fiche détaillée | Source |
| --- | --- | --- | --- | --- |
| `StudentOverview` | Overview | `@mdevs/ui/student/student-overview` | [API et exemple](../components/student/student-overview.md) | [TypeScript](../../src/components/student/student-overview.tsx) |
| `StudentCard` | Card | `@mdevs/ui/student/student-card` | [API et exemple](../components/student/student-card.md) | [TypeScript](../../src/components/student/student-card.tsx) |
| `StudentList` | List | `@mdevs/ui/student/student-list` | [API et exemple](../components/student/student-list.md) | [TypeScript](../../src/components/student/student-list.tsx) |
| `StudentTable` | Table | `@mdevs/ui/student/student-table` | [API et exemple](../components/student/student-table.md) | [TypeScript](../../src/components/student/student-table.tsx) |
| `StudentForm` | Form | `@mdevs/ui/student/student-form` | [API et exemple](../components/student/student-form.md) | [TypeScript](../../src/components/student/student-form.tsx) |
| `StudentFilters` | Filters | `@mdevs/ui/student/student-filters` | [API et exemple](../components/student/student-filters.md) | [TypeScript](../../src/components/student/student-filters.tsx) |
| `StudentTimeline` | Timeline | `@mdevs/ui/student/student-timeline` | [API et exemple](../components/student/student-timeline.md) | [TypeScript](../../src/components/student/student-timeline.tsx) |
| `StudentStats` | Stats | `@mdevs/ui/student/student-stats` | [API et exemple](../components/student/student-stats.md) | [TypeScript](../../src/components/student/student-stats.tsx) |
| `StudentEmptyState` | EmptyState | `@mdevs/ui/student/student-empty-state` | [API et exemple](../components/student/student-empty-state.md) | [TypeScript](../../src/components/student/student-empty-state.tsx) |
| `StudentSettings` | Settings | `@mdevs/ui/student/student-settings` | [API et exemple](../components/student/student-settings.md) | [TypeScript](../../src/components/student/student-settings.tsx) |

## Modèle et valeurs admises

Le modèle `Student` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `email` | E-mail | `string` | Oui | Chaîne applicative |
| `courseCount` | Formations | `number` | Oui | Nombre fini validé par le parent |
| `joinedOn` | Inscription | `string` | Oui | Chaîne YYYY-MM-DD |
| `status` | Statut | `StudentStatus` | Oui | `active`, `graduated`, `inactive` |


```ts
export type Student = {
    id?: string;
    name: string;
    email: string;
    courseCount: number;
    joinedOn: string;
    status: "active" | "graduated" | "inactive";
};

export type StudentStatus = Student['status'];

export interface StudentActivity extends DomainActivity {
    studentId?: string;
}

export type StudentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalStudent' | 'activeStudent' | 'valueStudent';
};

export type StudentSettingsValues = Partial<Record<"notifyStudent" | "archiveStudent" | "approveStudent", boolean>>;
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

Les trois interrupteurs appartiennent au contrat `StudentSettingsValues`. L’application actualise values et peut persister ces préférences dans son propre service.


| Clé exacte | Libellé | Aide |
| --- | --- | --- |
| `notifyStudent` | Notifications : apprenants | Recevoir un signal lors des changements. |
| `archiveStudent` | Archivage automatique | Archiver les éléments terminés de la section apprenants. |
| `approveStudent` | Validation requise | Demander une validation avant publication ou activation. |

## Flux d’intégration recommandé

1. Charger ou construire des enregistrements `Student` dans le parent et conserver des id stables.
2. Rendre Form pour une saisie : fournir onSubmit, gérer pending dans le parent et afficher ses erreurs métier. Le formulaire est natif et non contrôlé ; initialValues est une initialisation au montage.
3. Rendre Filters avec query/status contrôlés ; appliquer les critères aux items dans le parent.
4. Passer la collection filtrée à Table ou List. Table trie localement ; List transmet un élément à onSelect seulement si ce callback est fourni.
5. Rendre Stats ou Overview avec des métriques déjà calculées ; Timeline avec des événements déjà ordonnés.
6. Actualiser les préférences dans Settings via onChange(key, value). Fournir EmptyState avec actionLabel et onAction si une création doit être proposée.

### Recherche contrôlée et résultats


```tsx
'use client';
import {useState} from 'react';
import {StudentFilters, type StudentStatus, StudentTable, type Student} from '@mdevs/ui/student';
import '@mdevs/ui/styles.css';

const items: Student[] = [{
  "id": "student-demo-1",
  "name": "Sara Michel",
  "email": "bonjour@example.com",
  "courseCount": 128,
  "joinedOn": "2026-10-04",
  "status": "active"
}];

export function Example() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StudentStatus | ''>('');
  const visible = items.filter(item =>
    (!status || item.status === status) &&
    String(item.name).toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  return <><StudentFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus}/><StudentTable items={visible}/></>;
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
  "id": "student-demo-1",
  "name": "Sara Michel",
  "email": "bonjour@example.com",
  "courseCount": 128,
  "joinedOn": "2026-10-04",
  "status": "active"
}
```

## Vérifications spécifiques

- Les statuts entrants respectent l’union `StudentStatus`, sans traduction implicite des valeurs.
- Les champs number ne deviennent pas des chaînes JSON lors de la construction des données React.
- Changer d’enregistrement d’édition remonte le formulaire via une key différente si nécessaire.
- Les callbacks de filtres et réglages changent l’état du parent ; les composants ne font pas la recherche ni la sauvegarde.
- La sélection de List, le tri de Table et la soumission de Form restent testables au clavier.

## Sources et guides

- [Schéma machine et fixture](schema.json).
- [Contrats TypeScript](../../src/components/student/types.ts) et [configuration des champs](../../src/components/student/config.ts).
- [Rendus métier partagés](../../src/internal/domain.tsx) (internes).
- [Instructions agents](../../AGENTS.md), [guide agents complet](../docs/AI_AGENTS.md) et [API générale](../docs/API.md).

Dans le monorepo, préfixer les chemins de source du package par packages/ui/. Dans une installation, les mêmes fichiers se trouvent sous node_modules/@mdevs/ui/.
