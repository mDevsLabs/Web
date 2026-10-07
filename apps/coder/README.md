# mAI Coder

mAI Coder est une application desktop de développement centrée sur un agent. Elle réunit un éditeur Monaco, un explorateur de projet, Git, un terminal PTY, des outils MCP et plusieurs fournisseurs de modèles. L’application est conçue pour laisser l’utilisateur examiner et contrôler les actions de l’agent.

## Fonctionnalités

- Modes Agent, Plan, Ask et Debug.
- Lecture, recherche, édition de fichiers et exécution de commandes depuis le workspace.
- Prévisualisation des modifications et approbation des opérations sensibles.
- Conversations et paramètres conservés localement.
- Fournisseurs Anthropic, OpenAI, Gemini et endpoints compatibles OpenAI.
- Intégrations MCP, navigateur et bots de messagerie selon la configuration.

## Architecture

Le processus Renderer est une application React/Vite. Le processus Main gère Electron, le système de fichiers, Git, les processus PTY, la persistance et les intégrations. Le Renderer accède aux fonctions natives uniquement par le preload sécurisé et ses canaux IPC.

~~~text
apps/coder/src/                 Interface React et Monaco
apps/coder/main-src/            Processus Electron et services natifs
apps/coder/electron/preload.cjs  API autorisée exposée au Renderer
apps/coder/docs/                Documentation et captures
~~~

Ne branchez pas directement fs, child_process ou une dépendance native dans le Renderer. Toute nouvelle capacité système doit passer par un handler Main et le contrat du preload.

## Développement

Prérequis : Node.js et pnpm (le dépôt racine épingle `pnpm@10.32.1`). Depuis ce dossier :

~~~sh
pnpm install
pnpm run dev
~~~

Ou depuis la racine du dépôt : `pnpm dev:coder`, `pnpm build:coder`.

Commandes utiles : pnpm run typecheck, pnpm test et pnpm run build. Le build prépare le Main et le Renderer ; les scripts de release sont disponibles pour Windows, macOS et Linux dans package.json.

Les clés de fournisseurs se configurent dans l’application. Ne les ajoutez pas au dépôt ni aux journaux. Consultez la documentation avant de modifier les frontières Main/Renderer.

## Documentation et licence

- Architecture, intégrations et règles de contribution : [documentation mAI Coder](../../docs/4-coder/README.md)
- Contrat de sécurité du processus : [directives agents](../../docs/4-coder/AGENTS.md)
- Licence : [Apache 2.0](LICENSE)

Les captures présentes dans docs/assets illustrent l’application ; elles ne constituent pas des garanties de disponibilité de chaque intégration.
