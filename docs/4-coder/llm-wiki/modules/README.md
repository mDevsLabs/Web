# Index des modules mAI Coder

Les pages de ce dossier décrivent le rôle, les entrées, les effets de bord et les
liens des modules de `apps/coder/`. Elles servent à trouver les bons fichiers
**avant** de modifier le code — pas à se dispenser de les ouvrir.

## Parcours

| Domaine | Modules |
| --- | --- |
| Agent | [boucle d'exécution](agent-loop.md) · [exécution des outils](tool-executor.md) · [approbations et récupération](tool-approval-gate.md) |
| Modèles et conversation | [résolution des modèles](model-resolve.md) · [chat en flux](use-streaming-chat.md) · [fils](use-threads.md) · [stockage des fils](thread-store.md) |
| Plans et équipes | [système de plans](use-plan-system.md) · [orchestrateur d'équipe](team-orchestrator.md) · [session d'équipe](use-team-session.md) |
| Workspace | [index de fichiers](workspace-file-index.md) · [contexte de workspace](workspace-context-expand.md) · [gestion du workspace](use-workspace-manager.md) · [Git](use-git-integration.md) |
| Terminal | [sessions PTY](terminal-pty.md) · [canal IPC](terminal-session-ipc.md) · [service de sessions](terminal-session-service.md) |
| État d'interface | [paramètres](settings-store.md) · [hook des paramètres](use-settings.md) · [contextes App Shell](app-shell-contexts.md) · [thème de fenêtre](theme-chrome.md) |
| Outils et intégrations | [runtime bots](bot-runtime.md) · [MCP](mcp-manager.md) · [plugins](plugin-runtime-service.md) · [navigateur](browser-controller.md) |

## Comment lire une fiche

Une page de module nomme ses fichiers, ses entrées publiques, ce qu'elle écrit
(disque, base locale, réseau) et ce qui l'appelle. Elle ne vaut pas contrat :
le contrat est dans le code et dans les `.d.ts` distribués.

La vue transverse des canaux est dans
[la carte IPC](../architecture/ipc-channel-map.md). Une fiche ne remplace ni
l'architecture générale, ni la vérification du code courant.
