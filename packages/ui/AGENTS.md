# @mdevs/ui — instructions détaillées pour les agents IA

Le style de création est défini dans [STYLE.md](STYLE.md) : Inter local, verre subtil, rayons 16–20 px et espacement aéré. Les 100 ajouts 0.2.0 comprennent 60 primitives et 40 compositions typées ; une variante de style ou un alias ne doit pas augmenter le comptage.

Ce fichier concerne le package UI React/TypeScript. Dans le monorepo, lire aussi les instructions racine et `docs/AI_AGENTS.md`. Dans un ZIP UI autonome, commencer ici puis lire [le guide des agents](catalog/docs/AI_AGENTS.md). Les chemins `src/`, `dist/` et `catalog/` ci-dessous sont relatifs à la racine de `@mdevs/ui`, pas à celle du monorepo.

## 1. Établir le contrat avant d'écrire une interface

Le package contient 1 212 exports de composants : 132 primitives et 1 080 composants métier répartis sur 108 domaines. Chaque domaine expose dix composants distincts et un modèle typé; leurs rendus réutilisent `src/internal/domain.tsx`. Cette organisation ne signifie pas que chaque domaine implémente un service métier ou une interaction spécialisée.

Pour chaque besoin, établir : données disponibles, actions attendues, propriétaire de l'état, validation, format d'affichage et comportement sur petit écran. Choisir ensuite une primitive, un composant métier ou une composition. Ne pas introduire une dépendance supplémentaire pour résoudre une interaction déjà couverte. Un besoin absent, comme une combobox de recherche ou une table virtualisée, peut demander un autre composant; le signaler précisément.

Ordre de consultation :

1. `catalog/manifest.json` : nom exporté, sous-chemin public, catégorie, fichier source, type de props, exemple et callbacks attendus.
2. `<chemin indiqué par source>`, relatif au package et incluant déjà `src/` : props exactes et comportement de l'export.
3. `src/components/<domaine>/types.ts` : modèle, union de statuts, activités, métriques et clés de paramètres.
4. `catalog/<domaine>/schema.json` : configuration d'affichage et données de démonstration. Il ne s'agit pas d'un validateur JSON Schema exécutable.
5. `dist/**/*.d.ts` : contrat distribué au consommateur. Les écarts entre sources et `dist` indiquent un build à actualiser avant livraison.

En monorepo : `npm run catalog:find -- invoice`. La recherche affiche au maximum 30 entrées; un résultat tronqué ne signifie pas que les autres exports n'existent pas. Pour une recherche exhaustive dans un package installé :

```js
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const manifest = require('@mdevs/ui/catalog');
const entries = manifest.components.filter(entry => entry.category === 'invoice');
console.table(entries.map(({name, import: module, propsType, source}) => ({name, module, propsType, source})));
```

`sampleProps` sert à la démonstration, pas à la persistance. Une entrée contenant des valeurs initiales mais aucun `onSubmit` ne constitue pas un formulaire utilisable. Les métadonnées ne remplacent pas la lecture des types.

## 2. Installer et importer

React et React DOM sont des peer dependencies : `^18.3.1 || ^19.0.0`. Le package dépend de `radix-ui`. Utiliser le gestionnaire du projet hôte et son fichier lock. La construction du monorepo exige Node `>=22.12.0`; cette exigence n'est pas celle de tous les consommateurs du package, dont le champ engines indique `>=18`.

Importer `@mdevs/ui/styles.css` une fois dans l'entrée globale de l'application. Sans ce fichier, les composants ne disposent pas du style Liquid Glass. Aucun setup Tailwind ou fournisseur CSS-in-JS n'est nécessaire.

```tsx
import {Button} from '@mdevs/ui/primitives/button';
import {InvoiceForm} from '@mdevs/ui/invoice/invoice-form';
import type {Invoice} from '@mdevs/ui/invoice';
```

Le root `@mdevs/ui`, `@mdevs/ui/primitives` et les barrels de domaine sont publics. Les sous-chemins du manifeste conviennent quand la granularité d'import est importante. Ne pas importer `@mdevs/ui/src/...`, `@mdevs/ui/internal/...` ou un nom imaginé. `Combobox` est disponible en 0.2.0 pour un choix recherchable local au clavier. `Sheet` et `AlertDialog` ne sont pas des exports ; consulter `Drawer` et `ConfirmDialog` selon le besoin, en respectant leurs limites.

## 3. Contrats de données et comportement des dix familles

Les composants métier acceptent notamment `title`, `description`, `actions`, `className`, `style` et les attributs HTML de leur section. Leur titre est un `h3`; organiser la page avec des titres `h1` et `h2` cohérents. Les champs de configuration ont des libellés français; les codes de statut sont des chaînes anglaises stables.

| Famille | Données et actions | Comportement réel |
| --- | --- | --- |
| `XCard` | `item: X` | Affiche les champs du modèle; pas de navigation implicite. |
| `XList` | `items`, `onSelect?`, `emptyMessage?` | Rend des boutons si `onSelect` existe, sinon une liste de consultation. |
| `XTable` | `items`, `emptyMessage?` | Trie localement par colonne; aucun `onSelect`, pagination ou formatteur de cellule. |
| `XForm` | `initialValues?`, `onSubmit`, `pending?`, `submitLabel?` | Champs natifs non contrôlés, validation HTML, valeurs sans `id`. |
| `XFilters` | `query`, `onQueryChange`, `status?`, `onStatusChange?` | Émet des changements; l'application applique le filtre. Le sélecteur de statut est désactivé sans callback. |
| `XTimeline` | `events: XActivity[]` | Affiche les dates fournies sans traduction ni conversion de fuseau. |
| `XStats` | `metrics: XMetric[]` | Affiche des indicateurs fournis; aucun calcul de KPI. |
| `XEmptyState` | `message?`, `actionLabel?`, `onAction?` | Affiche un bouton seulement si le libellé et le callback sont présents. |
| `XSettings` | `values`, `onChange(key, value)` | Paramètres contrôlés; clés absentes considérées comme `false`. |
| `XOverview` | `items`, `metrics` | Affiche au maximum cinq éléments; ne constitue pas une pagination. |

Les valeurs ne sont pas enrichies par une API cachée. Les nombres restent des nombres et ne reçoivent aucune devise automatique. Les dates de champs `date` attendent `YYYY-MM-DD`; éviter de transformer une date civile avec `new Date(...).toISOString()` sans examiner le décalage de fuseau. Les tables/cartes utilisent `String(value)` et remplacent les valeurs manquantes ou vides par `—`. Utiliser `DataTable<T>` avec `columns[].render` pour un affichage monétaire ou des statuts traduits; conserver le modèle original typé.

Les `id` de nombreux modèles sont facultatifs. Fournir des identifiants stables pour les listes réordonnées. Les familles utilisent l'index en secours : acceptable pour une démonstration statique, fragile pour une liste modifiable. Les métriques de facture acceptent `totalInvoice`, `activeInvoice` et `valueInvoice`; ne pas remplacer ces clés par des identifiants inventés.

## 4. Attribuer l'état et connecter les callbacks

Pour un contrôle React natif, choisir `value`/`onChange` ou `defaultValue`. Ne pas passer de `value` sans mise à jour du parent et ne pas basculer entre `undefined` et une valeur contrôlée. Utiliser `''` comme valeur vide d'un champ texte contrôlé.

| Contrôle | Callback à utiliser | Particularité |
| --- | --- | --- |
| `Input`, `Textarea`, `Select`, `DateInput` | `onChange(event)` | Événement HTML natif; lire `event.target.value`. |
| `NumberInput` | `onValueChange(number \| undefined)` | Vide → `undefined`, zéro préservé; vérifier les valeurs non finies. |
| `Checkbox` | `onCheckedChange(boolean \| 'indeterminate')` | Ne pas assimiler aveuglément `'indeterminate'` à `true`. |
| `Switch` | `onCheckedChange(boolean)` | Peut aussi démarrer avec `defaultChecked`. |
| `RadioGroup` | `onValueChange(string)` | `value` ou `defaultValue`; fournir `name` et `label`. |
| `TagInput`, `SegmentedControl` | `onValueChange(...)` | La valeur publique est contrôlée par l'application. |
| `Pagination` | `onPageChange(number)` | Pages à partir de 1; ne récupère ni ne découpe les données. |
| `FileUpload` | `onFilesChange(File[])` | Sélection locale uniquement; téléversement, contrôle MIME et progression sont applicatifs. |

Ne pas écrire `onChange` sur `NumberInput` : cette prop est omise de son interface. Ne pas écrire `onCheckedChange` sur un champ métier de paramètres : `XSettings` expose `onChange(key, value)`. Les primitives ne normalisent pas tous leurs contrats vers un callback universel.

`useControllable` utilise l'état interne seulement quand `value === undefined`. Un contrôle recevant une valeur et un callback qui ne la met pas à jour restera inchangé. Les composants de filtres, paramètres, tags et pagination ne stockent pas les résultats dans votre application.

## 5. Formulaires, validation et erreurs

`XForm` utilise `defaultValue`. Un nouveau `initialValues` ne resynchronise pas les champs déjà montés. Pour changer explicitement d'enregistrement, utiliser une `key` stable basée sur l'identifiant; pour réinitialiser après un succès, incrémenter une version. Ne pas changer la clé à chaque frappe, chaque rendu ou chaque chargement : cela supprimerait les saisies et le focus.

La soumission métier : empêche l'envoi HTML, lit `FormData`, supprime les espaces extérieurs, convertit les champs numériques par `Number`, distingue vide et zéro, puis appelle `onSubmit`. Elle ne transmet pas `id`. Les types TypeScript et les casts internes ne valident pas les données reçues à l'exécution. La validation serveur demeure nécessaire.

`pending` est fourni par le parent. Il désactive le fieldset et le bouton de soumission et change son libellé; `onSubmit` ne déclenche pas cet état automatiquement et n'attend pas une Promise. Attraper toute erreur dans le callback applicatif, arrêter `pending` dans un `finally`, puis annoncer le succès seulement après réponse confirmée. Une ref de requête en cours peut éviter deux appels avant le prochain rendu.

Les formulaires métier n'exposent ni erreur par champ, ni schéma de validation personnalisé, ni `onValuesChange`. Composer `Form`, `Field` et des champs pour ces besoins. `Field` génère les textes `id-hint` et `id-error` à partir de `htmlFor`, mais n'ajoute pas `aria-describedby` ou `aria-invalid` à l'enfant.

Pour `Form`, `onSubmit` s'exécute avant `onValuesSubmit`. Si le premier appelle `preventDefault()`, le second n'est pas appelé. Sans `onValuesSubmit` ni prévention, le formulaire conserve son comportement HTML normal. Choisir une seule stratégie de soumission et donner `type="submit"` au bouton : `Button` et `IconButton` ont par défaut `type="button"`.

Voir [les patrons de formulaires](catalog/docs/FORM_PATTERNS.md). Les exemples du monorepo `examples/docs/ui-profile-form.tsx` et `examples/docs/ui-invoice-workspace.tsx` montrent une validation explicite, la conservation des saisies en échec et une persistance injectée par props.

## 6. SSR et frontière client

Les sources des composants interactifs portent `'use client'`. Cela n'autorise pas l'accès à `window`, `document`, `File` ou `localStorage` pendant le rendu serveur du projet hôte. Réserver ces accès aux événements ou effets et conserver un rendu initial déterministe.

Sous Next.js App Router, importer le CSS global dans `app/layout.tsx`. Créer un wrapper client pour `ThemeProvider`, `ToastProvider`, les états et callbacks. Une page serveur peut fournir des données sérialisables au composant client. Ne pas transmettre une fonction de sauvegarde ordinaire depuis le serveur à travers cette frontière; l'adaptateur API doit vivre côté client, ou employer le mécanisme explicite de Server Actions du projet.

`theme="system"` écrit une valeur stable dans le DOM; le choix visuel provient de `prefers-color-scheme` en CSS. Le provider ne persiste pas un choix et ne lit pas `localStorage`. Si l'application veut cette persistance, définir sa stratégie d'hydratation et de préférence au niveau hôte. Ne pas générer de dates, nombres aléatoires ou identifiants métier variables au rendu; créer un `id` dans un événement ou recevoir celui du service.

## 7. Thème, CSS et portails

`ThemeProvider` accepte `theme: 'light' | 'dark' | 'system'`, `accent`, `radius`, `glass` et des attributs de `div`. Il n'impose pas un fond de page. Le fond hôte, le contraste et la surface derrière le verre font partie de l'intégration.

Les overlays portalisés disposent d'un `PortalScope` qui recopie le thème, l'accent, le rayon, le mode verre et les propriétés CSS dont la clé commence par `--` passées à `ThemeProvider.style`. Les styles ordinaires de layout et `className` ne sont pas recopiés. Une variable définie uniquement dans une règle CSS sur le wrapper du provider ne suit pas automatiquement son portail.

```tsx
import type {CSSProperties} from 'react';
const tokens = {'--md-blur': '12px', '--md-accent-ink': '#ffffff'} as CSSProperties;
// <ThemeProvider theme="dark" accent="#4f46e5" radius="18px" style={tokens}>...</ThemeProvider>
```

Les props `accent` et `radius` prennent le dessus sur les variables équivalentes de `style`. Employer un provider par périmètre visuel et tenir compte des providers imbriqués. `ToastProvider` rend sa liste localement, sans portail; le placer sous `ThemeProvider`. `useToast()` requiert un `ToastProvider` ancêtre et lève une erreur sinon.

`glass={false}` retire le flou et rend opaques les surfaces `.md-glass`. Les autres contrôles peuvent conserver des fonds translucides. Le CSS prévoit un fond opaque pour ces surfaces quand `backdrop-filter` est absent et des adaptations pour mouvement réduit, transparence réduite et couleurs forcées. Contrôler le fond réel et la lisibilité; ces règles ne garantissent pas à elles seules le contraste de toutes les personnalisations.

## 8. Overlays et accessibilité

`Dialog`, `Drawer`, `ConfirmDialog`, `CommandPalette`, `Popover`, `DropdownMenu` et `Tooltip` encapsulent Radix. Les déclencheurs `asChild` exigent un seul élément capable de recevoir props et ref. `Button`, `IconButton` ou un bouton natif conviennent. Une chaîne, un fragment ou un composant qui ignore les props et la ref peut casser l'ouverture et le focus.

Un `Dialog`/`Drawer` contrôlé exige `open` et `onOpenChange`. `ConfirmDialog` ferme immédiatement lors de la confirmation, ne propose pas de `pending` et utilise `Dialog`, pas une primitive `AlertDialog`. Pour une confirmation asynchrone qui doit rester visible en cas d'échec, composer `Dialog` avec des boutons et un état applicatif.

Les wrappers ne transmettent pas l'ensemble de l'API Radix : pas de `container` de portail, `onOpenAutoFocus`, `onCloseAutoFocus`, `onEscapeKeyDown` ou `className` de contenu dans les props actuelles de `Dialog`. Si le projet en a besoin, choisir une intégration qui expose réellement ces options. Ne pas supposer que toute prop Radix est acceptée.

Le retour du focus fonctionne autour d'un déclencheur conservé dans le DOM. Tester les ouvertures programmatiques sans trigger et les cas où l'action supprime le déclencheur; une cible de focus de secours appartient à l'application. Voir [le guide des overlays](catalog/docs/OVERLAYS.md) et `examples/docs/ui-controlled-dialog.tsx` dans le monorepo.

Exigences de contenu :

- Un titre de modal explicite, des labels pour les contrôles et un nom pour chaque bouton d'icône.
- Un `id` unique par champ; `useId()` convient pour relier labels, aides et erreurs.
- Les aides et erreurs liées au contrôle avec `aria-describedby`; `aria-invalid` seulement selon l'état réel.
- Une annonce de sauvegarde/erreur adaptée; une notification ne remplace pas une erreur persistante sous le champ.
- Une hiérarchie de titres cohérente et des statuts textuels, pas seulement une couleur.
- Une vérification clavier et tactile de l'ouverture, fermeture, sélection et accès aux champs.

`CommandPalette` filtre des boutons parcourus avec Tab; elle ne fournit pas une combobox avec navigation fléchée. `TreeView` s'appuie sur des éléments `details` et des boutons; ne lui attribuer pas arbitrairement `role="tree"`. Le comportement des tableaux doit rester accessible dans leur région locale de défilement.

## 9. Diagnostic rapide

| Symptôme | Cause à vérifier | Correction proportionnée |
| --- | --- | --- |
| Apparence HTML brute | CSS absent ou import au mauvais endroit | Vérifier `@mdevs/ui/styles.css` et le bundler hôte. |
| Champ ou filtre immobile | Valeur contrôlée sans mise à jour | Relier le callback au même état et rerendre la valeur. |
| Filtres sans effet sur la table | Le callback change seulement l'UI de filtre | Appliquer le prédicat ou envoyer une requête avant de passer `items`. |
| Formulaire garde une ancienne fiche | `initialValues` utilise `defaultValue` | Remonter avec une clé d'enregistrement ou composer un formulaire contrôlé. |
| Bouton ne soumet pas | `Button` a `type="button"` | Passer `type="submit"` dans le formulaire. |
| Échec réseau sans message | Aucun catch applicatif | Conserver les valeurs, afficher une erreur et remettre `pending` à false. |
| Overlay dans le mauvais thème | Provider absent, variables définies seulement sur wrapper CSS | Vérifier la hiérarchie et passer les tokens via `ThemeProvider.style`. |
| `useToast requires ToastProvider` | Hook hors de son contexte | Déplacer le hook dans un descendant du provider. |
| Ref, focus ou ouverture cassés | Déclencheur `asChild` non compatible | Employer un bouton natif ou une primitive qui transmet la ref. |
| Montant sans symbole, statut anglais | Affichage brut du composant métier | Employer `DataTable.columns[].render` ou une composition adaptée. |
| Import introuvable | Nom ou sous-chemin supposé | Copier l'import du manifeste et vérifier `package.json.exports`. |

## 10. Modifier le package dans le monorepo

Les composants métier générés portent un commentaire en tête. Modifier `scripts/data/domains.txt` et `scripts/generate.py`, puis utiliser le workflow de génération racine. Les primitives sont définies dans `scripts/foundations.py` et les 60 ajouts dans `scripts/extensions.py`. Une modification directe de ces sorties peut disparaître à la génération suivante. `src/internal/domain.tsx`, `src/internal/theme.tsx` et `src/styles.css` concentrent les comportements partagés : un changement peut toucher de nombreux exports.

Avant un changement de contrat, consulter les usages, les `.d.ts`, les métadonnées, les exemples et les tests concernés. Conserver le modèle typé et les export paths publics. Ne pas ajouter des alias, tailles ou couleurs au comptage des composants. Aucun build ou script de ZIP ne publie le package sur npm.

## 11. Vérifier selon le périmètre de la tâche

Pour une documentation seule : vérifier les imports, props, exemples TypeScript, chemins et liens concernés. Les descriptions doivent correspondre au code; ne pas annoncer un nouveau résultat navigateur à partir d'une relecture de texte.

Pour une intégration : compiler le projet hôte, contrôler le CSS chargé, utiliser des données typées réelles, exercer au moins un succès et un échec applicatif, puis vérifier clavier, focus et largeur 320–375 px dans les thèmes utilisés. Tester React/framework réellement installés dans le projet.

Pour un changement d'API ou de moteur partagé : suivre les checks racine et exécuter les tests comportementaux pertinents avant les checks de livraison. Le monorepo fournit `npm run typecheck`, `npm test`, `npm run build`, `node scripts/verify.mjs` et `npm run test:browser` pour le catalogue. Ne pas lancer le workflow de livraison pour une simple correction de texte sauf si une nouvelle archive est demandée.

Avant de terminer, rendre compte des fichiers changés, du comportement obtenu, des vérifications réellement exécutées et des limites restantes. La validation Chromium du catalogue ne justifie pas une promesse Safari, Firefox, iOS ou une certification de l'application hôte.

Guides complémentaires : [intégration UI](catalog/docs/UI_PLAYBOOK.md), [formulaires](catalog/docs/FORM_PATTERNS.md), [overlays](catalog/docs/OVERLAYS.md), [API](catalog/docs/API.md), [accessibilité](catalog/docs/ACCESSIBILITY.md), [Liquid Glass](catalog/docs/LIQUID_GLASS.md) et [limites](catalog/docs/LIMITATIONS.md).

## 12. Créer une primitive : méthode et contrats

Dans le monorepo, ajouter l’implémentation durable à `scripts/extensions.py` avec `component(...)`, ou à `scripts/foundations.py` pour une primitive initiale. Le préambule fournit React, Radix, `cx`, `useControllable` et le contexte de portail. Si une nouvelle API est nécessaire, l’importer explicitement dans la source durable ; ne pas ajouter une dépendance pour une interaction déjà disponible.

Définir une interface `<Nom>Props` avec les attributs HTML du bon élément. Un callback de donnée comme `onValueChange(value)` ne doit pas être confondu avec l’événement React `onChange(event)`. Exclure/redéclarer les collisions via Omit. Documenter les valeurs par défaut, refs, callbacks requis et contraintes des collections. Les valeurs de choix et id de lignes sont uniques/stables.

Pour un champ contrôlé, le parent reçoit la valeur et la réaffiche ; aucune mutation de prop. Pour un brouillon interne, spécifier quand il est initialisé, validé et annulé. Un callback void n’implique pas une attente de Promise, un état pending automatique ou un message réseau. Donner un contrat séparé si l’interaction doit attendre une réponse.

Préparer le clavier et le focus : contrôles natifs, noms accessibles, label/description/erreur reliés, Escape/Entrée appropriés, déclencheur stable et cleanup. Ne pas attribuer role=tree/grid/listbox pour donner une apparence spécialisée sans implémenter son contrat. La combobox 0.2.0 est un exemple de focus sur input avec aria-activedescendant ; les tables éditables utilisent des inputs natifs, sans se présenter comme un spreadsheet.

Enregistrer une fixture JSON complète sans fonctions ; ajouter les callbacks requis dans `callbacks`. Pour une démonstration contrôlée, déclarer `demoState={'value':'onValueChange'}` ou l’association adaptée. `behavior` décrit les limites réelles, notamment virtualisation, réseau, validation et formatage absents. Le générateur construit source, exports, manifeste et fiche avec exemple typé.

## 13. Créer une surface conforme

Réutiliser `md-glass`, `--md-surface`, `--md-solid`, `--md-border`, `--md-highlight`, `--md-shadow`, `--md-radius` et `--md-blur`. Le défaut de flou est 12 px. Pour une nouvelle règle, éditer `src/extensions.css` ou le CSS principal, sous @layer mdevs ; le build les concatène dans l’unique styles.css public.

L’espacement utilise une mesure de 4 px et des groupes de 12–24 px. Vérifier les layouts avec min-width:0, colonnes minmax(0,1fr), textes longs et défilement local. Le choix d’un breakpoint doit correspondre à une structure, pas à un nom de téléphone. Une barre sticky ne doit pas recouvrir le focus au zoom.

Inter variable 4.1 est fournie dans `src/fonts`, puis `dist/fonts`. Le CSS déclare font-display:swap, style normal et graisses 100–900. Conserver metadata.json, son SHA256 et LICENSE-INTER.txt lors d’une mise à jour/redistribution. Ne pas prétendre que le navigateur utilise Inter seulement parce que la pile CSS la nomme : contrôler FontFace chargée ou la police réellement rendue. Code reste monospace.

Si le composant contient des icônes du package indépendant, garder noir/blanc et leur taille distincte de la cible tactile. Sur un bouton inversé, expliciter une couleur blanche/noire ou l’héritage de son texte selon le contraste. UI ne doit pas acquérir une dépendance obligatoire sur Icons pour ce seul besoin.

## 14. Valider une extension

Tester les effets utiles : données vides/zéro, état disabled, callback et rerender contrôlé, navigation clavier, focus après fermeture/suppression, erreurs et cleanup. Les sources typées compilent avant les contrôles de distribution. Les nouveaux comportements ont des tests dans `tests/extensions.test.tsx`; le catalogue rend chaque export et ses fixtures.

Dans le monorepo : `npm run generate`, puis `npm run verify`. Pour des changements visuels, servir le catalogue construit et exécuter les contrôles navigateur/style. `docs:check` compile les exemples complets des fiches contre dist ; un package ZIP extrait utilise les contrôles de son application consommatrice, sans supposer la présence des scripts du dépôt.

Avant livraison, vérifier que le CSS compilé concatène bien les extensions, que la police est accessible via l’URL relative et les sous-chemins publics, et que sources/types/catalogue/guides sont à jour. Enrichir STYLE si une nouvelle règle autorisée est introduite. Les fichiers STYLE distribués sont des copies de la source racine, pas trois styles indépendants.
