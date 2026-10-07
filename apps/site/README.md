# Site officiel mAI — application source

Ce dossier contient la version autonome du Site officiel mAI, une application Next.js qui présente les modèles, les produits, la documentation et les points d’entrée développeur de l’écosystème.

Le site est également intégré à l’application hôte sous /site. Dans le dépôt hôte, le port se trouve dans components/site/, lib/site/ et app/(chat)/site/. Les deux formes partagent le contenu, mais leurs builds et certaines dépendances ne sont pas les mêmes.

## Développement autonome

Depuis apps/site :

~~~sh
npm install
npm run dev
~~~

Consultez les scripts du package pour lancer le build, les contrôles, les tests ou les outils d’administration. Les variables d’environnement de cette application doivent être configurées dans son environnement local ; ne copiez pas les fichiers .env personnels dans Git.

## Repères de développement

- Les données des modèles sont décrites dans lib/mai-models.ts et lib/models-data.ts.
- Les pages éditoriales et les fiches de modèles sont sous docs/.
- Les routes API propres au site sont sous app/api/.
- L’application intégrée à l’hôte est documentée dans [docs/5-site/INTEGRATION.md](../../docs/5-site/INTEGRATION.md).
- Les règles de routage, de styles et de SSO du port se trouvent dans [docs/5-site/AGENTS.md](../../docs/5-site/AGENTS.md).

Le Site source n’est pas compilé par pnpm build à la racine. Pour modifier le port /site, suivez les guides du dépôt hôte et les sources génératrices prévues.
