# Changelog

## Corrections locales — 2026-10-09

- Les SVG héritent à nouveau du texte parent : contraste des boutons, thèmes et états préservé. Props `color`, `style`, ARIA et épaisseur inchangées.

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
