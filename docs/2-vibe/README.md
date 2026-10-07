# Vibe

Vibe est la partie sociale de mAI : profils, publications, flux, interactions et fonctions IA. La source React/Vite se trouve dans apps/vibe ; le port est servi sous /vibe par l’application hôte.

## Parcours documentaires

- [Intégration dans mAI Web](INTEGRATION.md) : routage, session, services et sorties générées.
- [Architecture de la source](ARCHITECTURE.md) : frontend, backend et flux de données.
- [Application mobile](MOBILE_CAPACITOR.md) : client Capacitor propre à Vibe.
- [Styles et navigation](STYLING_ROUTING.md) : isolation du thème et URL.
- [Règles de développement](AGENTS.md) : sources à modifier et invariants du port.

La source autonome et son backend ont leur propre cycle de build. Le build Next racine ne les compile pas directement ; il génère les éléments du port selon les scripts du dépôt. Le README de la source est [apps/vibe/README.md](../../apps/vibe/README.md).
