# Sauvegardes — domaine Backup

Gérez vos sauvegardes depuis une interface claire.

Ce domaine fournit dix composants importables indépendamment, avec un modèle `Backup` propre et dix rendus partagés. Les données, règles métier et opérations de service sont fournies par le projet hôte.

## Import public


```tsx
import {BackupForm, BackupTable, BackupFilters, type Backup, type BackupStatus} from '@mdevs/ui/backup';
import '@mdevs/ui/styles.css';
```

Pour un import individuel, utiliser le sous-chemin exact du tableau ci-dessous. Les types de domaine sont exportés par le module de catégorie, ainsi que par @mdevs/ui.


| Composant | Famille | Import ciblé | Fiche détaillée | Source |
| --- | --- | --- | --- | --- |
| `BackupOverview` | Overview | `@mdevs/ui/backup/backup-overview` | [API et exemple](../components/backup/backup-overview.md) | [TypeScript](../../src/components/backup/backup-overview.tsx) |
| `BackupCard` | Card | `@mdevs/ui/backup/backup-card` | [API et exemple](../components/backup/backup-card.md) | [TypeScript](../../src/components/backup/backup-card.tsx) |
| `BackupList` | List | `@mdevs/ui/backup/backup-list` | [API et exemple](../components/backup/backup-list.md) | [TypeScript](../../src/components/backup/backup-list.tsx) |
| `BackupTable` | Table | `@mdevs/ui/backup/backup-table` | [API et exemple](../components/backup/backup-table.md) | [TypeScript](../../src/components/backup/backup-table.tsx) |
| `BackupForm` | Form | `@mdevs/ui/backup/backup-form` | [API et exemple](../components/backup/backup-form.md) | [TypeScript](../../src/components/backup/backup-form.tsx) |
| `BackupFilters` | Filters | `@mdevs/ui/backup/backup-filters` | [API et exemple](../components/backup/backup-filters.md) | [TypeScript](../../src/components/backup/backup-filters.tsx) |
| `BackupTimeline` | Timeline | `@mdevs/ui/backup/backup-timeline` | [API et exemple](../components/backup/backup-timeline.md) | [TypeScript](../../src/components/backup/backup-timeline.tsx) |
| `BackupStats` | Stats | `@mdevs/ui/backup/backup-stats` | [API et exemple](../components/backup/backup-stats.md) | [TypeScript](../../src/components/backup/backup-stats.tsx) |
| `BackupEmptyState` | EmptyState | `@mdevs/ui/backup/backup-empty-state` | [API et exemple](../components/backup/backup-empty-state.md) | [TypeScript](../../src/components/backup/backup-empty-state.tsx) |
| `BackupSettings` | Settings | `@mdevs/ui/backup/backup-settings` | [API et exemple](../components/backup/backup-settings.md) | [TypeScript](../../src/components/backup/backup-settings.tsx) |

## Modèle et valeurs admises

Le modèle `Backup` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `resource` | Ressource | `string` | Oui | Chaîne applicative |
| `sizeGb` | Taille (Go) | `number` | Oui | Nombre fini validé par le parent |
| `createdOn` | Création | `string` | Oui | Chaîne YYYY-MM-DD |
| `status` | Statut | `BackupStatus` | Oui | `scheduled`, `running`, `complete`, `failed` |


```ts
export type Backup = {
    id?: string;
    name: string;
    resource: string;
    sizeGb: number;
    createdOn: string;
    status: "scheduled" | "running" | "complete" | "failed";
};

export type BackupStatus = Backup['status'];

export interface BackupActivity extends DomainActivity {
    backupId?: string;
}

export type BackupMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalBackup' | 'activeBackup' | 'valueBackup';
};

export type BackupSettingsValues = Partial<Record<"notifyBackup" | "archiveBackup" | "approveBackup", boolean>>;
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

Les trois interrupteurs appartiennent au contrat `BackupSettingsValues`. L’application actualise values et peut persister ces préférences dans son propre service.


| Clé exacte | Libellé | Aide |
| --- | --- | --- |
| `notifyBackup` | Notifications : sauvegardes | Recevoir un signal lors des changements. |
| `archiveBackup` | Archivage automatique | Archiver les éléments terminés de la section sauvegardes. |
| `approveBackup` | Validation requise | Demander une validation avant publication ou activation. |

## Flux d’intégration recommandé

1. Charger ou construire des enregistrements `Backup` dans le parent et conserver des id stables.
2. Rendre Form pour une saisie : fournir onSubmit, gérer pending dans le parent et afficher ses erreurs métier. Le formulaire est natif et non contrôlé ; initialValues est une initialisation au montage.
3. Rendre Filters avec query/status contrôlés ; appliquer les critères aux items dans le parent.
4. Passer la collection filtrée à Table ou List. Table trie localement ; List transmet un élément à onSelect seulement si ce callback est fourni.
5. Rendre Stats ou Overview avec des métriques déjà calculées ; Timeline avec des événements déjà ordonnés.
6. Actualiser les préférences dans Settings via onChange(key, value). Fournir EmptyState avec actionLabel et onAction si une création doit être proposée.

### Recherche contrôlée et résultats


```tsx
'use client';
import {useState} from 'react';
import {BackupFilters, type BackupStatus, BackupTable, type Backup} from '@mdevs/ui/backup';
import '@mdevs/ui/styles.css';

const items: Backup[] = [{
  "id": "backup-demo-1",
  "name": "Sauvegarde quotidienne",
  "resource": "Ressource démo",
  "sizeGb": 128,
  "createdOn": "2026-10-04",
  "status": "scheduled"
}];

export function Example() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<BackupStatus | ''>('');
  const visible = items.filter(item =>
    (!status || item.status === status) &&
    String(item.name).toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  return <><BackupFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus}/><BackupTable items={visible}/></>;
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
  "id": "backup-demo-1",
  "name": "Sauvegarde quotidienne",
  "resource": "Ressource démo",
  "sizeGb": 128,
  "createdOn": "2026-10-04",
  "status": "scheduled"
}
```

## Vérifications spécifiques

- Les statuts entrants respectent l’union `BackupStatus`, sans traduction implicite des valeurs.
- Les champs number ne deviennent pas des chaînes JSON lors de la construction des données React.
- Changer d’enregistrement d’édition remonte le formulaire via une key différente si nécessaire.
- Les callbacks de filtres et réglages changent l’état du parent ; les composants ne font pas la recherche ni la sauvegarde.
- La sélection de List, le tri de Table et la soumission de Form restent testables au clavier.

## Sources et guides

- [Schéma machine et fixture](schema.json).
- [Contrats TypeScript](../../src/components/backup/types.ts) et [configuration des champs](../../src/components/backup/config.ts).
- [Rendus métier partagés](../../src/internal/domain.tsx) (internes).
- [Instructions agents](../../AGENTS.md), [guide agents complet](../docs/AI_AGENTS.md) et [API générale](../docs/API.md).

Dans le monorepo, préfixer les chemins de source du package par packages/ui/. Dans une installation, les mêmes fichiers se trouvent sous node_modules/@mdevs/ui/.
