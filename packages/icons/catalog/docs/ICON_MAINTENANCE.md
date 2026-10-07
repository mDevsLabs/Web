# Maintenance de @mdevs/icons

Ce document concerne les contributeurs au monorepo. Pour intégrer le package sans changer sa collection, suivre [ICONS.md](ICONS.md). Les commandes ci-dessous décrivent la procédure de travail ; elles ne sont pas un journal de validations déjà exécutées.

## 1. Sources de vérité et fichiers générés

| Élément | Rôle et lieu de modification |
| --- | --- |
| `scripts/data/icons.json` | Snapshot de géométries, tags, provenance et empreintes ; source locale de la collection. |
| `scripts/generate.py` | Sélection des sources, catégories, noms, exports et génération des SVG/modules. |
| `packages/icons/src/create-icon.tsx` | Wrapper React partagé ; source écrite à la main pour props, ARIA, refs et rendu. |
| `packages/icons/src/icons/**` | Modules et index générés ; ne pas maintenir une correction uniquement ici. |
| `packages/icons/svg/**` | SVG bruts générés depuis le même snapshot. |
| `packages/icons/catalog/manifest.json` | Catalogue généré ; pas une entrée de données à éditer manuellement. |
| `packages/icons/package.json` | Métadonnées du package ; le champ `exports` est reconstruit par le générateur. |
| `packages/icons/LICENSE*`, `NOTICE.md` | Textes de licence et attribution à conserver, vérifier et compléter si la provenance évolue. |
| `docs/ICONS.md`, `docs/ICON_MAINTENANCE.md` | Documentation source ; les copies livrées dans les packages sont synchronisées par la procédure de livraison. |

`npm run generate` régénère **les deux packages**, puis lance le formateur. Il ne vise pas seulement les icônes. Examiner le diff complet et conserver les modifications préexistantes des autres contributeurs. Le générateur écrit les nouveaux fichiers mais ne purge pas tous les anciens fichiers de source/SVG : lors d'un retrait ou d'un déplacement, traiter aussi les fichiers devenus orphelins et vérifier les exports.

## 2. Créer une icône locale sans modifier le catalogue

Une application peut déclarer sa propre icône avec l'export public de fabrication. L'exemple suivant crée un composant **local au projet hôte**, pas un nouvel export du package :

```tsx
import {createIcon, type IconNode} from '@mdevs/icons/core';

const projectDiamondNodes = [
  ['path', {d: 'M12 3 21 12 12 21 3 12Z'}],
] as const satisfies IconNode;

export const ProjectDiamondIcon = createIcon('ProjectDiamondIcon', projectDiamondNodes);
```

`IconNode` est une liste de tuples `[tag, attributs]`, avec valeurs `string | number`. Elle décrit ici des nœuds SVG plats. Le wrapper reprend les mêmes props et refs que les icônes livrées. Employer des attributs au format React (`strokeLinecap`, `fillRule`, `vectorEffect`) pour ces nœuds locaux. `createIcon` n'ajoute aucun fichier, manifeste, export de package ni attribution automatiquement.

Préserver une grille 24 × 24, laisser une marge suffisante pour les traits, préférer des formes peu nombreuses et des jointures arrondies, et vérifier le dessin aux tailles 16, 20, 24 et 32. Le contour par défaut est `currentColor`, `fill="none"`, `strokeWidth={1.5}`. Pour une nouvelle géométrie originale, ne pas copier une forme tierce en lui attribuant une provenance Mdevs.

## 3. Ajouter ou modifier une entrée du snapshot

Avant toute modification, relever le nom public et le sous-chemin existants. Changer un `slug` modifie généralement l'identifiant React, les chemins d'import et le fichier SVG ; changer un mot qui pilote la catégorisation peut aussi déplacer l'export. Ces changements doivent être décrits dans le changelog et la documentation d'intégration.

Une entrée du snapshot possède la forme suivante :

```json
{
  "slug": "search",
  "nodes": [
    ["path", {"d": "m21 21-4.34-4.34"}],
    ["circle", {"cx": "11", "cy": "11", "r": "8"}]
  ],
  "tags": ["find", "scan", "magnifier"],
  "source": "lucide",
  "geometryHash": "7ef625bc9cd6f86bafe04b5b707937af56db855eeb74894d275f2b56b5d3c42e"
}
```

Ce fragment reprend une géométrie livrée et son empreinte ; il ne doit pas être ajouté une seconde fois. Conserver les attributs XML du snapshot (`stroke-width`, par exemple) : le générateur les convertit au format React pour les modules tout en produisant le SVG brut depuis les mêmes données.

Procédure d'ajout :

1. Rechercher le sujet, le `slug` et les géométries proches dans le snapshot et le manifeste. Éviter les alias, les noms en collision et les copies comptées comme nouvelles icônes.
2. Déterminer la source réelle, sa version et sa licence. Pour une géométrie Lucide/Tabler, conserver l'attribution et le texte de licence correspondant. Une nouvelle source requiert aussi un traitement explicite des notices et métadonnées ; le pipeline actuel documente deux sources.
3. Introduire les nœuds plats, les tags utiles, le `slug` stable et la provenance dans le snapshot. Vérifier que les attributs se sérialisent en SVG XML valide. La génération de XML actuelle est prévue pour les attributs de ces snapshots amont ; contrôler le résultat si de nouvelles valeurs contiennent des guillemets ou des caractères spéciaux.
4. Calculer l'empreinte sur **la représentation exacte des nœuds** avec la convention du générateur : JSON UTF-8 compact, `ensure_ascii=False`, séparateurs `(',', ':')`, puis SHA-256. Ne pas réutiliser le hash d'un dessin différent.
5. Régénérer et vérifier les nouveaux modules, exports, SVG, manifeste et catégories. Le wrapper est partagé ; une nouvelle entrée ne doit pas en fournir une copie divergente.
6. Adapter les nombres attendus par les contrôles si la collection évolue, puis écrire un changelog fidèle et vérifier les licences des archives finales.

Calcul d'une empreinte, à partir d'une entrée déjà chargée en Python :

```python
import hashlib
import json

encoded = json.dumps(entry['nodes'], ensure_ascii=False, separators=(',', ':')).encode('utf-8')
entry['geometryHash'] = hashlib.sha256(encoded).hexdigest()
```

Le hash n'est pas une preuve universelle d'équivalence ou de différence visuelle : l'ordre des nœuds, la syntaxe d'un `path` et l'ordre des attributs font partie de sa représentation. La sélection courante exclut les alias détectés par cette convention et son intégrité est contrôlée. Pour une nouvelle collection, comparer aussi les rendus visuels et ne pas gonfler le décompte avec une forme identique encodée autrement.

### Noms et catégories

`pascal(slug) + 'Icon'` produit le nom exporté. Les séparateurs tiret, underscore et espace sont retirés par cette transformation ; deux slugs distincts peuvent donc produire le même identifiant. `generate_icons` refuse une collision d'identifiants, mais cela ne remplace pas la vérification des fichiers et des géométries.

La catégorie est déduite des règles ordonnées `CATEGORY_WORDS` dans `scripts/generate.py`. Malgré la signature `category(name, tags)`, les règles actuelles s'appuient sur le nom ; les tags ne déterminent pas le classement. Les termes non reconnus vont dans `misc`. Ne pas déplacer seulement un fichier pour changer une catégorie : ce déplacement serait défait à la prochaine génération.

La génération à partir du snapshot recopie son champ `geometryHash` ; elle ne le recalcule pas et ne vérifie pas elle-même toutes les collisions de géométrie. Mettre à jour le hash lorsqu'on modifie `nodes` et exécuter les contrôles d'intégrité.

## 4. Rafraîchir les sources amont

Le build normal utilise le snapshot local, sans téléchargement. Un rafraîchissement explicite accepte des dossiers amont déjà disponibles :

```sh
python3 scripts/generate.py --lucide /chemin/lucide-static --tabler /chemin/tabler-icons
```

Les **deux** options doivent être présentes pour activer le renouvellement du snapshot. Le pipeline attend :

- Lucide : `icons/*.svg`, `tags.json` et `LICENSE`.
- Tabler : `icons.json`, `tabler-nodes-outline.json` et `LICENSE`.

Vérifier les versions et l'origine de ces dossiers avant utilisation. La fonction de snapshot contient actuellement les versions littérales **1.52.0** et **3.48.0** : fournir une autre version sans adapter cette fonction produirait des métadonnées inexactes. Une montée de version requiert donc une modification explicite du générateur et des notices, avec revue des différences de géométrie et d'API.

La sélection commence par les SVG Lucide triés, en écartant les empreintes déjà vues. Elle complète ensuite avec Tabler par rotation entre catégories amont, jusqu'à atteindre le seuil actuel de 2 600. Les marques `brand-*`, certains motifs numériques/alphabétiques et les slugs déjà pris sont filtrés dans cette étape Tabler. Ce mécanisme n'est pas un import complet des deux bibliothèques. Un nouvel ensemble amont peut changer les noms retenus ou dépasser les hypothèses de décompte ; comparer le manifeste avant/après.

Le rafraîchissement recopie les licences amont. Relire `NOTICE.md` et conserver les attributions Feather incluses dans la licence Lucide. Vérifier que chaque `source` du manifeste correspond à la provenance réelle de ses nœuds.

## 5. Validation adaptée à la modification

Pour un guide ou un exemple uniquement, vérifier les imports contre le manifeste et exécuter le typecheck des exemples. Ne pas régénérer la collection pour une simple réécriture documentaire.

Pour une géométrie, un export ou le wrapper, les contrôles pertinents sont :

```sh
npm run generate
npm run typecheck
npm test
npm run build
node scripts/verify.mjs
```

La suite comporte notamment des contrôles de rendu serveur des 2 600 exports, de noms et empreintes distincts, d'ARIA décoratif, de titres à ID unique, de validité XML et de `viewBox`, ainsi qu'un test esbuild d'élimination d'une icône inutilisée. Le script de vérification teste aussi les packages installés en React 18/19 et les exports ESM/CJS. Le contrôle XML exige un nombre de SVG égal au manifeste ; les assertions de livraison vérifient aussi l’inventaire prévu. Une extension réelle met à jour les données, manifests, tests et guides, sans masquer des sorties résiduelles.

Compléter par une revue visuelle dans le catalogue : tailles 16/20/24/32, clair/sombre, currentColor, qualité des traits, icône isolée et bouton réel. Pour une modification ARIA, examiner l'arbre d'accessibilité et tester au clavier les contrôles hôtes ; pour une modification de stroke ou de mise à l'échelle, vérifier les navigateurs ciblés par le projet. Un rendu serveur valide ne démontre pas à lui seul la qualité visuelle ou l'accessibilité avec chaque lecteur d'écran.

## 6. Livraison et compte rendu

Construire les fichiers `dist` avant d'archiver. Les scripts du monorepo pour les paquets et ZIP sont `npm run pack:packages` et `npm run release:zip`. Ils n'effectuent pas de publication npm distante.

Avant la livraison, vérifier que les archives contiennent les sources, les distributions, le catalogue, les documents d'intégration, `AGENTS.md`, `llms.txt` et toutes les licences. Les copies documentaires sous `catalog/docs` doivent correspondre aux documents source ; leur synchronisation appartient à la préparation de la livraison.

Dans le compte rendu, indiquer la modification réellement faite, les fichiers source concernés, les noms ajoutés/retirés, les changements d'import, les sources et versions, les contrôles exécutés et les limites restantes. Distinguer les tests automatisés du dépôt des vérifications visuelles ou navigateurs réellement effectuées. Une compilation réussie ne justifie pas d'annoncer une validation de tous les appareils.
