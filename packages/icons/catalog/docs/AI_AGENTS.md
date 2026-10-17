# Guide opérationnel pour les agents IA

Ce guide sert à intégrer les packages dans une application, répondre à une question d’API ou maintenir le monorepo. Il précise quelles sources lire, comment traduire une demande en composants existants et quelles preuves produire. L’AGENTS du dépôt et ceux des packages résument les conventions de leur périmètre.

## 1. Commencer par une décision observable

Transformer la demande en résultat concret : écran de factures avec recherche et sauvegarde, bouton nommé contenant une icône, correction de focus, extension d’un schéma ou enrichissement d’un guide. Identifier le framework hôte, le mode d’installation, les données disponibles et les actions à connecter. Quand la demande fournit déjà ces informations, avancer sans répéter les mêmes questions.

Une information manquante n’a pas toujours besoin d’être demandée. La prop obligatoire `label` peut être choisie à partir de l’action explicitement demandée ; un identifiant de projet distant, un statut métier absent du modèle ou une règle de validation ne doit pas être inventé. Faire progresser les parties indépendantes d’un blocage.

## 2. Lire l’inventaire sans charger tout le dépôt

### Dans le monorepo

```sh
npm run catalog:find -- invoice
npm run catalog:find -- arrow-right --icons
rg --files packages/ui/src/components/invoice
```

Le script de recherche affiche au plus 30 résultats. Pour une inspection structurée, sélectionner les entrées JSON :

```js
import fs from 'node:fs';
const catalog = JSON.parse(fs.readFileSync('packages/ui/catalog/manifest.json', 'utf8'));
const components = catalog.components.filter(item => item.category === 'invoice');
console.log(components.map(({name, import: path, propsType, source}) => ({name, path, propsType, source})));
```

### Dans un projet consommateur

L’export public `@mdevs/ui/catalog` permet de charger le JSON avec CommonJS :

```js
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const catalog = require('@mdevs/ui/catalog');
console.log(catalog.components.find(component => component.name === 'InvoiceForm')));
```

Pour trouver le dossier du package sans supposer son emplacement :

```js
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {readFileSync} from 'node:fs';
const require = createRequire(import.meta.url);
const packageDirectory = dirname(require.resolve('@mdevs/ui/package.json'));
const instructions = readFileSync(join(packageDirectory, 'AGENTS.md'), 'utf8');
console.log(instructions);
```

Les `catalog/documentation.json` générés indexent les guides présents. Leur lecture par chemin de fichier est différente d’un import JavaScript public : ne pas inventer `@mdevs/ui/catalog/documentation.json` comme sous-chemin exporté.

### Champs utiles

| Inventaire | Champ | Usage |
| --- | --- | --- |
| UI | name | Export exact du composant |
| UI | import | Sous-chemin public ciblé |
| UI | source | Fichier à lire relativement au package |
| UI | propsType | Nom déclaré ou mention d’un contrat natif |
| UI | pattern / model | Famille de rendu et modèle métier |
| UI | sampleProps | Fixture pour comprendre le contrat |
| UI | callbacks | Points d’intégration illustrés ; consulter les types pour leur caractère obligatoire |
| Icônes | name / slug | Export React avec suffixe Icon et nom du SVG |
| Icônes | import / svg | Module React et fichier SVG brut |
| Icônes | category / tags | Recherche sémantique |
| Icônes | source / geometryHash | Provenance et empreinte du snapshot |

## 3. Vérifier une API avant de l’écrire

Le nom `InvoiceForm` ne garantit pas une prop `onSave`, `fields`, `locale` ou `validationSchema`. Lire le fichier public et ses types avant de les utiliser. Dans ce package, son API réelle est `initialValues`, `onSubmit`, `pending`, `submitLabel` et les props communes de région.

L’index public d’un domaine exporte les types et ses dix composants. Un import ciblé d’un composant n’exporte pas nécessairement le modèle : importer `type Invoice` depuis `@mdevs/ui/invoice`.

```tsx
import {InvoiceForm} from '@mdevs/ui/invoice/invoice-form';
import type {Invoice} from '@mdevs/ui/invoice';

type InvoicePayload = Omit<Invoice, 'id'>;
```

Les types internes servent d’explication de l’implémentation. Ils ne deviennent pas des exports publics par le simple fait d’être inclus dans `src`. La résolution publique est définie dans `package.json#exports`.

## 4. Choisir le bon niveau de composition

| Demande | Choix utile | Quand composer autrement |
| --- | --- | --- |
| Afficher un élément métier | XCard | Valeurs formatées, actions ligne par ligne, anatomy très spécifique |
| Parcourir plusieurs éléments | XList ou XTable | Virtualisation, colonnes personnalisées ou très gros volumes |
| Saisir un modèle simple existant | XForm | Règles par champ, étapes, fichiers, validation serveur détaillée |
| Rechercher/filtrer | XFilters + état parent | Champs supplémentaires ou facettes propres au métier |
| Afficher des KPI | XStats / Stat | Graphiques ou calculs non disponibles dans les données |
| Choisir une action locale | DropdownMenu | Navigation principale via NavigationMenu |
| Modifier en fenêtre | Dialog / Drawer | Workflow de confirmation asynchrone complexe |
| Représenter une action par dessin | IconButton + icône | Un texte visible est utile à la compréhension |

Le nombre de composants n’est pas une raison d’utiliser un domaine inadapté. Les 1 080 composants métier partagent dix patterns et des contrats propres. Leur réutilisation évite d’implémenter le même rendu pour chaque modèle ; elle ne remplace pas les décisions de produit de l’application.

## 5. Exemple de raisonnement : liste de factures

Le flux comprend quatre responsabilités : données canoniques, saisie contrôlée des filtres, résultat dérivé et sauvegarde. `InvoiceFilters` ne modifie pas directement `InvoiceTable`.

```tsx
'use client';
import {useMemo, useState} from 'react';
import {InvoiceFilters, InvoiceTable, type Invoice, type InvoiceStatus} from '@mdevs/ui/invoice';

export function FilteredInvoices({items}: {items: readonly Invoice[]}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase();
    return items.filter(invoice =>
      (!status || invoice.status === status) &&
      `${invoice.number} ${invoice.customer}`.toLocaleLowerCase().includes(text)
    );
  }, [items, query, status]);

  return <>
    <InvoiceFilters query={query} status={status}
      onQueryChange={setQuery} onStatusChange={setStatus}/>
    <InvoiceTable items={visible}/>
  </>;
}
```

Ce filtre est local, sans debounce ni requête réseau. Pour un filtrage serveur, remplacer le calcul de `visible` par les données reçues et gérer le statut de chargement dans le parent. La bibliothèque n’impose pas une stratégie de cache.

## 6. Sauvegarde et données asynchrones

Lire [FORM_PATTERNS](FORM_PATTERNS.md) pour les exemples complets. Retenir le contrat :

1. `initialValues` fournit les valeurs initiales des champs non contrôlés.
2. La validation HTML intervient lors d’une soumission utilisateur normale.
3. Le runtime construit un objet depuis FormData, convertit les nombres et appelle `onSubmit`.
4. Le parent gère le transport, la validation serveur, `pending`, les erreurs et le succès.
5. La prop `onSubmit` retourne `void` dans le contrat ; le formulaire n’attend pas une opération asynchrone ni ne capture son rejet.

Pour un enregistrement déjà chargé après le montage, rendre le formulaire lorsqu’il est disponible ou utiliser un remount décidé par l’identité. Ne pas écraser implicitement une saisie utilisateur à chaque réponse réseau. Une date `YYYY-MM-DD` et un montant numérique ne doivent pas être convertis en timezone/devise sans besoin explicite.

Les casts du runtime métier alignent des valeurs FormData sur les modèles générés après parsing HTML ; ils ne constituent pas une validation exhaustive de données externes. Valider l’entrée d’une API à sa frontière avec les règles de l’application.

## 7. SSR et personnalisation

Sous Next.js App Router, importer le CSS dans le layout et placer les callbacks dans une frontière client. Garder les props serveur sérialisables. Avec React SSR classique, utiliser les mêmes valeurs de thème au serveur et au premier rendu client. Le thème `system` est porté par des media queries CSS ; ThemeProvider ne gère pas la persistance.

Les variables de tokens transmises via `ThemeProvider.style` sont propagées aux portails. Les propriétés de layout ordinaires comme `padding` ne sont pas copiées. Les props `accent` et `radius` remplacent les tokens homonymes présents dans `style`. Pour chaque ThemeProvider imbriqué, préciser les valeurs nécessaires au périmètre.

Ne pas lire le stockage ou un media query pendant le rendu pour choisir arbitrairement une valeur différente du serveur. Si l’application doit mémoriser un thème, prévoir cette politique dans le code hôte et vérifier l’hydratation.

## 8. États accessibles et SVG

Un composant à nom obligatoire doit recevoir un libellé lié à l’usage. Un `IconButton` d’ouverture de recherche se nomme « Rechercher » ; l’icône enfant reste décorative. Le dessin ne remplace pas la zone de clic du bouton.

```tsx
import {IconButton} from '@mdevs/ui/primitives/icon-button';
import {SearchIcon} from '@mdevs/icons/controls/search';

<IconButton label="Rechercher" onClick={() => console.log('Recherche')}>
  <SearchIcon size={20}/>
</IconButton>
```

Pour une erreur de saisie, `Field` affiche un message mais ne complète pas `aria-describedby` ou `aria-invalid` sur son enfant. Pour une modale, fournir un titre et choisir une description utile. Pour un déclencheur `asChild`, fournir un élément React pouvant recevoir les props et la référence.

Le wrapper SVG applique les props explicites après les défauts. Le `viewBox` standard est 24 × 24, mais une prop `viewBox` fournie le remplace. `aria-label`, `aria-labelledby`, `role` ou `aria-hidden` contradictoires doivent être résolus volontairement. Voir [ICONS](ICONS.md) et [ACCESSIBILITY](ACCESSIBILITY.md).

## 9. Maintenir et régénérer

Les fichiers publics des primitives et domaines sont générés. Les sources à modifier se trouvent dans le générateur et ses données ; les rendus partagés et le wrapper SVG sont éditables directement. La documentation détaillée est produite par `scripts/documentation.mjs`, après formatage dans `npm run generate`, ou indépendamment via `npm run docs:build`.

Les guides centraux sont écrits dans `docs`. Ils sont copiés dans les packages pour accompagner leur installation individuelle. Les AGENTS de packages restent des instructions propres à leur surface. Les llms-full consolidés reprennent instructions et guides centraux, tandis que l’index documentaire garde les fiches détaillées navigables séparément.

La génération n’est pas un nettoyage universel de fichiers retirés. Examiner les anciens exports, guides et sous-chemins après une suppression. Les versions doivent rester cohérentes dans les scripts, manifests et packages ; la version actuelle est en partie codée en dur.

## 10. Produire des preuves adaptées

Pour une demande documentaire : synchroniser les sorties, contrôler fichiers/liens/imports, et compiler les exemples complets modifiés. Pour un changement de runtime : ajouter les comportements concernés, build et contrôle de distribution. Pour les styles/overlays : tester les interactions et les modes visuels du périmètre.

Ne pas transformer un résultat historique en preuve d’une exécution actuelle. Les rapports initiaux couvrent React 18/19 et Chromium ; une nouvelle tâche de documentation n’implique pas que Safari ou une nouvelle application ait été validée. Un test axe s’applique aux pages réellement examinées.

Lorsque le travail dépend d’un service externe, lire son résultat réel. Les packages ne contiennent pas de backend, d’authentification ou de stockage métier. Aucun script de génération ou d’archivage ne publie les packages sur npm.

## 11. Prompts de travail réutilisables

### Intégration d’un écran

> Cherche les exports nécessaires dans les manifests. Lis leurs types et leur comportement. Implémente l’écran avec les données fournies, des imports publics et le CSS existant. Connecte les callbacks, nomme les contrôles et traite les états de chargement/erreur. Compile les exemples modifiés et rapporte les vérifications réalisées.

### Diagnostic d’un composant

> Identifie le déclencheur observé et le résultat attendu. Inspecte l’export, les props reçues et le runtime concerné. Vérifie installation, CSS, état contrôlé, frontières client/serveur et thème des portails selon le symptôme. Corrige le périmètre identifié et teste le comportement qui échouait.

### Extension d’un domaine

> Examine le schéma, les types et les dix familles du domaine. Modifie la source de génération, régénère les exports et guides, puis vérifie les contrats et données de formulaire concernés. Contrôle les fichiers obsolètes et la cohérence des versions avant empaquetage.

### Mise à jour documentaire

> Appuie chaque règle sur le code réel. Ajoute les préconditions, props obligatoires, flux contrôlés, limites et exemples complets. Synchronise les copies distribuées, contrôle les liens et imports et compile les exemples. Actualise les archives demandées avec leur documentation.

## 12. Format d’un compte rendu utile

Fournir le résultat concret ou le fichier produit, puis les changements qui permettent de l’utiliser. Indiquer les commandes vérifiées et les limites qui changent l’interprétation du résultat. Pour une archive, inclure son lien et les instructions d’installation nécessaires. Pour une correction, citer l’API ou le comportement modifié.

Un bon rapport reste fondé sur ce qui a été réalisé : « exemples compilés, copies synchronisées, ZIP CRC valide » est plus précis qu’une déclaration générale de conformité ou de support universel.

## Créer de nouvelles entrées en 0.2.0

Avant de dessiner, lire [STYLE.md](STYLE.md) : Inter locale, surfaces aérées et noir/blanc 1,5 px. Les AGENTS spécifiques donnent les sources durables : extensions.py pour les nouvelles primitives, domains.txt pour les modèles, icons.json pour les géométries. Chercher les manifests pour éviter une variante/alias comptée comme nouveauté.

Définir données/états, contrat HTML/ARIA, clavier/focus, callbacks et contraintes avant de produire le rendu. Fournir fixture JSON, comportement honnête et un exemple contrôlé si nécessaire. Une nouvelle couleur ne constitue pas un nouveau composant, et une épaisseur d’icône ne constitue pas une nouvelle géométrie. La provenance/font licence suit tout asset.

La liste des 100 ajouts est dans [EXTENSIONS.md](EXTENSIONS.md). Les anciens noms/imports restent disponibles ; les défauts visuels changent explicitement. Vérifier le chargement Inter réel et les couleurs SVG calculées dans les deux thèmes avant de qualifier la création de conforme.
