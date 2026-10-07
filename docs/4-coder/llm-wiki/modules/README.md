# Index des modules mAI Coder

Les pages de ce dossier décrivent le rôle, les entrées, les effets de bord et les liens entre les modules de apps/coder/. Elles servent à trouver les bons fichiers avant de modifier le code.

## Parcours

- Agent : [boucle d’exécution](agent-loop.md), [exécution des outils](tool-executor.md), [approbations et récupération](tool-approval-gate.md)
- Modèles et conversation : [résolution des modèles](model-resolve.md), [chat en flux](use-streaming-chat.md), [threads](use-threads.md), [stockage des threads](thread-store.md)
- Plans et équipes : [système de plans](use-plan-system.md), [orchestrateur d’équipe](team-orchestrator.md), [session d’équipe](use-team-session.md)
- Workspace : [index de fichiers](workspace-file-index.md), [contexte de workspace](workspace-context-expand.md), [gestion du workspace](use-workspace-manager.md)
- État d’interface : [paramètres](settings-store.md), [hook des paramètres](use-settings.md), [contextes App Shell](app-shell-contexts.md), [thème de fenêtre](theme-chrome.md)
- Outils et intégrations : [runtime bots](bot-runtime.md), [session terminal IPC](terminal-session-ipc.md), [service de sessions PTY](terminal-session-service.md), [MCP](mcp-manager.md), [plugins](plugin-runtime-service.md), [navigateur](browser-controller.md)

La carte transversale des canaux se trouve dans [la carte IPC](../architecture/ipc-channel-map.md). Une page de module ne remplace ni l’architecture générale ni la vérification du code courant.
