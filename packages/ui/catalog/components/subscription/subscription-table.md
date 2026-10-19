# SubscriptionTable

Tableau triable : abonnements.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {SubscriptionTable} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {SubscriptionTable} from '@mdevs/ui/subscription/subscription-table';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/subscription`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface SubscriptionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Subscription[];
    emptyMessage?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly Subscription[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `emptyMessage` | Non | `string` | `'Aucun élément.'` | Message affiché quand la collection est vide. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Types et données du domaine

Le modèle `Subscription` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Offre | `string` | Oui | Chaîne applicative |
| `subscriber` | Abonné | `string` | Oui | Chaîne applicative |
| `monthlyPrice` | Prix mensuel | `number` | Oui | Nombre fini validé par le parent |
| `renewsOn` | Renouvellement | `string` | Oui | Chaîne YYYY-MM-DD |
| `status` | Statut | `SubscriptionStatus` | Oui | `trial`, `active`, `paused`, `cancelled` |


```ts
export type Subscription = {
    id?: string;
    name: string;
    subscriber: string;
    monthlyPrice: number;
    renewsOn: string;
    status: "trial" | "active" | "paused" | "cancelled";
};

export type SubscriptionStatus = Subscription['status'];

export interface SubscriptionActivity extends DomainActivity {
    subscriptionId?: string;
}

export type SubscriptionMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalSubscription' | 'activeSubscription' | 'valueSubscription';
};

export type SubscriptionSettingsValues = Partial<Record<"notifySubscription" | "archiveSubscription" | "approveSubscription", boolean>>;
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

Rend toutes les colonnes du schéma et tous les éléments. Les boutons d’en-tête basculent un tri local ascendant/descendant ; les nombres sont comparés numériquement et les autres valeurs avec localeCompare({numeric:true}). Le tri copie la collection et ne modifie pas items. Il ne déclenche aucun tri serveur, callback, pagination ou chargement. La région est focalisable et défile horizontalement ; aria-sort décrit la colonne active.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {SubscriptionTable, type Subscription} from '@mdevs/ui/subscription';
import '@mdevs/ui/styles.css';

const items: Subscription[] = [{
  "id": "subscription-demo-1",
  "name": "Pro annuel",
  "subscriber": "Abonné démo",
  "monthlyPrice": 128,
  "renewsOn": "2026-10-04",
  "status": "trial"
}];

export function Example() {
  return <SubscriptionTable items={items} emptyMessage="Aucun résultat."/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "subscription-demo-1",
      "name": "Pro annuel",
      "subscriber": "Abonné démo",
      "monthlyPrice": 128,
      "renewsOn": "2026-10-04",
      "status": "trial"
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

- [Source TypeScript du composant](../../../src/components/subscription/subscription-table.tsx) — dans le monorepo : `packages/ui/src/components/subscription/subscription-table.tsx` ; dans le package installé : `src/components/subscription/subscription-table.tsx`.
- Déclarations après build : `dist/components/subscription/subscription-table.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../subscription/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/subscription/types.ts), [configuration](../../../src/components/subscription/config.ts) et [schéma JSON](../../subscription/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
