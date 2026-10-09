# Liquid Glass — tokens, surfaces et règles visuelles

Le système exprime un verre subtil par translucence, reflet, bordure et ombre. Le contenu reste prioritaire. Il utilise CSS et `backdrop-filter` lorsqu’il est disponible ; il ne déforme pas physiquement le fond et ne simule pas une réfraction optique.

## 1. Anatomie d’une surface

| Couche | Mise en œuvre | Effet |
| --- | --- | --- |
| Fond de secours | --md-solid | Surface lisible sans flou |
| Translucence | --md-surface | Laisse deviner le fond sans rendre le texte transparent |
| Reflet | Dégradé diagonal + inset supérieur | Lumière douce sur la bordure haute |
| Contour | Bordure 1 px --md-border | Sépare le contenu de son environnement |
| Diffusion | Blur 12 px, saturation 145 % | Adoucit le fond derrière la surface |
| Relief | --md-shadow | Détache la surface avec une ombre diffuse |
| Forme | Rayon 20 px | Cohérence des cartes et panneaux |

Le reflet fait partie du fond CSS : il ne crée pas un calque cliquable au-dessus du contenu. `isolation:isolate` aide à contenir les empilements internes. Une surface de verre ne rend pas un élément interactif : une carte de données reste une région/article, et un bouton garde sa sémantique propre.

## 2. Tokens publiés dans styles.css

| Token | Défaut clair | Sombre explicite | Usage |
| --- | --- | --- | --- |
| --md-font | Inter locale puis polices système | Même pile | WOFF2 variable embarquée ; aucune police depuis un domaine tiers |
| --md-icon-color | #000 | #fff | Icônes monochromes selon le thème |
| --md-accent | #4f46e5 | Hérité du même défaut | Actions, progression et choix actifs |
| --md-accent-ink | #fff | #fff | Texte des boutons pleins |
| --md-bg | #f4f6fb | #101724 | Fond d’application conseillé |
| --md-text | #182339 | #f3f6fc | Texte principal |
| --md-muted | #536079 | #b5c1d4 | Texte secondaire |
| --md-solid | #fff | #1e2a3d | Fond opaque |
| --md-surface | rgba(255,255,255,.76) | rgba(30,42,61,.83) | Fond translucide |
| --md-border | rgba(85,105,141,.22) | rgba(182,203,237,.22) | Contour et séparations |
| --md-highlight | rgba(255,255,255,.92) | rgba(255,255,255,.13) | Reflet supérieur |
| --md-shadow | Ombres bleu/gris diffuses | Ombres noires diffuses | Relief ; lire le CSS pour les valeurs complètes |
| --md-blur | 12px | 12px | Flou de la surface |
| --md-radius | 20px | 20px | Rayon des surfaces |
| --md-input-radius | 12px | 12px | Rayon des contrôles |
| --md-focus | #4338ca | #a5b4fc | Anneau de focus |
| --md-success | #166534 | #86efac | États positifs |
| --md-danger | #b91c1c | #fca5a5 | Erreurs/destruction |
| --md-warning | #854d0e | #fde047 | Attention |
| --md-motion | 160ms | 160ms | Transitions courtes |

Inter variable 4.1 est désormais embarquée en WOFF2 normal (100–900) et chargée par le CSS avec font-display:swap. Le bundler résout une URL relative vers dist/fonts ; aucun CDN de police n’est imposé. LICENSE-INTER.txt et les métadonnées de source/SHA256 accompagnent le package. Les polices système prennent le relais si le chargement local échoue.

## 3. Personnaliser à travers ThemeProvider

```tsx
import type {CSSProperties} from 'react';
import {GlassCard, ThemeProvider} from '@mdevs/ui';

const glassTokens = {
  '--md-blur':'12px',
  '--md-input-radius':'10px',
  '--md-accent-ink':'#ffffff',
} as CSSProperties;

<ThemeProvider theme="dark" accent="#4f46e5" radius="18px" style={glassTokens}>
  <GlassCard title="Suivi du projet" description="Reflets doux et contenu net.">
    Avancement et actions du projet.
  </GlassCard>
</ThemeProvider>
```

Les props `accent` et `radius` ont priorité sur les tokens correspondants dans `style`. Les variables CSS de cette prop sont transférées aux portails. Les propriétés de layout ordinaires ne le sont pas. Pour des overrides en CSS sur un ancêtre externe, transmettre aussi les variables nécessaires via `style` si un dialogue ou menu doit conserver le même thème.

Un ThemeProvider imbriqué crée un nouveau périmètre de thème. `theme` vaut `system` par défaut ; il ne signifie pas « reprendre le thème explicite du parent ». Spécifier les valeurs voulues et vérifier les overlays de chaque périmètre.

## 4. Choisir le fond hôte

Le verre révèle le contenu derrière lui. Sur un fond neutre, la transparence reste discrète ; sur une image fortement contrastée, le texte peut devenir moins lisible malgré le flou. Le fond de page appartient à l’application, pas au package.

Réserver les textures ou dégradés aux zones qui ne perturbent pas les informations. Pour une région riche en données, préférer une surface plus opaque ou `glass={false}`. Si l’accent est modifié, vérifier le couple accent/texte : un jaune clair avec un texte blanc n’est pas corrigé automatiquement par ThemeProvider.

Ne pas réduire l’opacité de tout un conteneur pour créer de la translucence : cela réduit aussi celle du texte et des contrôles. Modifier le token de surface et garder le texte net.

## 5. Anatomie et espacement

- GlassSurface fournit une surface et un padding none/sm/md/lg.
- GlassCard organise titre, description, actions, contenu et footer.
- GlassPanel utilise details/summary pour une région repliable.
- Stack organise verticalement ; Cluster aligne et revient à la ligne.
- Grid utilise des colonnes fluides avec largeur minimale configurée.
- Container limite la mesure et centre le contenu.

La plupart des champs et boutons principaux ont une hauteur minimale de 44 px. Les textes secondaires sont compacts ; adapter la densité au public et au support sans réduire la zone d’action à la taille d’une icône.

Les attributs HTML et `style` restent utiles pour la composition. Éviter de cibler un détail privé de DOM quand un token ou une prop publique exprime déjà le besoin. Si la modification change le comportement du rendu commun, la traiter comme changement de composant et vérifier les usages concernés.

## 6. Cascade CSS

Les règles sont sous `@layer mdevs`. Des règles non stratifiées de l’application ont priorité sur une couche nommée. Un reset qui enlève toutes les bordures, couleurs ou styles de focus peut donc remplacer l’apparence attendue.

Quand le CSS semble absent : vérifier d’abord l’import et les styles calculés, puis les règles hôtes. Le fichier n’impose pas Tailwind ni une solution CSS-in-JS. Les classes `md-*` servent au système ; la personnalisation courante passe par tokens, props et classes de l’application.

## 7. Portails et empilement

Les overlays de Radix sont montés dans un portail. `PortalScope` recrée le périmètre de tokens via un élément `display:contents`. Les niveaux actuels sont définis dans le CSS : overlay 1000, dialogue/tiroir 1001, popover/menu 1002, tooltip 1003, notifications 1010.

Ces nombres sont des détails d’implémentation actuels, pas une promesse de politique d’empilement pour toute application. Si un header ou outil hôte doit passer devant, examiner les stacking contexts et le besoin d’usage. Les wrappers ne fournissent pas une prop générique de conteneur de portail.

Les customisations de focus, titres et descriptions sont décrites dans [OVERLAYS](OVERLAYS.md) et [ACCESSIBILITY](ACCESSIBILITY.md).

## 8. Préférences et replis

| Condition | Réponse du système |
| --- | --- |
| backdrop-filter indisponible | Fond opaque --md-solid sur .md-glass |
| ThemeProvider glass=false | .md-glass opaque, flou retiré |
| prefers-reduced-motion: reduce | Animations et transitions retirées |
| prefers-reduced-transparency: reduce reconnu | Flou retiré, fond opaque sur .md-glass |
| forced-colors: active | Couleurs système et contours adaptés |
| theme=system | Media query de couleur sombre selon le système |

Ces replis ciblent les surfaces `.md-glass` : ils ne retirent pas tous les fonds translucides des autres contrôles, par exemple Input ou Alert. `prefers-reduced-transparency` n’est pas uniformément reconnu ; le contrôle explicite `glass=false` reste disponible. Les replis ne garantissent pas à eux seuls le contraste de chaque fond d’application. Examiner les styles calculés dans les modes concernés.

## 9. Performance sur appareil mobile

Chaque `backdrop-filter` peut ajouter un coût de composition graphique. Le catalogue est paginé pour limiter le nombre de surfaces visibles. Sur un appareil peu puissant ou une liste dense, choisir le mode opaque et limiter les couches de verre imbriquées.

Les transitions sont courtes ; le contenu ne doit pas dépendre d’une animation pour être compris. Une SVG vectorielle reste nette sur écran haute densité, mais le raster du fond et le flou ont leurs propres coûts.

Pour une comparaison, tester le même parcours avec `glass=true` et `glass=false`. Examiner le défilement, l’ouverture d’overlays et les interactions répétées sur l’appareil cible. La taille du bundle du catalogue complet n’est pas représentative d’un import ciblé dans une application.

## 10. Contrôle d’une personnalisation

1. Vérifier les tokens calculés en clair, sombre et système.
2. Lire le texte principal/secondaire sur les fonds réellement utilisés.
3. Parcourir au clavier les actions et champs : focus visible et non coupé.
4. Ouvrir un overlay : thème et variables cohérents avec son provider.
5. Réduire largeur et mouvement ; vérifier le défilement local des tables.
6. Désactiver le verre pour confirmer un repli exploitable.
7. Vérifier les couleurs forcées si elles font partie du public cible.

Ces vérifications concernent la composition réelle de l’application. Les captures et rapports de la livraison initiale donnent des preuves sur le catalogue livré, pas sur tout fond ajouté ensuite.
