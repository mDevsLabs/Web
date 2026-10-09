# @mdevs/icons — instructions détaillées pour les agents IA

Lire [STYLE.md](STYLE.md) pour créer une entrée : grille 24 × 24, trait 1,5 px, noir/blanc, détails réduits, aucun dégradé ni ombre. La version 0.2.0 ajoute 500 géométries en conservant les 2 100 précédentes et leurs noms/imports.

Ces instructions concernent le package 0.2.0. Dans le monorepo, lire aussi `../../AGENTS.md` et `../../docs/AI_AGENTS.md`. Dans une installation ou un ZIP extrait, commencer par [catalog/docs/AI_AGENTS.md](catalog/docs/AI_AGENTS.md), [catalog/docs/ICONS.md](catalog/docs/ICONS.md) et [catalog/docs/ICON_MAINTENANCE.md](catalog/docs/ICON_MAINTENANCE.md). Les déclarations TypeScript et les sources livrées priment sur une supposition d'API.

## 1. Identifier l'usage avant le dessin

Déterminer si l'icône est décorative, informative ou placée dans un contrôle. Identifier le texte existant, le nom de l'action, la taille de police, la couleur héritée, le mode clair/sombre et les exigences tactiles du projet. Le package fournit des SVG React ; le comportement métier, le contrôle parent, les états et les règles de layout appartiennent à l'application.

Ne pas assimiler une référence visuelle à un nom exporté. Le package contient une sélection de 2 600 géométries Lucide/Tabler, pas l'intégralité de leurs API. Aucun alias ne doit être inventé pour rendre un exemple plausible.

## 2. Découvrir et confirmer l'import

Dans le monorepo, lancer `npm run catalog:find -- search --icons`. La commande retourne au plus 30 résultats avec un total ; lire le JSON complet si la sélection semble incomplète. La recherche utilise une sous-chaîne du nom, de la catégorie et des tags, majoritairement anglais.

Lire `catalog/manifest.json` dans ce package. Copier exactement `name` et `import`. Vérifier l'export public dans `package.json` et, en cas de doute, le module `src/icons/<category>/<slug>.tsx` ou la déclaration correspondante dans `dist`.

Imports individuels confirmés :

```tsx
import {SearchIcon} from '@mdevs/icons/controls/search';
import {ArrowRightIcon} from '@mdevs/icons/arrows/arrow-right';
import {CheckIcon} from '@mdevs/icons/controls/check';
import {InfoIcon} from '@mdevs/icons/misc/info';
import {XIcon} from '@mdevs/icons/controls/x';
import type {IconProps} from '@mdevs/icons/core';
```

Le manifeste contient `slug`, `category`, `tags`, `source`, `geometryHash` et `svg` en plus des noms/imports. `svg` est un chemin relatif au package. `source` identifie la provenance de la géométrie, pas le chemin du composant React. Tous les noms exportés d'icônes portent le suffixe `Icon` ; ils sont sensibles à la casse.

Les imports racine, catégorie et individuels sont publics. Ne pas utiliser d'import par défaut, de chemin `src`, de chemin `dist` ni de nom supposé à partir d'une documentation Lucide/Tabler externe. Il n'y a pas de feuille de style Mdevs à importer pour les icônes seules ; `currentColor` suit la couleur calculée propre du SVG inline : héritée du texte parent par défaut, puis color/style peuvent la personnaliser.

## 3. Respecter le contrat de props

`IconProps` étend `SVGProps<SVGSVGElement>` et expose :

- `size?: number | string`, défaut `24`, appliqué à `width` et `height`.
- `title?: string`, qui produit un titre à ID unique s'il est non vide.
- `absoluteStrokeWidth?: boolean`, défaut `false`, qui applique `non-scaling-stroke` aux nœuds de géométrie.
- Les attributs SVG (`strokeWidth`, `className`, `style`, `aria-*`, etc.) et événements, transmis au SVG.
- `ref`, typé `SVGSVGElement`, et `children`, ajoutés après la géométrie.

Le trait par défaut est `1.5`, le dessin utilise `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, des jointures/extrémités rondes et `focusable="false"`.

**Priorité réelle : les props SVG restantes sont propagées après les défauts et l'ARIA calculée.** `width`, `height`, `viewBox`, `role`, `aria-hidden`, `aria-labelledby` explicites peuvent donc les remplacer. Même un `aria-labelledby={undefined}` explicitement transmis peut effacer la référence du titre. Inspecter les props réellement rendues lorsqu'un comportement diffère du guide. Ne pas annoncer que le wrapper interdit ces remplacements ou que le viewBox est immuable.

Conserver la grille et le ratio carré pour une intégration standard. Une largeur/hauteur en nombre correspond usuellement à des pixels CSS ; `em` suit la police de l'icône, `rem` la police racine. Pour une taille en `%`, établir les deux dimensions du parent. Le SVG s'adapte vectoriellement aux écrans ; il ne choisit ni breakpoint ni taille de bouton.

Sans `absoluteStrokeWidth`, le trait grandit avec le dessin. Avec cette prop, les nœuds générés reçoivent `vectorEffect="non-scaling-stroke"`. Les `children` supplémentaires ne le reçoivent pas automatiquement. Vérifier le rendu aux tailles utilisées ; ne pas promettre une épaisseur identique en pixels physiques sur tous les écrans.

## 4. Appliquer une seule stratégie de nom accessible

Le wrapper considère l'icône comme informative si `title`, `aria-label` ou `aria-labelledby` est une valeur vraie en JavaScript. Cela ne vérifie pas que le texte est utile ou que l'ID existe.

| Intention | Action attendue |
| --- | --- |
| Décoration avec texte voisin | Ne pas fournir de titre/label ; `aria-hidden="true"` est calculé. |
| Information autonome | Fournir un `title`, un `aria-label`, ou un `aria-labelledby` valide ; `role="img"` est calculé. |
| Bouton avec texte | Garder l'icône décorative et nommer le bouton par son texte. |
| Bouton sans texte visible | Donner `aria-label` ou un texte masqué au bouton, garder son SVG décoratif. |

```tsx
<button type="button"><SearchIcon size="1em"/> Rechercher</button>
<button type="button" aria-label="Fermer le panneau"><XIcon size={20}/></button>
<InfoIcon title="Informations sur les raccourcis"/>
```

Avec `title`, le wrapper crée un `<title>` à ID issu de `useId()` et `aria-labelledby` vers cet ID. Avec `title` et `aria-label`, la référence au titre prend normalement priorité dans le calcul du nom accessible. Avec `title` et un `aria-labelledby` explicite, la référence explicite gagne. Ne pas multiplier les stratégies de nom sans besoin démontré.

Un `aria-hidden={true}` explicite masque même une icône titrée ; un `aria-hidden={false}` sans nom ne la rend pas correctement informative. Un `<title>` ajouté manuellement dans `children` ne déclenche pas l'ARIA du wrapper. Ne pas utiliser le titre SVG comme seul mécanisme d'aide visible ou de tooltip.

Les boutons doivent posséder leur propre zone de clic, un focus visible et les états appropriés. Prévoir une cible pratique d'au moins 44 × 44 pixels CSS pour le tactile, indépendamment du dessin de 16–24 px. Utiliser un vrai bouton ou lien ; `onClick` sur le SVG ne fournit pas de comportement clavier. Ajouter un texte aux statuts ; la couleur seule ne constitue pas une information suffisante.

## 5. SVG bruts et intégration au thème

Le motif d'export `@mdevs/icons/svg/*` expose les assets. Copier le chemin physique `svg` du manifeste pour lire un fichier, mais retirer son extension pour le sous-chemin public : `@mdevs/icons/svg/controls/search` résout `svg/controls/search.svg`. L'export ajoute déjà `.svg` ; ne pas ajouter l'extension une seconde fois. Le chargeur du projet décide si un import d'asset renvoie une URL ou autre chose ; aucun composant SVGR ni déclaration d'asset TypeScript n'est fourni automatiquement.

Pour `<img>`, fournir `alt=""` en décoration ou un texte alternatif pertinent en information. Pour un SVG inline copié, gérer explicitement le rôle et le nom ou `aria-hidden`. Les fichiers bruts n'ont pas la logique de `title`, de ref ni d'ARIA du wrapper React. Un SVG externe chargé par `<img>` n'hérite pas du `currentColor` du bouton comme le composant inline.

Le contraste relève du projet. Vérifier les contours sur les surfaces Liquid Glass, en clair et sombre, sans supposer que le flou et les reflets donnent automatiquement un contraste suffisant. Le package ne retourne pas automatiquement les flèches en RTL.

## 6. Garder le bundle prévisible

Préférer l'import individuel lorsque le nombre d'icônes est faible ou la taille de bundle importante. `sideEffects: false` et `/* @__PURE__ */` facilitent l'élimination des exports inutilisés dans un bundler ESM, mais le résultat dépend de l'outil et de sa configuration. Une vérification esbuild du dépôt ne vaut pas validation de tous les bundlers.

Éviter de parcourir `import * as Icons` ou de résoudre `Icons[name]` depuis une chaîne arbitraire. Pour un choix dynamique connu, construire une table d'imports statiques explicites et typer sa clé. Les consommateurs CommonJS et les imports racine dynamiques peuvent charger beaucoup plus de modules. Mesurer le bundle de production du projet hôte si cela compte pour la livraison.

## 7. Modifier durablement la collection

Pour ajouter une icône locale au projet, utiliser `createIcon` et `IconNode` depuis `@mdevs/icons/core` ; ce procédé n'ajoute pas d'export au package. Pour changer la collection, suivre [catalog/docs/ICON_MAINTENANCE.md](catalog/docs/ICON_MAINTENANCE.md) ou `../../docs/ICON_MAINTENANCE.md` dans le monorepo.

- Modifier les géométries dans `scripts/data/icons.json`, la catégorisation et génération dans `scripts/generate.py`, le comportement partagé dans `src/create-icon.tsx`.
- Ne pas maintenir une correction uniquement dans `src/icons/**`, `svg/**`, les index ou le manifeste générés.
- Préserver un slug stable, un nom unique, la grille 24, la provenance et les licences. Ne pas compter une variante d'attribut ou un alias de dessin comme une nouvelle géométrie.
- Recalculer `geometryHash` avec la convention du générateur si les nœuds changent ; la génération depuis le snapshot ne le recalcule pas automatiquement.
- Lire le diff après régénération : la commande régénère les deux packages et ne purge pas tous les fichiers obsolètes.
- Si le décompte change, adapter les assertions exactes et les documents concernés. Le script de vérification compare le nombre de fichiers SVG au manifeste courant ; les tests de livraison 0.2.0 contrôlent l’inventaire attendu de 2 600.

## 8. Vérifier et rendre compte

Pour une intégration, exécuter le typecheck du projet hôte, vérifier les imports et la taille rendue, puis tester clavier, noms accessibles et callbacks du contrôle. Examiner à 320–375 px et au zoom ; vérifier le `currentColor` et le trait aux tailles réelles. Le monorepo fournit un exemple typé dans `examples/docs/icons-accessible-toolbar.tsx`, décrit dans le guide API.

Pour une modification de collection ou de wrapper, utiliser les contrôles du monorepo indiqués dans le guide de maintenance : génération, typecheck, tests, build et vérification des packages. Compléter par une revue visuelle adaptée aux changements. Ne pas annoncer Safari, Firefox, une version React ou un lecteur d'écran comme vérifiés sans les avoir effectivement contrôlés.

Dans le compte rendu, mentionner les imports choisis, les fichiers modifiés, les vérifications réalisées et les limites. Si une assertion manque, un asset n'est pas chargé ou une vérification n'a pas été exécutée, l'indiquer précisément plutôt que d'affirmer une compatibilité universelle.

## 9. Préserver les attributions

Conserver [NOTICE.md](NOTICE.md), `LICENSE`, `LICENSE-LUCIDE` et `LICENSE-TABLER` lors de toute redistribution. Le wrapper est MIT ; les géométries Lucide sont ISC avec les attributions MIT Feather applicables incluses dans leur licence ; Tabler est MIT. La collection n'est pas constituée de dessins originaux Mdevs. Une nouvelle source ou une montée de version requiert la mise à jour des avis et la vérification de provenance.

## 10. Méthode de dessin minimaliste

Décrire le sens et vérifier qu’un dessin équivalent n’existe pas dans le manifeste. Choisir un slug stable et un nom PascalCase terminé par Icon, sans collision avec un composant/core/type. Une forme retournée, recolorée ou épaissie ne suffit pas à créer une entrée comptée.

Dessiner sur 24 unités, centre visuel 12/12, marge générale d’environ 2 unités. Utiliser peu de nœuds et conserver une lisibilité à 16–20 px. Préférer paths/lignes/polylignes, rectangles et cercles ; pas de texte, bitmap, script, filtre, ombre, dégradé ou URL externe. `fill=none` est le défaut ; une ponctuation remplie issue d’un dessin amont reste monochrome.

Le trait de référence est 1,5, avec stroke-linecap/linejoin round. Les nœuds ne doivent pas introduire des couleurs spécifiques, épaisseurs contradictoires ou un style responsive privé. Le wrapper possède dimensions, couleur et accessibilité ; la géométrie possède les coordonnées. Comparer côte à côte 16/20/24/32/48 px, clair/sombre et densité d’écran réelle.

Pour créer une icône seulement dans l’application, importer `createIcon`/`IconNode` depuis le sous-chemin public core. Pour l’ajouter au package, enregistrer les nœuds dans `scripts/data/icons.json`, avec tags, source et geometryHash, puis régénérer. Les fichiers src/icons, svg et catalog sont des sorties. Si la géométrie est originale, actualiser générateur/NOTICE/licence pour cette source ; ne pas réutiliser les commentaires Lucide/Tabler par défaut comme attribution fausse.

Calculer SHA256 de `json.dumps(nodes, ensure_ascii=False, separators=(',', ':')).encode()` avec la même représentation que le snapshot. Vérifier unicité de l’empreinte, du slug et du nom. L’empreinte prouve une différence de sérialisation, pas automatiquement une différence visuelle ; examiner le dessin. Une édition de nœuds exige un recalcul, car generate_icons reprend le hash enregistré.

## 11. Noir/blanc et priorités de couleur

Le contour utilise `currentColor` et le SVG hérite du texte parent. Le thème et les boutons inversés déterminent ainsi son contraste. Le wrapper ne force aucune couleur ni `color-scheme` ; aucun CSS UI n'est requis pour cet héritage.

`color` et `style` sont transmis sans valeur imposée. `style.color` garde sa priorité CSS normale sur l'attribut `color`. Les autres attributs SVG sont toujours transmis après les défauts. Préserver la couleur du contrôle parent, notamment sur un bouton inversé ou un état informatif.

Ne pas confondre un SVG React inline avec un fichier chargé par img : les tokens du provider ne traversent pas le document externe. Les SVG bruts ont leur propre style monochrome et trait 1,5 ; pour suivre précisément le thème du projet, préférer le composant React. Aucun CSS UI ni police Inter n’est requis par le package Icons seul.

## 12. Validation d’une nouvelle collection

Conserver noms, chemins et géométries des anciennes entrées lorsque l’extension ne les modifie pas. Le seuil actuel de snapshot est 2 600 : une régénération avec une autre source peut changer la sélection, donc examiner la comparaison avant/après. Les versions amont restent Lucide 1.52.0 et Tabler 3.48.0 ; ne pas déduire une nouvelle version depuis le dossier local.

Vérifier XML/viewBox, nœuds permis, empreintes/noms uniques, absence de références externes, styles monochromes, rendu serveur, ref/title/ARIA, size et absoluteStrokeWidth. Garder une preuve visuelle représentative, en indiquant si toute la collection ou seulement des tailles/scènes ont été examinées. Les variations de taille/couleur ne comptent pas.

Dans le monorepo, générer, compiler, contrôler les contrats et consommateurs React 18/19, puis vérifier les documents et archives. Le contrôle navigateur doit mesurer la couleur calculée : la présence du texte currentColor ne démontre pas noir/blanc. Lire STYLE et les guides distribués pour les commandes, licences et limites de support CSS.
