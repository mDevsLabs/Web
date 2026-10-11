# Changelog

## Échelle des actions — 2026-10-11

- Boutons et actions compactes par défaut : `.md-button` 44 → 32 px (28 px en `sm`, 34 px en `lg`), `.md-icon-button` 44 → 32 × 32 px, `padding` et `gap` réduits d'autant. Le dimensionnement reprend les boutons de barre latérale de l'hôte (32 px, 10 px de côté, 13 px de texte).
- Passent avec les boutons : entrées de menu, actions de liste, liens de navigation, onglets, segments, en-têtes d'accordéon (36 px).
- Restent à 44 px : champs, interrupteurs, curseurs, lignes à cases, arborescence, étoiles — affords natifs et surfaces de saisie, pas des boutons.
- Les dimensions sont communes aux variantes `liquid-glass` et `chatgpt` : la variante ne porte plus que ce qui la distingue (aplat, survol, absence de flou).
- `STYLE.md`, `catalog/docs/{STYLE,ACCESSIBILITY,LIQUID_GLASS,ICONS}.md` et `llms-full.txt` réécrits en conséquence ; l'ancienne règle « 44 × 44 px » est abandonnée, la cible tactile revient au style hôte sur support tactile.
- Distribution : `dist/styles.css` est une concaténation manuelle de `src/styles.css` + `src/extensions.css` (aucun script de build du package, `package.json` a `scripts: null`) ; `components/wakies/wakies-ui.css` en dérive par `node scripts/build-wakies-css.mjs`.
- Les générateurs Python cités par `AGENTS.md` §10 et §12 (`scripts/foundations.py`, `scripts/extensions.py`, `scripts/generate.py`, `scripts/data/domains.txt`) n'existent pas dans ce dépôt : `src/**` est écrit à la main.

## Corrections locales — 2026-10-09

- Couleur des icônes héritée du contrôle ; dessins et indicateurs non comprimés dans les boutons.
- ScrollArea peut rétrécir en flex/grid ; le remplissage de Tooltip ne cible que sa flèche.

## 0.2.0 — 2026-10-05

- 100 composants ajoutés : 60 primitives et 40 compositions dans quatre domaines ; total 1 212.
- 500 géométries Tabler supplémentaires, sans doublon d’empreinte ; total 2 600, anciens noms/imports conservés.
- Inter variable 4.1 locale (WOFF2 normal 100–900, SIL OFL), embarquée dans le CSS UI.
- Défaut de flou réduit à 12 px ; surfaces aérées et nouvelles mises en page adaptatives.
- Icônes noir/blanc propres au thème et contour par défaut 1,5 px. Changement visuel : utiliser strokeWidth=2 et style.color=currentColor pour les anciens défauts explicites.
- STYLE.md et AGENTS enrichis avec méthodes d’enregistrement, contrats, géométrie, typographie et validation.
- Versions des manifests/noms ZIP calculés depuis les métadonnées ; guides, exemples et index reconstruits.


## Complément documentaire — 0.1.0, distribution locale

- Instructions AGENTS et guides détaillés : contrats, intégration, états, erreurs, focus, thèmes et maintenance.
- Fiches UI complètes, guides de domaine/catégorie, index documentation.json et consolidations llms-full.txt.
- Quatre exemples React typés et contrôles de liens, imports publics et exemples complets.
- Archives locales reconstruites avec les documents ; sources/CSS runtime inchangés.

## 0.1.0 — 2026-10-04

- Monorepo npm React/TypeScript avec @mdevs/ui et @mdevs/icons.
- 72 primitives et 1 040 composants métier dans 104 domaines.
- 2 100 icônes distinctes Lucide/Tabler, SVG bruts et composants React.
- Design Liquid Glass subtil, thèmes clair/sombre/système et replis opaques.
- Distribution ESM/CommonJS/déclarations, imports ciblés et catalogues JSON.
- Catalogue interactif, guides humains/agents IA et scripts de vérification/archivage.
