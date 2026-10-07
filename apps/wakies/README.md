# Wakies — application source

Ce dossier contient la source autonome de Wakies : une interface Vite, un serveur Node et des services séparés pour les fonctions de travail avec des agents. Il sert aussi de référence au port intégré à mAI Web.

Les deux versions ont des responsabilités différentes. L’application source peut contenir des intégrations qui ne sont pas encore connectées dans l’hôte. Sous mAI Web, l’authentification, PostgreSQL, les quotas et le pipeline IA sont ceux de mAI. Consultez l’état réel du port dans [docs/3-wakies/INTEGRATION.md](../../docs/3-wakies/INTEGRATION.md).

## Développement de la source

Prérequis : Node.js 24 et npm. Depuis apps/wakies :

~~~sh
npm ci
npm run dev
~~~

Le script dev démarre le serveur applicatif et Vite. Les autres scripts déclarés dans package.json permettent notamment de lancer les tests et de construire la source. Les services externes et variables nécessaires dépendent des fonctions utilisées ; consultez l’implémentation et les guides disponibles avant de les configurer.

## Plans du dépôt

- Règles et architecture du port /wakies : [documentation Wakies](../../docs/3-wakies/README.md)
- Schéma et limites de la base intégrée : [guide de base de données](../../docs/3-wakies/DATABASE.md)
- Ordinateurs isolés de la source : [configuration des ordinateurs](../../docs/3-wakies/COMPUTERS.md)
- Démonstrations enregistrées de la source autonome : [galerie](../../docs/3-wakies/demos/README.md)

Pour contribuer au port intégré, modifiez les sources hôte indiquées dans le guide d’intégration et régénérez les fichiers prévus. Ne prenez pas les fonctionnalités de la source autonome pour des fonctions déjà disponibles sous /wakies.
