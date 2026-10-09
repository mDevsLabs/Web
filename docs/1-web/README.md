# mAI Web

Cette section documente l’application Next.js principale, son BFF, le backend Hono déployé séparément, les agents et les données PostgreSQL.

## Lire selon le besoin

| Sujet | Guide |
| --- | --- |
| Règles de développement | [AGENTS.md](AGENTS.md) |
| Architecture et frontière Next/API | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Exécution de l’Agent | [AGENT_ENGINE.md](AGENT_ENGINE.md) |
| Routes et modules du backend | [BACKEND_API.md](BACKEND_API.md) |
| API pour agents externes | [AI_AGENTS_API.md](AI_AGENTS_API.md) |
| Schéma et migrations | [DATABASE.md](DATABASE.md) |
| Sécurité | [SECURITY.md](SECURITY.md) |
| Plugins et intégrations de recherche | [PLUGINS.md](PLUGINS.md) |
| Assertions importantes | [VALIDATION_MATRIX.md](VALIDATION_MATRIX.md) |

## Démarrage local

À la racine du dépôt, installez les dépendances, configurez .env.local à partir de .env.example, préparez une base PostgreSQL puis lancez les migrations et pnpm dev. Les commandes détaillées et leurs prérequis sont dans le [README racine](../../README.md).

Le backend Hono n’est pas démarré par le serveur Next. Il est déployé séparément ; ses fichiers TypeScript à la racine ne sont pas couverts par le typecheck Next.
