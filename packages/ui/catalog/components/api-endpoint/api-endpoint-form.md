# ApiEndpointForm

Formulaire : points d’api.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {ApiEndpointForm} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {ApiEndpointForm} from '@mdevs/ui/api-endpoint/api-endpoint-form';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/api-endpoint`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface ApiEndpointFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<ApiEndpoint>;
    onSubmit: (value: Omit<ApiEndpoint, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `initialValues` | Non | `Partial<ApiEndpoint>` | — | Valeurs initiales des champs natifs non contrôlés ; changer cette prop ne remplace pas une saisie en cours. |
| `onSubmit` | **Oui** | `(value: Omit<ApiEndpoint, 'id'>) => void` | — | Reçoit les données validées par le navigateur ; l’application gère persistance, erreurs et attente. |
| `submitLabel` | Non | `string` | `'Enregistrer'` | Consulter le contrat et le comportement ci-dessous. |
| `pending` | Non | `boolean` | `false` | État fourni par le parent ; désactive les champs et le bouton de soumission. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onSubmit` | **Obligatoire** | `(value: Omit<ApiEndpoint, 'id'>) => void` |

## Types et données du domaine

Le modèle `ApiEndpoint` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `path` | Chemin | `string` | Oui | Chaîne applicative |
| `method` | Méthode | `string` | Oui | Chaîne applicative |
| `latencyMs` | Latence (ms) | `number` | Oui | Nombre fini validé par le parent |
| `requestCount` | Requêtes | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `ApiEndpointStatus` | Oui | `healthy`, `degraded`, `disabled` |


```ts
export type ApiEndpoint = {
    id?: string;
    path: string;
    method: string;
    latencyMs: number;
    requestCount: number;
    status: "healthy" | "degraded" | "disabled";
};

export type ApiEndpointStatus = ApiEndpoint['status'];

export interface ApiEndpointActivity extends DomainActivity {
    apiendpointId?: string;
}

export type ApiEndpointMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalApiEndpoint' | 'activeApiEndpoint' | 'valueApiEndpoint';
};

export type ApiEndpointSettingsValues = Partial<Record<"notifyApiEndpoint" | "archiveApiEndpoint" | "approveApiEndpoint", boolean>>;
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

Utilise un formulaire HTML et des champs natifs non contrôlés. initialValues fournit les defaultValue lors du montage ; une mise à jour ultérieure de cette prop ne réinitialise pas automatiquement les valeurs saisies. Pour éditer un autre enregistrement, remonter le formulaire avec une key stable différente. La validation required/email/url/date/number est celle du navigateur. Après validation native, le submit appelle preventDefault(), lit FormData, trim() les chaînes et convertit les nombres avec Number(). Le callback onSubmit reçoit les champs du schéma, sans id. Son contrat retourne void : le composant n’attend pas une Promise, ne positionne pas pending et ne traite pas les erreurs métier. Le parent gère pending, persistance, erreurs et éventuelle réinitialisation ; pending désactive le fieldset et le bouton.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {ApiEndpointForm, type ApiEndpoint} from '@mdevs/ui/api-endpoint';
import '@mdevs/ui/styles.css';


export function Example() {
  const [saved, setSaved] = useState<Omit<ApiEndpoint, 'id'> | null>(null);
  return <><ApiEndpointForm onSubmit={setSaved}/><p role="status">{saved ? 'Saisie validée localement : ' + saved.path : ''}</p></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "initialValues": {
    "id": "api-endpoint-demo-1",
    "path": "/api/products",
    "method": "Méthode démo",
    "latencyMs": 128,
    "requestCount": 128,
    "status": "healthy"
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

- [Source TypeScript du composant](../../../src/components/api-endpoint/api-endpoint-form.tsx) — dans le monorepo : `packages/ui/src/components/api-endpoint/api-endpoint-form.tsx` ; dans le package installé : `src/components/api-endpoint/api-endpoint-form.tsx`.
- Déclarations après build : `dist/components/api-endpoint/api-endpoint-form.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../api-endpoint/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/api-endpoint/types.ts), [configuration](../../../src/components/api-endpoint/config.ts) et [schéma JSON](../../api-endpoint/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
