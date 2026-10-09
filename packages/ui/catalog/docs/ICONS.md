# @mdevs/icons — intégration et référence SVG

Ce guide décrit le contrat **0.2.0**, vérifié dans `packages/icons/src/create-icon.tsx`, `packages/icons/package.json` et `packages/icons/catalog/manifest.json`. La livraison contient **2 600 géométries sélectionnées, dans 29 catégories**, issues de Lucide 1.52.0 et Tabler 3.48.0. Chaque composant React a un nom public, un fichier individuel et un SVG brut. Les dessins de tiers sont conservés ; le wrapper Mdevs uniformise leur utilisation.

Pour modifier la collection, lire [ICON_MAINTENANCE.md](ICON_MAINTENANCE.md). Pour une intégration assistée, lire [AI_AGENTS.md](AI_AGENTS.md) et le `AGENTS.md` du package. Les chemins `packages/...` désignent le monorepo ; dans un package extrait, ils correspondent à la racine du package.

## 1. Trouver le nom et le chemin exacts

Dans le monorepo :

```sh
npm run catalog:find -- search --icons
npm run catalog:find -- arrow-right --icons
```

La recherche est une sous-chaîne insensible à la casse appliquée au nom, à la catégorie et aux tags. Elle retourne le nombre total de résultats et **au plus 30 entrées**. Une icône absente de ces 30 entrées n'est donc pas nécessairement absente du package. Les tags sont majoritairement en anglais et certaines entrées ont une liste vide ; essayer le nom ou lire le manifeste complet.

Dans une application Node qui a installé le package, consulter le JSON sans dépendre de la syntaxe d'import JSON du bundler :

```js
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const manifest = require('@mdevs/icons/catalog');
const matches = manifest.icons.filter(icon =>
  `${icon.name} ${icon.category} ${icon.tags.join(' ')}`
    .toLowerCase().includes('search')
);
console.log(matches.map(({name, import: module, svg}) => ({name, module, svg})));
```

Ce code sert à la découverte côté Node, pas à charger 2 600 icônes dans le navigateur. Copier ensuite un import statique réel :

```tsx
import {SearchIcon} from '@mdevs/icons/controls/search';
import {ArrowRightIcon} from '@mdevs/icons/arrows/arrow-right';
import {InfoIcon} from '@mdevs/icons/misc/info';
import type {IconProps} from '@mdevs/icons/core';
```

| Champ du manifeste | Utilisation |
| --- | --- |
| `name` | Identifiant exporté exact, avec suffixe `Icon` ; exemple : `SearchIcon`. |
| `slug` | Nom de fichier ; exemple : `search`. Ce n'est pas l'identifiant React. |
| `category` | Catégorie générée ; pour `InfoIcon`, utiliser `misc`, sans deviner `interface`. |
| `import` | Sous-chemin public complet à copier. |
| `svg` | Chemin du fichier brut relatif au package ; exemple : `svg/controls/search.svg`. |
| `tags` | Aide à la découverte ; ni synonymes exportés, ni contrat exhaustif. |
| `source` | Provenance de la géométrie : `lucide` ou `tabler` dans cette sélection. |
| `geometryHash` | Empreinte de la représentation des nœuds du snapshot, utilisée pour l'intégrité. |

Les noms amont Lucide/Tabler ne sont pas tous présents ; leurs alias et leurs conventions d'import ne constituent pas l'API Mdevs. Les exports sont **nommés** : `import SearchIcon from ...` ne correspond pas au contrat. Ne pas importer `@mdevs/icons/src/...` ni `@mdevs/icons/dist/...` ; ces chemins ne sont pas des exports publics.

## 2. Contrat React et priorités des props

Les composants sont construits avec `forwardRef<SVGSVGElement, IconProps>`. `IconProps` étend `SVGProps<SVGSVGElement>` et ajoute `size`, `title` et `absoluteStrokeWidth`.

| Prop / attribut | Défaut et comportement |
| --- | --- |
| `size?: number \| string` | `24` ; fournit à la fois `width` et `height`. |
| `strokeWidth` | `1.5`, en unités du dessin SVG lorsque le trait suit la mise à l'échelle. |
| `absoluteStrokeWidth?: boolean` | `false` ; ajoute `vectorEffect="non-scaling-stroke"` aux nœuds de la géométrie lorsque `true`. |
| `title?: string` | Aucune valeur ; une chaîne non vide crée un `<title>` à identifiant issu de `useId()`. |
| `ref` | Référence de l'élément `<svg>`, jamais d'un bouton ni d'un `path`. |
| `children` | Ajoutés après le titre et les nœuds de l'icône ; aucun habillage ou redimensionnement automatique. |
| `className`, `style`, attributs SVG, `aria-*`, événements | Transmis au `<svg>` ; l'application garde la responsabilité de leur cohérence. |

Le wrapper applique une couleur propre noir/blanc : le token --md-icon-color du thème UI, sinon light-dark(#000,#fff) avec color-scheme:light dark. color="#000" fournit un repli. color personnalise ce choix, puis style.color prend priorité ; un parent coloré n’est plus hérité automatiquement. Voir [STYLE.md](STYLE.md).

Le wrapper pose par défaut `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeLinecap="round"`, `strokeLinejoin="round"` et `focusable="false"`.

**Les attributs SVG restants sont étalés après ces défauts et après les attributs ARIA calculés.** Par conséquent, `width`, `height`, `viewBox`, `fill`, `stroke`, `role`, `aria-hidden`, `aria-labelledby` ou `focusable` explicites remplacent les valeurs du wrapper. `style` est fusionné avec le style monochrome calculé, ses propriétés explicites gagnent. Une règle CSS peut également prendre la priorité sur les attributs de présentation selon la cascade. Il n'existe pas de validation runtime pour interdire ces remplacements. Le `viewBox` reste 24 × 24 dans l'usage normal ; le modifier volontairement peut rogner ou déplacer le dessin.

```tsx
<SearchIcon size={24} width={32} height={32}/>
// width/height explicites donnent ici une boîte de 32 × 32.

<SearchIcon size="1.25rem" style={{color: 'var(--app-text-muted)'}}/>
// currentColor suit la couleur CSS calculée ; le package n'exige pas le CSS de @mdevs/ui.
```

`strokeWidth` est retiré des props générales et appliqué séparément avec le défaut `1.5`. Il reste possible de modifier le rendu par CSS. `absoluteStrokeWidth` n'est pas un attribut du `<svg>` et ne redéfinit ni `size` ni `strokeWidth`.

## 3. Taille, grille et adaptation aux appareils

La grille 24 × 24 décrit les coordonnées du dessin ; elle ne contraint pas la taille physique à 24 px. Le SVG vectoriel se redessine à la résolution de l'écran. Choisir une taille d'affichage selon le contexte et garder la grille d'origine.

| Exemple | Résultat attendu et contrainte |
| --- | --- |
| `size={24}` | Dimensions `24` × `24`, usuellement 24 pixels CSS dans le document HTML. |
| `size="20px"` | Taille explicite en pixels CSS. |
| `size="1em"` | Suit la taille de police calculée de l'icône ; utile dans un bouton ou une ligne de texte. |
| `size="1.25rem"` | Suit la taille de police racine ; adapté à une échelle globale et au zoom. |
| `size="100%"` | Les deux dimensions dépendent du conteneur ; fournir une boîte avec largeur **et hauteur** définies. |
| `width={20} height={24}` | Remplace séparément `size` ; une boîte rectangulaire ne change pas le dessin, qui conserve par défaut son ratio via SVG. |

Une hauteur en pourcentage sans référence de hauteur définie peut produire un résultat inattendu. Pour une illustration responsive, définir une boîte carrée bornée par le projet :

```tsx
<span style={{display: 'inline-flex', width: 'clamp(1.25rem, 3vw, 2rem)', aspectRatio: '1'}}>
  <InfoIcon size="100%" style={{display: 'block'}} title="Information"/>
</span>
```

Le package ne fournit ni points de rupture, ni détection de téléphone, ni taille tactile automatique. Dans un layout flex, `flexShrink: 0` évite qu'une icône de bouton soit comprimée par un texte long. `display: 'block'` peut supprimer l'espace de ligne laissé par un SVG inline ; vérifier l'alignement dans le composant hôte.

### Épaisseur proportionnelle ou fixe

Sans `absoluteStrokeWidth`, un trait de `1.5` sur une grille de 24 mesure environ `1.125` pixel CSS à une taille d'affichage de 18, ou `3` à une taille de 48, avec une mise à l'échelle uniforme. C'est utile lorsque le dessin et le trait doivent grandir ensemble.

Avec `absoluteStrokeWidth`, `vector-effect="non-scaling-stroke"` évite que le trait suive la mise à l'échelle du dessin. `strokeWidth={1.5}` reste alors visuellement plus constant à plusieurs tailles. La valeur vise les unités de rendu de l'écran et dépend du moteur SVG ; elle ne promet pas un nombre identique de pixels physiques sur tous les appareils ou tous les niveaux de zoom.

```tsx
<ArrowRightIcon size={18} strokeWidth={1.5} absoluteStrokeWidth/>
<ArrowRightIcon size={48} strokeWidth={1.5} absoluteStrokeWidth/>
```

Cette option est appliquée aux nœuds générés. Les éléments fournis dans `children` doivent porter leur propre `vectorEffect` si nécessaire. Les SVG bruts n'activent pas cette option : modifier le SVG explicitement dans le projet si ce comportement est requis.

## 4. Accessibilité : décoration, information et action

Choisir le rôle de l'icône avant de lui ajouter des attributs. Une même loupe peut être décorative près de « Rechercher », informative dans une légende, ou illustrer une action nommée par son bouton.

| Situation | Nom accessible et implémentation |
| --- | --- |
| Icône près d'un texte qui exprime déjà son sens | Ne fournir aucun nom à l'icône ; elle reste décorative et masquée de l'arbre d'accessibilité. |
| Icône seule qui transmet une information | Fournir `title`, `aria-label` **ou** un `aria-labelledby` pointant vers un texte existant. Le SVG reçoit `role="img"` par défaut. |
| Action dans un bouton avec texte | Le texte nomme le bouton ; l'icône enfant reste décorative. |
| Action dans un bouton sans texte visible | `aria-label` ou texte visuellement masqué sur **le bouton** ; l'icône reste décorative. |
| État exprimé par couleur ou symbole | Ajouter un texte visible ou accessible ; la couleur seule ne suffit pas à distinguer succès, erreur ou attente. |

```tsx
import {SearchIcon} from '@mdevs/icons/controls/search';
import {CheckIcon} from '@mdevs/icons/controls/check';

<button type="button"><SearchIcon size="1em"/> Rechercher</button>
<button type="button" aria-label="Rechercher"><SearchIcon size={20}/></button>
<CheckIcon title="Synchronisation terminée"/>
<CheckIcon aria-label="Synchronisation terminée"/>
```

Le wrapper détermine si une icône est informative avec `Boolean(title || props['aria-label'] || props['aria-labelledby'])`. Cela vérifie la présence d'une valeur, pas la validité du nom ni l'existence de l'élément référencé. Une chaîne vide ne nomme pas l'icône ; une chaîne constituée d'espaces peut passer cette condition sans fournir un nom utile.

### Résolution des attributs ARIA

| Props fournies | Attributs calculés, avant les remplacements explicites |
| --- | --- |
| Aucun nom | `aria-hidden="true"`, sans rôle imposé. |
| `title="Rechercher"` | `<title id="…-title">`, `role="img"`, `aria-labelledby="…-title"`, sans `aria-hidden` calculé. |
| `aria-label="Rechercher"` | `role="img"`, label transmis, sans titre ni `aria-hidden` calculé. |
| `aria-labelledby="search-label"` | `role="img"`, référence transmise ; l'application doit rendre l'élément d'ID `search-label`. |
| `title` et `aria-label` | Le wrapper crée `aria-labelledby` vers le titre. Dans le calcul habituel du nom accessible, un `aria-labelledby` valide prend priorité sur `aria-label`. Choisir une seule stratégie évite un nom ambigu. |
| `title` et `aria-labelledby` explicite | La référence explicite remplace l'ID calculé. Le `<title>` est toujours rendu, mais ne sert plus nécessairement de nom. |
| Nom et `aria-hidden={true}` | L'attribut explicite masque le SVG, même si le rôle ou le titre existent. C'est un état contradictoire à éviter pour une information nécessaire. |
| Aucun nom et `aria-hidden={false}` | Le SVG est exposé, mais le wrapper ne crée ni nom ni `role="img"`. Ce n'est pas une façon suffisante de le rendre informatif. |

Un `aria-labelledby={undefined}` explicitement présent peut également effacer la référence produite par `title`, à cause de l'ordre de propagation. Éviter les objets de props contenant des clés ARIA indéfinies par défaut. Ne pas compter sur `<title>` comme tooltip graphique fiable ; pour une aide visible, utiliser un composant approprié, sans retirer le nom du contrôle.

Avec plusieurs icônes titrées, `useId()` donne à chaque titre un ID propre à l'arbre React. Garder un rendu serveur/client cohérent ; ne pas remplacer les ID par une constante partagée. Les composants sont des modules client pour les intégrations React Server Components ; les callbacks de contrôle restent dans un composant client.

### Boutons et cibles tactiles

Un SVG de 20 px peut être placé dans un bouton d'au moins 44 × 44 pixels CSS, cible pratique pour une interface tactile. Ce dimensionnement relève du bouton hôte. Employer un vrai `<button type="button">` pour une action et un `<a href="…">` pour une navigation ; un SVG avec `onClick` ne fournit pas automatiquement clavier, focus ou sémantique de contrôle.

```tsx
<button
  type="button"
  aria-label="Rechercher"
  style={{minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
>
  <SearchIcon size={20} style={{flexShrink: 0}}/>
</button>
```

Le projet doit fournir un focus visible, des contrastes lisibles sur le Liquid Glass et les états `disabled`, `aria-expanded` ou `aria-pressed` pertinents sur le contrôle. L'icône ne gère aucun de ces états. Les icônes ne se retournent pas automatiquement en RTL ; vérifier le sens d'une flèche de navigation selon la langue.

## 5. Référence SVG, enfants et fichiers bruts

Une référence sert à mesurer le SVG ou à accéder à ses attributs. Pour focaliser un contrôle, cibler le bouton parent avec sa propre référence.

```tsx
import {useRef} from 'react';
import {SearchIcon} from '@mdevs/icons/controls/search';

function MeasuredIcon() {
  const svgRef = useRef<SVGSVGElement>(null);
  return <SearchIcon ref={svgRef} size={24} data-testid="search-icon"/>;
}
```

`children` permet d'ajouter des nœuds SVG ; il ne remplace pas la géométrie existante. L'attribut `title` reste la voie prévue pour le titre automatique. Un `<title>` fourni manuellement dans `children` ne déclenche pas le calcul ARIA du wrapper.

Les fichiers bruts sont dans `svg/<catégorie>/<slug>.svg` et le motif public `@mdevs/icons/svg/*` vise ces fichiers. **Le sous-chemin public ne porte pas l'extension** : `@mdevs/icons/svg/controls/search` correspond à `svg/controls/search.svg`, car l'export ajoute déjà `.svg`. Le chemin `@mdevs/icons/svg/controls/search.svg` ferait chercher un fichier se terminant par `.svg.svg`. Le champ `svg` du manifeste reste le chemin physique, avec extension.

Leur import comme asset dépend du bundler : certains renvoient une URL, d'autres exigent un chargeur ou un suffixe spécifique. Le package ne fournit pas SVGR et ne promet pas qu'un asset SVG devienne un composant React. Les types TypeScript de ces imports doivent aussi être définis par le projet, pour le sous-chemin qu'il utilise. Côté Node, `require.resolve('@mdevs/icons/svg/controls/search')` résout le chemin physique sans lire ni exécuter le fichier.

| Usage du fichier brut | Responsabilité du projet |
| --- | --- |
| `<img src="…" alt="Rechercher"/>` | Fournir `alt`, une taille et le chemin d'asset résolu par le projet. |
| `<img src="…" alt=""/>` | Usage décoratif, avec texte ou nom accessible sur le contrôle parent. |
| SVG inline copié | Ajouter le rôle et le nom, ou `aria-hidden="true"`, puis préserver les notices de licence. |
| Asset externe | La couleur CSS du parent ne traverse pas l'image : `currentColor` dans le fichier externe n'hérite pas de la couleur du bouton comme un SVG inline. |

Les SVG bruts n'ont ni titre généré, ni ref React, ni logique ARIA, ni activation automatique de `non-scaling-stroke`. Pour un simple usage React coloré par le thème, préférer le composant exporté.

## 6. Imports et taille de bundle

Les trois formes suivantes sont publiques :

```tsx
import {SearchIcon} from '@mdevs/icons';
import {SearchIcon} from '@mdevs/icons/controls';
import {SearchIcon} from '@mdevs/icons/controls/search';
```

La livraison expose ESM, CommonJS et déclarations TypeScript. Elle porte `sideEffects: false` et les appels générés à `createIcon` sont annotés `/* @__PURE__ */`. Un bundler ESM capable d'éliminer les exports inutilisés peut réduire un import racine statique. Le dépôt vérifie ce comportement avec esbuild pour un cas précis ; cela ne constitue pas une garantie pour chaque configuration de webpack, Vite, Next.js ou chaque consommateur CommonJS.

L'import individuel évite de dépendre de l'élimination de tout l'index. Un `require('@mdevs/icons')` ou un import de namespace parcouru dynamiquement peut entraîner le chargement de la collection. Éviter `import * as Icons` associé à `Icons[name]` pour une petite application. Construire une table explicite avec uniquement les imports nécessaires :

```tsx
import {SearchIcon} from '@mdevs/icons/controls/search';
import {SettingsIcon} from '@mdevs/icons/controls/settings';
const actionIcons = {search: SearchIcon, settings: SettingsIcon} as const;
type ActionIconName = keyof typeof actionIcons;

function ActionIcon({name}: {name: ActionIconName}) {
  const Icon = actionIcons[name];
  return <Icon size="1em"/>;
}
```

Un sous-chemin calculé à partir d'une chaîne arbitraire peut empêcher le bundler de déterminer les modules requis. Pour du chargement différé, écrire des `import()` littéraux autorisés et mesurer le résultat dans le projet. Vérifier la sortie de production, pas seulement le temps de démarrage en développement.

## 7. Exemple vérifiable et contrôles manuels

Le monorepo contient `examples/docs/icons-accessible-toolbar.tsx`, une barre d'outils React typée avec imports individuels, une icône décorative dans un bouton textuel, un bouton sans texte visible nommé sur le parent, une information nommée, une référence SVG et une boîte responsive. Ce fichier d'exemple est fourni dans le monorepo ; ce guide reste autonome pour un package installé. Les callbacks d'action sont fournis par le projet hôte ; l'exemple ne simule pas un service de recherche.

Pour le vérifier dans une page de démonstration :

1. Rendre `IconsAccessibleToolbar` avec `onSearch` et `onClose` qui mettent à jour un compteur local visible. Vérifier qu'un clic appelle chaque callback une fois.
2. Tabuler jusqu'aux boutons, vérifier le focus visible puis les activer avec Entrée et Espace. Le SVG ne doit pas former une étape de tabulation séparée.
3. Lire l'arbre d'accessibilité : noms « Rechercher » et « Fermer le panneau » pour les boutons ; aucun nom d'icône décorative répété dans ces boutons ; nom « Informations sur les raccourcis » pour le SVG informatif.
4. Vérifier à 320–375 px et à 200 % de zoom : retour à la ligne de la barre d'outils, absence de rognage et maintien des cibles de bouton.
5. Passer la couleur du parent du clair au sombre, puis augmenter la taille de police racine. Les SVG inline suivent `currentColor`, les tailles en `em`/`rem` changent selon leur référence.
6. Comparer les deux flèches à 18 et 36 px : avec `absoluteStrokeWidth`, le trait doit rester visuellement constant. Contrôler le moteur SVG utilisé si le rendu diffère.
7. Examiner `searchRef.current` après montage : ce doit être un `SVGSVGElement` avec `viewBox="0 0 24 24"`. Ces contrôles manuels sont à réaliser ; leur présence dans ce guide n'affirme pas qu'ils ont été exécutés sur chaque navigateur.

## 8. Diagnostic rapide

| Symptôme | Vérification et correction |
| --- | --- |
| « Module not found » | Copier `import` depuis le manifeste ; vérifier le package installé et la présence de `dist` après extraction/build. |
| « No exported member » | Respecter la casse, le suffixe `Icon` et l'import nommé ; ne pas transposer un alias amont. |
| SVG invisible | Vérifier couleur calculée, `stroke`, `opacity`, dimensions du SVG et du parent, rognage/masque du layout. |
| Icône rognée | Rétablir le `viewBox` d'origine, examiner `overflow` et éviter les transformations non uniformes. |
| Taille `%` incorrecte | Donner une largeur et une hauteur au conteneur ; inspecter les dimensions calculées. |
| Trait trop fin ou trop épais | Examiner `strokeWidth`, taille, CSS et `absoluteStrokeWidth` ; contrôler aussi les règles visant `path`/`circle`. |
| Bouton annoncé deux fois | Garder l'icône enfant décorative et nommer le bouton ; supprimer le titre redondant de l'icône. |
| Icône informative silencieuse | Chercher un `aria-hidden` explicite, une référence ARIA invalide ou un nom vide dans les props effectivement rendues. |
| Taille de bundle importante | Utiliser les imports individuels, retirer le namespace dynamique et analyser le bundle de production. |
| `.svg` incompatible avec TypeScript | Configurer le chargeur et les déclarations d'assets du projet, ou utiliser le composant React. |
| Une modification disparaît | Le fichier était généré ; modifier le snapshot ou le générateur selon [ICON_MAINTENANCE.md](ICON_MAINTENANCE.md). |

## 9. Provenance et redistribution

Conserver `LICENSE`, `NOTICE.md`, `LICENSE-LUCIDE` et `LICENSE-TABLER` lors de la redistribution du package ou de sa sélection. Le wrapper Mdevs est MIT ; Lucide est ISC, avec les attributions MIT Feather contenues dans son fichier de licence ; Tabler est MIT. Le manifeste indique la source de chaque géométrie. Ne pas présenter ces dessins comme des créations originales Mdevs et ne pas considérer la seule licence MIT du wrapper comme couvrant toutes les obligations d'attribution.
