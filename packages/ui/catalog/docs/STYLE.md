# Mdevs — règles de style et méthodes de création

Ce document définit le style retenu pour `@mdevs/ui` et `@mdevs/icons` 0.2.0. Il accompagne le monorepo et chaque package. Les fichiers `STYLE.md` distribués et `catalog/docs/STYLE.md` proviennent de cette source ; les modifier via le dépôt, pas seulement dans une archive.

## 1. Décisions de conception

| Sujet | Règle retenue |
| --- | --- |
| Framework | React 18.3/19 et TypeScript strict ; imports nommés et modules indépendants |
| Surfaces | Liquid Glass discret : flou léger, reflet fin, contenu net |
| Espacement | Interface aérée, unités régulières, adaptation au contenu |
| Arrondis | 16–20 px pour les surfaces, 10–12 px pour les contrôles courants |
| Typographie | Inter variable 4.1, fournie localement en WOFF2 et chargée par le CSS UI |
| Icônes | SVG monochromes, grille 24 × 24, trait 1,5 px, extrémités et jointures arrondies |
| Thème des icônes | Noir en clair, blanc en sombre ; aucun dégradé ni ombre dans le dessin |
| Inventaire 0.2.0 | 1 212 composants = 132 primitives + 108 domaines × 10 familles ; 2 600 icônes |
| Extension de cette version | 60 nouvelles primitives + 40 compositions typées ; 500 géométries supplémentaires |

Un composant doit résoudre un besoin d’usage avec un contrat propre. Une couleur, une taille, un rayon ou un alias ne constitue pas un nouveau composant compté. Une nouvelle icône doit apporter une géométrie distincte ; un changement d’épaisseur ou de couleur ne crée pas une entrée supplémentaire.

## 2. Typographie Inter

Le fichier `packages/ui/src/fonts/inter-variable.woff2` vient du tag Inter `v4.1`. Son origine, sa licence et son SHA-256 sont enregistrés dans `src/fonts/metadata.json`. La licence complète est `LICENSE-INTER.txt`, sous SIL Open Font License 1.1. Le build copie le dossier vers `dist/fonts` et le CSS utilise une URL relative.

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('./fonts/inter-variable.woff2') format('woff2');
}
```

Le navigateur charge l’asset servi avec l’application, sans Google Fonts ni CDN imposé. L’absence de réseau tiers n’implique pas qu’un chargement HTTP depuis le serveur de l’application soit inutile : le bundler doit conserver/résoudre l’URL du WOFF2. Sous une CSP, autoriser sa propre origine dans `font-src` selon la politique du projet.

Le fichier livré couvre le style normal variable ; il ne fournit pas un fichier italique séparé. Le navigateur peut synthétiser l’italique. Ne pas annoncer des graisses statiques supplémentaires ou une version italique fournie sans ajouter leurs assets et métadonnées.

| Usage | Taille conseillée | Graisse | Hauteur de ligne |
| --- | --- | --- | --- |
| Texte courant | 14–16 px | 400 | 1,5–1,6 |
| Label de champ | 14 px | 500–600 | 1,4–1,5 |
| Bouton | 14–16 px | 500–600 | 1,2–1,4 |
| Aide/compteur | 12–14 px | 400 | 1,4–1,5 |
| Titre de section | 18–24 px | 600 | 1,25–1,35 |
| Titre de page | 28–40 px, fluide | 650 | 1,2 |
| Nombre/temps | Taille du contexte | 500–600 | Chiffres tabulaires si nécessaire |
| Code | Pile monospace locale | 400 | 1,6 |

Ces tailles sont des choix de composition, pas des breakpoints universels. Garder une hiérarchie lisible au zoom. Le code reste monospace ; ne pas appliquer Inter aux fragments qui nécessitent un alignement de caractères. Pour remplacer la police, surcharger `--md-font` dans le périmètre voulu et gérer ses propres fichiers/licences.

## 3. Anatomie du Liquid Glass

Une surface combine un fond opaque de secours, une couche translucide, un reflet de bordure, un contour de 1 px et une ombre douce. Le flou s’applique au fond, jamais au texte. Le reflet ne doit pas devenir un élément capturant le clic.

| Token | Défaut clair | Sombre | Rôle |
| --- | --- | --- | --- |
| `--md-font` | Inter puis polices système | Même pile | Typographie |
| `--md-icon-color` | `#000` | `#fff` | Noir/blanc des icônes |
| `--md-blur` | `12px` | `12px` | Flou discret |
| `--md-radius` | `20px` | `20px` | Surfaces |
| `--md-input-radius` | `12px` | `12px` | Contrôles |
| `--md-surface` | `rgba(255,255,255,.76)` | `rgba(30,42,61,.83)` | Translucence |
| `--md-solid` | `#fff` | `#1e2a3d` | Fond opaque |
| `--md-border` | `rgba(85,105,141,.22)` | `rgba(182,203,237,.22)` | Contour |
| `--md-highlight` | `rgba(255,255,255,.92)` | `rgba(255,255,255,.13)` | Reflet |
| `--md-text` | `#182339` | `#f3f6fc` | Texte UI |
| `--md-muted` | `#536079` | `#b5c1d4` | Texte secondaire |
| `--md-accent` | `#4f46e5` | Même valeur par défaut | Actions et choix actifs |
| `--md-focus` | `#4338ca` | `#a5b4fc` | Focus visible |
| `--md-motion` | `160ms` | `160ms` | Transition courte |

Les tokens d’état succès/erreur/attention et les ombres sont détaillés dans le guide Liquid Glass. L’interface peut employer ces couleurs sémantiques ; les dessins d’icônes restent monochromes par défaut. Ne pas ajouter plusieurs couches de flou pour rendre un composant plus distinctif.

Utiliser `md-glass` pour une surface de verre et les tokens existants pour les contrôles. `glass={false}`, le fallback sans `backdrop-filter` et la préférence de transparence réduite rendent opaques les surfaces `md-glass` ; d’autres contrôles peuvent garder un fond légèrement translucide. Vérifier le fond réel de l’application.

Les règles sont dans `@layer mdevs`. Les styles non stratifiés du projet peuvent les remplacer. Le système ne fournit pas un reset complet du document. Les nouvelles règles UI sont dans `src/extensions.css`, concaténées au CSS principal pendant le build ; l’utilisateur continue d’importer une seule feuille publique.

## 4. Espacement, responsivité et interactions

Employer une grille d’espacement de 4 px : 4, 8, 12, 16, 20, 24, 32. Un groupe de formulaire dispose normalement de 16 px entre champs et de 20 px de padding. Les actions et le contenu doivent revenir à la ligne lorsque leur mesure augmente.

Utiliser `min-width:0` dans les panneaux flex/grid, `minmax(0,1fr)` pour les colonnes et une région locale de défilement pour les tables/code. Ne pas masquer un débordement de page par `overflow-x:hidden` pour faire passer un test. Les layouts nouveaux s’empilent sous 640 px lorsque leur structure le demande ; les composants ne détectent pas un appareil par user-agent.

Une action principale garde une cible pratique de 44 × 44 px. Certains contrôles compacts, comme les suppressions de filtre, utilisent 36 px dans cette version ; agrandir selon le contexte tactile. Une icône de 20 px n’est pas une zone de clic de 20 px. Ne pas réduire l’anneau de focus pour obtenir un rendu plus discret.

Préférer les contrôles HTML natifs lorsque leur contrat suffit. La combobox spécialisée conserve le focus sur son input et utilise `aria-activedescendant` ; les listes simples et le master/detail utilisent leurs éléments natifs sans recevoir un rôle ARIA complexe arbitraire. Les dialogues/menu utilisent Radix et les tokens de `PortalScope`.

Les animations restent courtes et facultatives. Respecter `prefers-reduced-motion`, ne pas dépendre d’une animation pour annoncer un état et ne pas animer le flou en continu. L’ouverture d’un contrôle ne doit pas déclencher un accès réseau sans action/décision du parent.

## 5. Méthode de création d’un composant

1. Décrire l’usage, les données, l’action, l’état vide et les limites. Chercher le manifeste pour éviter un doublon/alias.
2. Choisir le propriétaire de chaque état. Une valeur contrôlée exige un callback qui permet au parent de la mettre à jour. Une valeur initiale est documentée comme telle.
3. Écrire un contrat `<Nom>Props` explicite avec les types HTML adaptés. Exclure les événements natifs qui entreraient en collision avec un callback métier.
4. Définir HTML/ARIA, nom accessible, focus, clavier et comportement au démontage avant les détails du reflet.
5. Réutiliser les tokens et les utilitaires, puis prévoir les variantes de couleur/taille en props sans multiplier les exports comptés.
6. Enregistrer l’implémentation dans sa source durable et fournir une fixture JSON, les callbacks obligatoires, le comportement réel et l’état de démonstration.
7. Régénérer, compiler, tester l’interaction concernée, vérifier les documents et examiner la distribution.

Les 72 primitives initiales sont dans `scripts/foundations.py`. Les 60 ajouts 0.2.0 sont enregistrés dans `scripts/extensions.py` puis intégrés à `COMPONENTS`. Un module généré dans `packages/ui/src/primitives` n’est pas la source durable. Les comportements partagés `internal/*` et les CSS sont édités directement dans leurs sources.

Voici un exemple de **nouvelle définition à enregistrer**, pas un export déjà livré :

```python
component('FieldHint', 'Aide explicite liée à un identifiant de champ.', '''
export interface FieldHintProps extends HTMLAttributes<HTMLParagraphElement> {
  forId: string;
  children: ReactNode;
}
export function FieldHint({forId, children, className, ...props}: FieldHintProps) {
  return <p {...props} id={`${forId}-hint`} className={cx('md-muted',className)}>
    {children}
  </p>;
}
''', {'forId':'project-name','children':'Un nom reconnaissable.'},
behavior='Le parent lie aria-describedby au champ ; ne pas dupliquer le hint de Field.')
```

Le générateur apporte les imports du préambule, produit le module et l’index, puis ajoute l’entrée au manifeste. `callbacks` contient les callbacks nécessaires à une fixture utilisable ; `demoState` associe une prop contrôlée à son callback. Exemple pour un éditeur de chaîne : `callbacks=['onValueChange']`, `demoState={'value':'onValueChange'}`. Les callbacks non reliés à un état illustrent une intention et doivent être raccordés dans l’application.

Le générateur documentaire lit l’AST TypeScript pour extraire contrats/défauts/callbacks et produit une fiche complète. Les types/source restent la référence. Ne pas mettre une fonction dans `sampleProps`, qui doit rester sérialisable en JSON ; ne pas prétendre qu’un callback `console.log` sauvegarde des données.

### Créer une composition typée

Ajouter une ligne dans `scripts/data/domains.txt` avec modèle, libellé, champs typés, statuts et exemple. Le nom, le slug et les types doivent être uniques. Les nouveaux modèles 0.2.0 sont `FormSubmission`, `SavedFilter`, `RouteDefinition` et `TablePreset`.

La génération produit dix familles par modèle. Elles partagent les rendus `Domain*` ; cela doit rester annoncé dans le comptage. Les formulaires métier sont natifs et non contrôlés, leurs nombres sont convertis, `id` n’est pas soumis et le parent gère erreurs/attente/persistance. Ne pas transformer un domaine en intégration de service implicite.

## 6. Méthode de dessin d’une icône

Commencer par le sens à communiquer et chercher les noms existants. Une nouvelle géométrie conserve `viewBox="0 0 24 24"`, un centre visuel autour de 12/12 et généralement une marge d’environ 2 unités. Examiner les courbes et extrémités plutôt que pousser les traits contre le bord.

- Trait de référence : 1,5 unité sur la grille 24, arrondi aux extrémités et jointures.
- Privilégier quelques `path`, `line`, `polyline`, `polygon`, `rect`, `circle` ou `ellipse`.
- Garder le fond transparent et `fill="none"` comme défaut. Une ponctuation ponctuelle remplie peut être nécessaire dans une géométrie amont ; ne pas inventer une version pleine comme alias compté.
- Aucun dégradé, ombre, filtre, bitmap, texte incorporé, script ou référence réseau dans le SVG.
- Éviter les détails qui disparaissent à 16 px ; comparer à 16, 20, 24, 32 et 48 px.
- La couleur est portée par le wrapper/contexte, pas par des couleurs spécifiques dans chaque nœud.

Exemple de géométrie **locale**, qui n’ajoute pas d’export au package :

```tsx
import {createIcon, type IconNode} from '@mdevs/icons/core';

const reviewTray: IconNode = [
  ['path', {d:'M4 5h16v14H4z'}],
  ['path', {d:'M4 13h5l2 3h2l2-3h5'}],
  ['path', {d:'M9 9h6'}],
];
export const LocalReviewTrayIcon = createIcon('LocalReviewTrayIcon', reviewTray);
```

Pour l’ajouter à la collection, enregistrer slug, nœuds, tags, source et empreinte dans `scripts/data/icons.json`, puis régénérer. Ne pas attribuer une provenance Mdevs à un dessin Lucide/Tabler. Une source originale nouvelle demande aussi de mettre à jour le générateur/notice pour que les commentaires et licences reflètent cette provenance ; les commentaires actuels des modules ciblent Lucide/Tabler.

L’empreinte doit suivre exactement la convention existante :

```python
import hashlib, json
geometry_hash = hashlib.sha256(
    json.dumps(nodes, ensure_ascii=False, separators=(',', ':')).encode()
).hexdigest()
```

Cette empreinte élimine une représentation identique du snapshot, pas toutes les équivalences visuelles entre chemins SVG différents. Préserver l’ordre des nœuds/attributs lorsqu’on veut préserver une empreinte. Vérifier aussi les collisions entre slugs, noms PascalCase et fichiers. La régénération du snapshot à partir des sources amont utilise un seuil de 2 600 entrées en 0.2.0 ; réévaluer ce seuil pour une extension volontaire.

## 7. Couleur, accessibilité et adaptation SVG

Le wrapper utilise `stroke="currentColor"` avec une couleur propre noir/blanc. Sous UI, `--md-icon-color` suit le thème du provider, y compris dans les portails. Sans CSS UI, `light-dark(#000,#fff)` et `color-scheme:light dark` suivent le système lorsque le navigateur les prend en charge. `color="#000"` fournit le repli ; pour un ancien navigateur en sombre, fournir explicitement une couleur blanche.

Les props natives restent des possibilités de personnalisation : `color` modifie la couleur choisie, `style.color` a priorité dans la fusion, et `stroke` ou des règles CSS peuvent changer le rendu. Ces exceptions préservent l’intégration mais ne doivent pas être utilisées par un agent pour introduire des icônes colorées dans une création conforme au style. Pour un bouton noir/blanc inverse, utiliser la couleur de texte du contrôle ou une valeur blanche/noire explicite afin de conserver le contraste.

```tsx
import {Button, ThemeProvider} from '@mdevs/ui';
import {ArrowRightIcon, SearchIcon} from '@mdevs/icons';
import '@mdevs/ui/styles.css';

<ThemeProvider theme="light">
  <SearchIcon size={24} title="Recherche"/>
  <Button>Continuer <ArrowRightIcon size="1em" style={{color:'currentColor'}}/></Button>
</ThemeProvider>
```

Sans nom, le SVG est décoratif. Avec `title` ou une stratégie ARIA valide, il devient informatif. Dans un bouton, nommer le bouton et laisser le SVG décoratif. Les props ARIA explicites sont appliquées après les défauts et peuvent les remplacer ; ne pas produire un title utile et `aria-hidden=true` à la fois.

`size` accepte nombre, px, em, rem et pourcentage ; un pourcentage demande un parent dimensionné. `absoluteStrokeWidth` ajoute `non-scaling-stroke` aux nœuds générés, pas aux children ajoutés. La zone tactile appartient au contrôle parent. Le RTL n’est pas retourné automatiquement.

Les SVG bruts ont aussi un trait 1,5 et un style monochrome. Un `<img>` externe n’hérite pas des variables d’un provider comme un SVG inline ; il suit son propre document et son support CSS. Pour adapter précisément le thème d’une application, préférer le composant React. Le sous-chemin public brut omet `.svg`, par exemple `@mdevs/icons/svg/controls/search`.

## 8. Vérification et livraison

Pour une nouvelle création, adapter les tests aux comportements réels : succès/échec, valeurs vides/zéro, clavier, focus, callbacks contrôlés, cleanup de timer, données stables et état disabled. Ne pas écrire une assertion qui ne fait que reproduire le nom d’une classe comme preuve d’interaction.

```sh
npm run generate
npm run verify
npm run test:browser
```

Le navigateur demande un catalogue compilé et servi ; consulter le guide de vérification pour préparer le serveur. `verify` construit les distributions puis vérifie documents/exemples, types, tests et consommateurs React 18/19. Ne pas publier sur npm comme conséquence automatique de ces commandes.

Vérifier visuellement clair/sombre/verre désactivé, 320–375 px, focus et mouvement réduit. Confirmer la requête de police locale et le chargement d’Inter réel, pas uniquement le texte `font-family`. Pour les icônes, vérifier la couleur calculée et les marges, pas seulement le mot currentColor dans le fichier.

Les sources de génération, manifests, docs, assets/licences et distributions doivent être cohérents avant d’empaqueter :

```sh
npm run docs:build
npm run docs:check
npm run pack:packages
npm run release:zip
node scripts/check-zips.mjs
```

La génération ne purge pas toutes les sorties retirées. Examiner les anciens fichiers après un renommage/suppression. Les ZIP se créent depuis les fichiers présents, tandis que les tarballs respectent `package.json#files` ; contrôler les deux. Un fichier Inter ou une notice manquants dans un tarball est un défaut de livraison même si le catalogue local affiche la police.
