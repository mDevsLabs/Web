# CouponSettings

Paramètres : codes promotionnels.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {CouponSettings} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {CouponSettings} from '@mdevs/ui/coupon/coupon-settings';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/coupon`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface CouponSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CouponSettingsValues;
    onChange: (key: keyof CouponSettingsValues, value: boolean) => void;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `values` | **Oui** | `CouponSettingsValues` | — | État contrôlé des réglages ; une clé absente se rend comme false. |
| `onChange` | **Oui** | `(key: keyof CouponSettingsValues, value: boolean) => void` | — | Reporte la modification au parent ; les réglages restent contrôlés. |

Options communes de la section :


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `title` | Non | `string` | — | Titre ou nom accessible selon le composant ; vérifier le contrat exact. |
| `description` | Non | `string` | — | Texte descriptif ; ne remplace pas le label d’un contrôle. |
| `actions` | Non | `ReactNode` | — | Nœud React placé dans l’en-tête ; fournir des commandes avec un nom accessible. |

### Callbacks propres


| Callback propre ou imbriqué | Obligation | Signature |
| --- | --- | --- |
| `onChange` | **Obligatoire** | `(key: keyof CouponSettingsValues, value: boolean) => void` |

## Types et données du domaine

Le modèle `Coupon` possède un id facultatif. Fournir un id stable et unique dans les listes applicatives. Tous les champs du schéma ci-dessous sont obligatoires dans un enregistrement complet ; initialValues du formulaire peut être partiel. Les dates restent des chaînes YYYY-MM-DD, les nombres des number et status une valeur exacte de l’union. Les montants et devises ne sont ni convertis ni localisés automatiquement.


| Champ | Libellé | Type UI | Obligatoire | Valeurs admises |
| --- | --- | --- | --- | --- |
| `code` | Code | `string` | Oui | Chaîne applicative |
| `discountPercent` | Réduction (%) | `number` | Oui | Nombre fini validé par le parent |
| `expiresOn` | Expiration | `string` | Oui | Chaîne YYYY-MM-DD |
| `usageCount` | Utilisations | `number` | Oui | Nombre fini validé par le parent |
| `status` | Statut | `CouponStatus` | Oui | `draft`, `active`, `expired` |


```ts
export type Coupon = {
    id?: string;
    code: string;
    discountPercent: number;
    expiresOn: string;
    usageCount: number;
    status: "draft" | "active" | "expired";
};

export type CouponStatus = Coupon['status'];

export interface CouponActivity extends DomainActivity {
    couponId?: string;
}

export type CouponMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCoupon' | 'activeCoupon' | 'valueCoupon';
};

export type CouponSettingsValues = Partial<Record<"notifyCoupon" | "archiveCoupon" | "approveCoupon", boolean>>;
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


| Clé de réglage | Libellé | Description |
| --- | --- | --- |
| `notifyCoupon` | Notifications : codes promotionnels | Recevoir un signal lors des changements. |
| `archiveCoupon` | Archivage automatique | Archiver les éléments terminés de la section codes promotionnels. |
| `approveCoupon` | Validation requise | Demander une validation avant publication ou activation. |

## Comportement réel

Affiche les réglages déclarés dans config.settings. Chaque case possède role="switch", un label et une aide reliée par aria-describedby. checked vaut Boolean(values[key]) ; une clé absente correspond à false. Le callback onChange(key, boolean) est obligatoire et doit mettre à jour les valeurs contrôlées dans le parent. Le composant ne stocke pas les préférences, ne les enregistre pas et ne fournit pas de bouton de confirmation.

## Exemple d’intégration

Cet exemple compile avec le package et représente un flux local. Remplacer les valeurs fictives par celles du projet et connecter les traitements applicatifs dans le parent. Les callbacks qui écrivent dans console.log illustrent une intention et doivent être remplacés par une action réelle. Sous Next.js, garder les callbacks dans une frontière client. Le CSS est montré ici pour rendre l’exemple autonome ; dans une application, l’importer une seule fois à la racine.


```tsx
'use client';
import {useState} from 'react';
import {CouponSettings, type CouponSettingsValues} from '@mdevs/ui/coupon';
import '@mdevs/ui/styles.css';


export function Example() {
  const [values, setValues] = useState<CouponSettingsValues>({
  "notifyCoupon": true,
  "archiveCoupon": false,
  "approveCoupon": false
});
  return <CouponSettings values={values} onChange={(key, enabled) => setValues(previous => ({...previous, [key]: enabled}))}/>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "values": {
    "notifyCoupon": true,
    "archiveCoupon": false,
    "approveCoupon": false
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

- [Source TypeScript du composant](../../../src/components/coupon/coupon-settings.tsx) — dans le monorepo : `packages/ui/src/components/coupon/coupon-settings.tsx` ; dans le package installé : `src/components/coupon/coupon-settings.tsx`.
- Déclarations après build : `dist/components/coupon/coupon-settings.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../coupon/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/coupon/types.ts), [configuration](../../../src/components/coupon/config.ts) et [schéma JSON](../../coupon/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
