# Wakies

Wakies est un espace de travail personnel intégré à mAI Web sous /wakies. Ce guide décrit le port hôte et ses limites. La source officielle OpenMuse vit dans apps/wakies, hors du build Next pour ses modules Expo/Hono ; ses intégrations ne sont pas automatiquement disponibles dans le port.

## Guides

- [Intégration et état des services](INTEGRATION.md)
- [Configuration et prérequis](SETUP.md)
- [Ordinateurs persistants](COMPUTERS.md)
- [Base PostgreSQL et isolation par utilisateur](DATABASE.md)
- [Règles de développement](AGENTS.md)
- [Démonstrations historiques OpenDots](demos/README.md)

Le port utilise l’authentification mAI, les tables PostgreSQL dédiées et le quota IA du compte. Le chat passe par le pipeline de l’hôte. Les fonctions qui ne sont pas encore branchées sont recensées dans le guide d’intégration ; la présence de code dans apps/wakies/ ne suffit pas à les rendre disponibles sous /wakies.

Pour contribuer, partez des sources indiquées dans AGENTS.md et respectez les générateurs CSS.


- [Cartographie et décisions OpenMuse](OPENMUSE_MIGRATION.md)
- [Résultats de validation](VALIDATION_OPENMUSE.md)
- [Inventaire API](API_INVENTORY.json)
- [Changements depuis l’état local initial](CHANGESET_OPENMUSE.json)

Les guides HISTORIQUE_* décrivent l’ancien port et ne servent pas au déploiement courant.
