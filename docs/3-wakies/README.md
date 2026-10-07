# Wakies

Wakies est un espace de travail personnel intégré à mAI Web sous /wakies. Ce guide décrit le port hôte et ses limites. L’application source autonome vit dans apps/wakies ; ses intégrations ne sont pas automatiquement disponibles dans le port.

## Guides

- [Intégration et état des services](INTEGRATION.md)
- [Configuration et prérequis](SETUP.md)
- [Ordinateurs persistants](COMPUTERS.md)
- [Base PostgreSQL et isolation par utilisateur](DATABASE.md)
- [Règles de développement](AGENTS.md)
- [Démonstrations de l’application source](demos/README.md)

Le port utilise l’authentification mAI, les tables PostgreSQL dédiées et le quota IA du compte. Le chat passe par le pipeline de l’hôte. Les fonctions qui ne sont pas encore branchées sont recensées dans le guide d’intégration ; la présence de code dans apps/wakies/ ne suffit pas à les rendre disponibles sous /wakies.

Pour contribuer, partez des sources indiquées dans AGENTS.md et respectez les générateurs CSS.
