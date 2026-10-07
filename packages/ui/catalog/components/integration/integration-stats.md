# IntegrationStats

Indicateurs : intégrations.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {IntegrationStats} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {IntegrationStats} from '@mdevs/ui/integration/integration-stats';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/integration`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface IntegrationStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly IntegrationMetric[];
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `metrics` | **Oui** | `readonly IntegrationMetric[]` | — | Indicateurs déjà calculés par l’application ; le composant ne les agrège pas. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Types et données du domaine

Le modèle `Integration` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `provider` | Fournisseur | `string` | Oui | Chaîne applicative |
| `connectedOn` | Connexion | `string` | Oui | Chaîne YYYY-MM-DD |
| `syncCount` | Synchronisations | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `IntegrationStatus` | Oui | `connected`, `pending`, `error` |


```ts
export type Integration = {
    id?: string;
    name: string;
    provider: string;
    connectedOn: string;
    syncCount: number;
    status: "connected" | "pending" | "error";
};

export type IntegrationStatus = Integration['status'];

export interface IntegrationActivity extends DomainActivity {
    integrationId?: string;
}

export type IntegrationMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalIntegration' | 'activeIntegration' | 'valueIntegration';
};

export type IntegrationSettingsValues = Partial<Record<"notifyIntegration" | "archiveIntegration" | "approveIntegration", boolean>>;
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

Affiche les métriques reçues dans une liste de descriptions. label, value et change sont présentés tels quels ; tone devient data-tone. Aucun calcul, format monétaire ou comparaison automatique n’est effectué. Les identifiants métriques doivent respecter l’union du domaine.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {IntegrationStats, type IntegrationMetric} from '@mdevs/ui/integration';
import '@mdevs/ui/styles.css';

const metrics: IntegrationMetric[] = [
  {
    "id": "totalIntegration",
    "label": "Total",
    "value": 24
  },
  {
    "id": "activeIntegration",
    "label": "Actifs",
    "value": 18,
    "change": "+4 ce mois",
    "tone": "success"
  },
  {
    "id": "valueIntegration",
    "label": "À traiter",
    "value": 6
  }
];

export function Example() {
  return <IntegrationStats metrics={metrics}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "metrics": [
    {
      "id": "totalIntegration",
      "label": "Total",
      "value": 24
    },
    {
      "id": "activeIntegration",
      "label": "Actifs",
      "value": 18,
      "change": "+4 ce mois",
      "tone": "success"
    },
    {
      "id": "valueIntegration",
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

- [Source TypeScript du composant](../../../src/components/integration/integration-stats.tsx) — dans le monorepo : `packages/ui/src/components/integration/integration-stats.tsx` ; dans le package installé : `src/components/integration/integration-stats.tsx`.
- Déclarations après build : `dist/components/integration/integration-stats.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../integration/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/integration/types.ts), [configuration](../../../src/components/integration/config.ts) et [schéma JSON](../../integration/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
