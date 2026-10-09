# BackupList

Liste : sauvegardes.

Fiche reconstruite depuis le manifeste et le code TypeScript ; les données de démonstration servent uniquement à illustrer le contrat.

## Choix et imports


```tsx
import {BackupList} from '@mdevs/ui';
// Import public ciblé du manifeste :
import {BackupList} from '@mdevs/ui/backup/backup-list';
// Charger cette feuille une seule fois dans l’application :
import '@mdevs/ui/styles.css';
```

Les deux imports de composant sont des alternatives : conserver une seule ligne. Les types de données du domaine s’importent depuis `@mdevs/ui/backup`, et non depuis le fichier du composant.

## Contrat public et obligations

Le contrat hérite des attributs React de section via DomainFrameProps, en excluant children, onSelect, onChange et onSubmit natifs. Les événements propres sont redéclarés ci-dessous. Le conteneur reçoit className, style, id et les attributs aria-*/data-* du parent.


```ts
export interface BackupListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Backup[];
    onSelect?: (item: Backup) => void;
    emptyMessage?: string;
}
```


| Prop propre au composant | Obligatoire | Type exact | Défaut du rendu | Usage |
| --- | --- | --- | --- | --- |
| `items` | **Oui** | `readonly Backup[]` | — | Collection fournie par l’application ; passer [] pour un état vide. |
| `onSelect` | Non | `(item: Backup) => void` | — | Reporte la sélection ; aucun chargement ou navigation automatique. |
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
| `onSelect` | Optionnel | `(item: Backup) => void` |

## Types et données du domaine

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
import {BackupList, type Backup} from '@mdevs/ui/backup';
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
  const [selected, setSelected] = useState<Backup | null>(null);
  return <><BackupList items={items} onSelect={setSelected}/><p role="status">{selected ? 'Sélection : ' + selected.name : 'Aucune sélection'}</p></>;
}
```

## Fixture du catalogue

`sampleProps` fournit des valeurs d’aperçu ; un objet JSON ne contient pas les fonctions, refs ou éléments React nécessaires. Les callbacks obligatoires restent à fournir même s’ils n’apparaissent pas ici.


```json
{
  "items": [
    {
      "id": "backup-demo-1",
      "name": "Sauvegarde quotidienne",
      "resource": "Ressource démo",
      "sizeGb": 128,
      "createdOn": "2026-10-04",
      "status": "scheduled"
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

- [Source TypeScript du composant](../../../src/components/backup/backup-list.tsx) — dans le monorepo : `packages/ui/src/components/backup/backup-list.tsx` ; dans le package installé : `src/components/backup/backup-list.tsx`.
- Déclarations après build : `dist/components/backup/backup-list.d.ts`.
- [Manifeste des exports](../../manifest.json).
- [Guide de catégorie](../../backup/README.md).
- [Instructions du package](../../../AGENTS.md).
- [Guide complet des agents](../../docs/AI_AGENTS.md).
- [Types du domaine](../../../src/components/backup/types.ts), [configuration](../../../src/components/backup/config.ts) et [schéma JSON](../../backup/schema.json).
- [Rendu partagé du domaine](../../../src/internal/domain.tsx) (interne, non importable par les consommateurs).
