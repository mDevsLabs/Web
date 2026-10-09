# MediaAssetFilters

Filtres : médias.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {MediaAssetFilters} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {MediaAssetFilters} from '@mdevs/ui/media-asset/media-asset-filters';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/media-asset`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface MediaAssetFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: MediaAssetStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: MediaAssetStatus | '') => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `query` | **Oui** | `string` | — | Valeur contrôlée ; mettre à jour l’état parent dans onQueryChange. |
| `status` | Non | `MediaAssetStatus \| ''` | — | Valeur du contrat ; une chaîne vide signifie tous les statuts pour les filtres. |
| `onQueryChange` | **Oui** | `(query: string) => void` | — | Reçoit la recherche sans filtrer les données à lui seul. |
| `onStatusChange` | Non | `(status: MediaAssetStatus \| '') => void` | — | Reçoit le statut ou une chaîne vide ; son absence désactive le select des filtres. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onQueryChange` | **Obligatoire** | `(query: string) => void` |
| `onStatusChange` | Optionnel | `(status: MediaAssetStatus \| '') => void` |

## Types et données du domaine

Le modèle `MediaAsset` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `mediaType` | Type | `string` | Oui | Chaîne applicative |
| `sizeMb` | Taille (Mo) | `number` | Oui | Nombre fini validé par le parent |
| `uploadedOn` | Ajout | `string` | Oui | Chaîne YYYY-MM-DD |
| `status` | Statut | `MediaAssetStatus` | Oui | `processing`, `ready`, `failed` |


```ts
export type MediaAsset = {
    id?: string;
    name: string;
    mediaType: string;
    sizeMb: number;
    uploadedOn: string;
    status: "processing" | "ready" | "failed";
};

export type MediaAssetStatus = MediaAsset['status'];

export interface MediaAssetActivity extends DomainActivity {
    mediaassetId?: string;
}

export type MediaAssetMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalMediaAsset' | 'activeMediaAsset' | 'valueMediaAsset';
};

export type MediaAssetSettingsValues = Partial<Record<"notifyMediaAsset" | "archiveMediaAsset" | "approveMediaAsset", boolean>>;
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

query et status sont contrôlés. Le champ de recherche appelle onQueryChange à chaque saisie ; le select appelle onStatusChange avec un statut ou "". Sans onStatusChange, le select est désactivé. Réinitialiser appelle onQueryChange("") puis, s’il existe, onStatusChange(""). Le composant ne filtre aucune collection et n’applique ni temporisation ni requête réseau : le parent applique les critères et fournit les résultats aux vues.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {MediaAssetFilters, type MediaAssetStatus, MediaAssetTable, type MediaAsset} from '@mdevs/ui/media-asset';
import '@mdevs/ui/styles.css';

const items: MediaAsset[] = [{
  "id": "media-asset-demo-1",
  "name": "hero-horizon.webp",
  "mediaType": "Type démo",
  "sizeMb": 128,
  "uploadedOn": "2026-10-04",
  "status": "processing"
}];

export function Example() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<MediaAssetStatus | ''>('');
  const visible = items.filter(item =>
    (!status || item.status === status) &&
    String(item.name).toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  return <><MediaAssetFilters query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus}/><MediaAssetTable items={visible}/></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "query": ""
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/components/media-asset/media-asset-filters.tsx) — dans le monorepo : `packages/ui/src/components/media-asset/media-asset-filters.tsx` ; dans le package installé : `src/components/media-asset/media-asset-filters.tsx`.
- Déclarations après build : `dist/components/media-asset/media-asset-filters.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../media-asset/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/media-asset/types.ts), [configuration](../../../src/components/media-asset/config.ts) et [schéma JSON](../../media-asset/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
