# Site officiel mAI

Cette section documente le port du Site officiel dans l’application hôte, sous /site. La source autonome correspondante est dans apps/site/ et possède son propre package et son propre cycle de build.

## Guides du port

- [Intégration et architecture](INTEGRATION.md)
- [Règles de développement](AGENTS.md)

Le port utilise son routeur pour rester sous /site, isole ses styles sous .site-root et reçoit la session de l’application hôte. Le CSS intégré est produit par node scripts/build-site-css.mjs ; modifiez sa source dans apps/site/ et régénérez le port.

Pour travailler sur la source autonome, lisez [apps/site/README.md](../../apps/site/README.md). Le build Next racine et le build indépendant de apps/site sont distincts.
