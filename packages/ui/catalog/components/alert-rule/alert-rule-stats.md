# AlertRuleStats

Indicateurs : règles d’alerte.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {AlertRuleStats} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {AlertRuleStats} from '@mdevs/ui/alert-rule/alert-rule-stats';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/alert-rule`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface AlertRuleStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly AlertRuleMetric[];
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `metrics` | **Oui** | `readonly AlertRuleMetric[]` | — | Indicateurs déjà calculés par l’application ; le composant ne les agrège pas. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


Aucun callback propre déclaré directement. Les éventuels événements React hérités et callbacks des objets imbriqués restent définis par les types ci-dessus.

## Types et données du domaine

Le modèle `AlertRule` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `metric` | Métrique | `string` | Oui | Chaîne applicative |
| `threshold` | Seuil | `number` | Oui | Nombre fini validé par le parent |
| `channel` | Canal | `string` | Oui | Chaîne applicative |
| `status` | Statut | `AlertRuleStatus` | Oui | `active`, `muted`, `disabled` |


```ts
export type AlertRule = {
    id?: string;
    name: string;
    metric: string;
    threshold: number;
    channel: string;
    status: "active" | "muted" | "disabled";
};

export type AlertRuleStatus = AlertRule['status'];

export interface AlertRuleActivity extends DomainActivity {
    alertruleId?: string;
}

export type AlertRuleMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalAlertRule' | 'activeAlertRule' | 'valueAlertRule';
};

export type AlertRuleSettingsValues = Partial<Record<"notifyAlertRule" | "archiveAlertRule" | "approveAlertRule", boolean>>;
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
import {AlertRuleStats, type AlertRuleMetric} from '@mdevs/ui/alert-rule';
import '@mdevs/ui/styles.css';

const metrics: AlertRuleMetric[] = [
  {
    "id": "totalAlertRule",
    "label": "Total",
    "value": 24
  },
  {
    "id": "activeAlertRule",
    "label": "Actifs",
    "value": 18,
    "change": "+4 ce mois",
    "tone": "success"
  },
  {
    "id": "valueAlertRule",
    "label": "À traiter",
    "value": 6
  }
];

export function Example() {
  return <AlertRuleStats metrics={metrics}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "metrics": [
    {
      "id": "totalAlertRule",
      "label": "Total",
      "value": 24
    },
    {
      "id": "activeAlertRule",
      "label": "Actifs",
      "value": 18,
      "change": "+4 ce mois",
      "tone": "success"
    },
    {
      "id": "valueAlertRule",
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

- [Source TypeScript du composant](../../../src/components/alert-rule/alert-rule-stats.tsx) — dans le monorepo : `packages/ui/src/components/alert-rule/alert-rule-stats.tsx` ; dans le package installé : `src/components/alert-rule/alert-rule-stats.tsx`.
- Déclarations après build : `dist/components/alert-rule/alert-rule-stats.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../alert-rule/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/alert-rule/types.ts), [configuration](../../../src/components/alert-rule/config.ts) et [schéma JSON](../../alert-rule/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
