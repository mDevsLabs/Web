# WarehouseCard

Fiche : entrepôts.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {WarehouseCard} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {WarehouseCard} from '@mdevs/ui/warehouse/warehouse-card';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/warehouse`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface WarehouseCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Warehouse;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `item` | **Oui** | `Warehouse` | — | Enregistrement affiché ; les champs sont définis par le schéma du domaine. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Types et données du domaine

Le modèle `Warehouse` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `city` | Ville | `string` | Oui | Chaîne applicative |
| `capacity` | Capacité | `number` | Oui | Nombre fini validé par le parent |
| `occupancy` | Occupation | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `WarehouseStatus` | Oui | `active`, `maintenance`, `closed` |


```ts
export type Warehouse = {
    id?: string;
    name: string;
    city: string;
    capacity: number;
    occupancy: number;
    status: "active" | "maintenance" | "closed";
};

export type WarehouseStatus = Warehouse['status'];

export interface WarehouseActivity extends DomainActivity {
    warehouseId?: string;
}

export type WarehouseMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalWarehouse' | 'activeWarehouse' | 'valueWarehouse';
};

export type WarehouseSettingsValues = Partial<Record<"notifyWarehouse" | "archiveWarehouse" | "approveWarehouse", boolean>>;
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

Affiche une fiche dans une section de domaine : le titre provient du champ titleKey sauf si title est fourni. Les autres champs apparaissent dans une liste de descriptions ; le statut reçoit un badge. Les valeurs vides deviennent « — ». Aucun bouton ou callback de sélection n’est ajouté.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {WarehouseCard, type Warehouse} from '@mdevs/ui/warehouse';
import '@mdevs/ui/styles.css';

const item: Warehouse = {
  "id": "warehouse-demo-1",
  "name": "Entrepôt Lyon",
  "city": "Ville démo",
  "capacity": 128,
  "occupancy": 128,
  "status": "active"
};

export function Example() {
  return <WarehouseCard item={item}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "item": {
    "id": "warehouse-demo-1",
    "name": "Entrepôt Lyon",
    "city": "Ville démo",
    "capacity": 128,
    "occupancy": 128,
    "status": "active"
  }
}
```

## Vérifier l’intégration

- Vérifier le typecheck du projet hôte et les imports publics exacts.
- Tester les données vides, les champs requis et les callbacks réellement utilisés.
- Vérifier noms accessibles, clavier, focus visible et contraste clair/sombre.
- Tester une largeur de 320–375 px ; les collections volumineuses demandent une stratégie applicative.
- Ne pas déduire d’API réseau, de persistance ou de validation métier du rendu UI.

## Retrouver le code

- [Source TypeScript du composant](../../../src/components/warehouse/warehouse-card.tsx) — dans le monorepo : `packages/ui/src/components/warehouse/warehouse-card.tsx` ; dans le package installé : `src/components/warehouse/warehouse-card.tsx`.
- Déclarations après build : `dist/components/warehouse/warehouse-card.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../warehouse/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/warehouse/types.ts), [configuration](../../../src/components/warehouse/config.ts) et [schéma JSON](../../warehouse/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
