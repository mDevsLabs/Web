# AccessTokenOverview

Synthèse : jetons d’accès.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {AccessTokenOverview} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {AccessTokenOverview} from '@mdevs/ui/access-token/access-token-overview';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/access-token`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface AccessTokenOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly AccessToken[];
    metrics: readonly AccessTokenMetric[];
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly AccessToken[]` | — | Collection en lecture ; aperçu des cinq premiers éléments. |
| `metrics` | **Oui** | `readonly AccessTokenMetric[]` | — | Indicateurs déjà calculés par l’application ; le composant ne les agrège pas. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Types et données du domaine

Le modèle `AccessToken` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `owner` | Propriétaire | `string` | Oui | Chaîne applicative |
| `scope` | Permissions | `string` | Oui | Chaîne applicative |
| `expiresOn` | Expiration | `string` | Oui | Chaîne YYYY-MM-DD |
| `status` | Statut | `AccessTokenStatus` | Oui | `active`, `expired`, `revoked` |


```ts
export type AccessToken = {
    id?: string;
    name: string;
    owner: string;
    scope: string;
    expiresOn: string;
    status: "active" | "expired" | "revoked";
};

export type AccessTokenStatus = AccessToken['status'];

export interface AccessTokenActivity extends DomainActivity {
    accesstokenId?: string;
}

export type AccessTokenMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalAccessToken' | 'activeAccessToken' | 'valueAccessToken';
};

export type AccessTokenSettingsValues = Partial<Record<"notifyAccessToken" | "archiveAccessToken" | "approveAccessToken", boolean>>;
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
import {AccessTokenOverview, type AccessToken, type AccessTokenMetric} from '@mdevs/ui/access-token';
import '@mdevs/ui/styles.css';

const items: AccessToken[] = [{
  "id": "access-token-demo-1",
  "name": "Automatisation CI",
  "owner": "Marie Dupont",
  "scope": "Permissions démo",
  "expiresOn": "2026-10-04",
  "status": "active"
}];
const metrics: AccessTokenMetric[] = [
  {
    "id": "totalAccessToken",
    "label": "Total",
    "value": 24
  },
  {
    "id": "activeAccessToken",
    "label": "Actifs",
    "value": 18,
    "change": "+4 ce mois",
    "tone": "success"
  },
  {
    "id": "valueAccessToken",
    "label": "À traiter",
    "value": 6
  }
];

export function Example() {
  return <AccessTokenOverview items={items} metrics={metrics}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "access-token-demo-1",
      "name": "Automatisation CI",
      "owner": "Marie Dupont",
      "scope": "Permissions démo",
      "expiresOn": "2026-10-04",
      "status": "active"
    }
  ],
  "metrics": [
    {
      "id": "totalAccessToken",
      "label": "Total",
      "value": 24
    },
    {
      "id": "activeAccessToken",
      "label": "Actifs",
      "value": 18,
      "change": "+4 ce mois",
      "tone": "success"
    },
    {
      "id": "valueAccessToken",
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

- [Source TypeScript du composant](../../../src/components/access-token/access-token-overview.tsx) — dans le monorepo : `packages/ui/src/components/access-token/access-token-overview.tsx` ; dans le package installé : `src/components/access-token/access-token-overview.tsx`.
- Déclarations après build : `dist/components/access-token/access-token-overview.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../access-token/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/access-token/types.ts), [configuration](../../../src/components/access-token/config.ts) et [schéma JSON](../../access-token/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
