# FeatureFlagList

Liste : fonctionnalités expérimentales.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {FeatureFlagList} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {FeatureFlagList} from '@mdevs/ui/feature-flag/feature-flag-list';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/feature-flag`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface FeatureFlagListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FeatureFlag[];
    onSelect?: (item: FeatureFlag) => void;
    emptyMessage?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly FeatureFlag[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `onSelect` | Non | `(item: FeatureFlag) => void` | — | Reporte la sélection ; aucun chargement ou navigation automatique. |
| `emptyMessage` | Non | `string` | `'Aucun élément.'` | Message affiché quand la collection est vide. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onSelect` | Optionnel | `(item: FeatureFlag) => void` |

## Types et données du domaine

Le modèle `FeatureFlag` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `name` | Nom | `string` | Oui | Chaîne applicative |
| `key` | Clé | `string` | Oui | Chaîne applicative |
| `rolloutPercent` | Déploiement (%) | `number` | Oui | Nombre fini validé par le parent |
| `owner` | Responsable | `string` | Oui | Chaîne applicative |
| `status` | Statut | `FeatureFlagStatus` | Oui | `enabled`, `disabled`, `testing` |


```ts
export type FeatureFlag = {
    id?: string;
    name: string;
    key: string;
    rolloutPercent: number;
    owner: string;
    status: "enabled" | "disabled" | "testing";
};

export type FeatureFlagStatus = FeatureFlag['status'];

export interface FeatureFlagActivity extends DomainActivity {
    featureflagId?: string;
}

export type FeatureFlagMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalFeatureFlag' | 'activeFeatureFlag' | 'valueFeatureFlag';
};

export type FeatureFlagSettingsValues = Partial<Record<"notifyFeatureFlag" | "archiveFeatureFlag" | "approveFeatureFlag", boolean>>;
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

Affiche toute la collection dans son ordre reçu. Quand onSelect est fourni, chaque ligne devient un bouton type="button" et appelle ce callback avec l’enregistrement complet. Sans onSelect, les lignes restent du contenu de lecture. Une collection vide affiche emptyMessage ; aucune pagination ou virtualisation n’est appliquée.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {FeatureFlagList, type FeatureFlag} from '@mdevs/ui/feature-flag';
import '@mdevs/ui/styles.css';

const items: FeatureFlag[] = [{
  "id": "feature-flag-demo-1",
  "name": "Nouveau paiement",
  "key": "Clé démo",
  "rolloutPercent": 128,
  "owner": "Marie Dupont",
  "status": "enabled"
}];

export function Example() {
  const [selected, setSelected] = useState<FeatureFlag | null>(null);
  return <><FeatureFlagList items={items} onSelect={setSelected}/><p role="status">{selected ? 'Sélection : ' + selected.name : 'Aucune sélection'}</p></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "feature-flag-demo-1",
      "name": "Nouveau paiement",
      "key": "Clé démo",
      "rolloutPercent": 128,
      "owner": "Marie Dupont",
      "status": "enabled"
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

- [Source TypeScript du composant](../../../src/components/feature-flag/feature-flag-list.tsx) — dans le monorepo : `packages/ui/src/components/feature-flag/feature-flag-list.tsx` ; dans le package installé : `src/components/feature-flag/feature-flag-list.tsx`.
- Déclarations après build : `dist/components/feature-flag/feature-flag-list.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../feature-flag/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/feature-flag/types.ts), [configuration](../../../src/components/feature-flag/config.ts) et [schéma JSON](../../feature-flag/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
