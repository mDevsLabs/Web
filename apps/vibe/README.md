# Vibe — application source

Vibe est l’application sociale de l’écosystème mAI : profils, publications, fil d’actualité, commentaires, messagerie et fonctions IA. Ce dossier contient la version autonome React/Vite et son backend Deno/Hono.

La plateforme est aussi portée dans mAI Web sous /vibe. Le port utilise le routage, l’authentification et les services de l’hôte ; ses styles et pages d’entrée sont produits par les scripts du dépôt racine. Une modification de apps/vibe n’actualise donc pas automatiquement le port.

## Développer la source autonome

~~~sh
cd apps/vibe
npm install
npm run dev
~~~

Les contrôles disponibles comprennent npm run build, npm run lint et les commandes Deno déclarées dans package.json pour le backend et ses migrations. Le frontend Vite et le backend Deno sont deux processus distincts.

## Repères

- Interface Vite : src/
- Modules backend : fichiers TypeScript à la racine de apps/vibe/
- Contrat du port sous mAI Web : [docs/2-vibe/README.md](../../docs/2-vibe/README.md)
- Intégration et sources générées : [guide d’intégration](../../docs/2-vibe/INTEGRATION.md)
- Directives de contribution : [règles Vibe](../../docs/2-vibe/AGENTS.md)

Ne modifiez pas directement les sorties générées du port dans components/vibe/ ou app/(chat)/vibe/.
