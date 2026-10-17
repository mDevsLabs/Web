# 🔌 Intégrations & Protocoles — mAI Coder

mAI Coder s'interface avec de multiples protocoles et plateformes tierces pour étendre les capacités de l'agent.

---

## 1. 🌐 Protocole MCP (Model Context Protocol)

mAI Coder implémente un gestionnaire de clients MCP complet (`apps/coder/src/` et `main-src/`) :
- **Serveurs locaux (stdio)** : Exécution de sous-processus locaux fournissant des outils ou des ressources (ex: filesystem, git, SQLite).
- **Serveurs distants (SSE)** : Connexion par Server-Sent Events à des serveurs MCP hébergés sur le réseau.
- **Découverte automatique** : Les outils MCP exposés sont convertis à la volée en fonctions exécutables par le modèle d'IA sélectionné.

---

## 2. 💬 Ponts Bots de Messagerie Instantanée (IM)

mAI Coder permet de déporter le contrôle de l'agent vers vos canaux de messagerie préférés :
- **Telegram** : Bot de télécommande avec gestion des messages vocaux et commandes rapides.
- **Slack & Discord** : Intégration sur des salons de projet avec mention `@mAI-Coder` pour déléguer des tâches de révision de code.
- **Feishu / Lark** : Support d'entreprise avec cartes interactives et webhooks sécurisés.

---

## 3. 🖥️ Terminal PTY & Navigateur Playwright

- **Terminal partagé** : Basé sur `node-pty`, le terminal est commun entre l'utilisateur et l'agent. L'agent peut observer la sortie d'un serveur de dev (`npm run dev`) ou inspecter les logs d'un test en échec.
- **Navigateur d'observation (Playwright)** : Outil intégré permettant à l'agent d'ouvrir une page web, d'effectuer des captures d'écran, de tester des formulaires et de valider visuellement le rendu d'une application frontend.
