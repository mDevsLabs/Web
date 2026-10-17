# mAI Web

mAI Web est la plateforme principale de l’écosystème mAI : chat, agent, mémoire, projets, outils, serveurs MCP, génération multimodale et tâches planifiées. L’interface et la documentation du dépôt sont en français. 🙂

## Architecture du dépôt

Le dépôt rassemble plusieurs applications dont les commandes et les cycles de publication sont distincts.

| Partie | Rôle | Sources principales |
| --- | --- | --- |
| Application Web | Application Next.js et BFF qui sert l’interface authentifiée et ses API | app/, components/, lib/, hooks/ |
| API mAI | Backend Hono déployé séparément sur Val Town | main.ts et modules TypeScript à la racine |
| mAI Coder | Application de développement pour ordinateur, basée sur Electron | apps/coder/ |
| Clients bureau et mobile | Conteneurs Electron et Capacitor qui ouvrent le site mAI | apps/desktop/, apps/mobile/ |
| Sources de Vibe, Wakies et Site | Applications autonomes conservées comme sources des intégrations de l’hôte | apps/vibe/, apps/wakies/, apps/site/ |
| Bibliothèques | Composants React et icônes distribuables | packages/ui/, packages/icons/ |

L’application Next et le backend Hono ne partagent pas le même runtime. Le build racine compile Next.js. Les fichiers TypeScript Hono à la racine sont déployés indépendamment et ne sont pas couverts par le typecheck Next.

Vibe, Wakies et le Site officiel sont disponibles dans l’hôte sous /vibe, /wakies et /site. Leurs versions autonomes dans apps/ servent de sources ou de références ; elles ne sont pas compilées par le build Next racine.

## Démarrer l’application Web

Prérequis : Node.js 22 ou supérieur et pnpm 10.

~~~powershell
pnpm install
Copy-Item .env.example .env.local
~~~

Renseignez les variables nécessaires dans .env.local, dont la connexion PostgreSQL. Pour une base prête à recevoir l’application, appliquez les migrations puis démarrez Next :

~~~powershell
pnpm db:migrate
pnpm dev
~~~

L’application locale est servie sur http://localhost:3000. Les migrations exigent une base PostgreSQL configurée ; ne les lancez pas sur une base de production sans suivre la procédure de déploiement.

## Commandes racine

| Commande | Action |
| --- | --- |
| pnpm dev | Serveur Next.js de développement |
| pnpm build | Génération des styles intégrés puis build Next.js |
| pnpm check | Contrôle Biome via Ultracite |
| pnpm typecheck | Typecheck de l’application Next |
| pnpm test:unit | Tests unitaires Vitest |
| pnpm test | Tests de bout en bout Playwright |
| pnpm db:generate | Génération des migrations Drizzle |
| pnpm db:migrate | Application des migrations PostgreSQL |

Les applications dans apps/ ont leurs propres scripts. Consultez leur README avant de les lancer. Le workflow principal de validation se trouve dans .github/workflows/build.yml.

## Repères

- Architecture Web et API : [docs/1-web/README.md](docs/1-web/README.md)
- Vue d’ensemble de la documentation : [docs/README.md](docs/README.md)
- Intégration Vibe : [docs/2-vibe/INTEGRATION.md](docs/2-vibe/INTEGRATION.md)
- Intégration Wakies : [docs/3-wakies/INTEGRATION.md](docs/3-wakies/INTEGRATION.md)
- Intégration Site : [docs/5-site/INTEGRATION.md](docs/5-site/INTEGRATION.md)
- mAI Coder : [apps/coder/README.md](apps/coder/README.md)

Ne versionnez jamais .env.local ni les secrets personnels. Utilisez .env.example comme liste de variables à configurer.
