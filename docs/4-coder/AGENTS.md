# 🤖 Directives & Règles pour Agents IA — mAI Coder (`4-coder`)

Ce document contient les règles fondamentales et les consignes d'architecture à respecter impérativement lors du développement sur l'application desktop **mAI Coder** (`apps/coder/`).

---

## 1. 🏗️ Architecture du Processus Electron

mAI Coder est une application desktop construite avec **Electron 41**, **React 19**, **Monaco Editor 0.52** et **Vite**.

Le projet est divisé en deux mondes strictement isolés par le pont IPC :
- **Processus Principal (Main Process)** sous `apps/coder/main-src/` :
  - Compilé par `esbuild.main.mjs` vers `apps/coder/electron/main.bundle.cjs`.
  - Gère les fenêtres (`BrowserWindow`), les processus enfants (`node-pty` pour les terminaux), les accès au système de fichiers natif, SQLite (`better-sqlite3`), le protocole MCP et les ponts bots IM.
- **Processus de Rendu (Renderer Process)** sous `apps/coder/src/` :
  - Application React 19 compilée avec Vite.
  - Communique avec le Main Process **exclusivement via le script de préchargement sécurisé** `electron/preload.cjs` (`contextBridge.exposeInMainWorld`).

> [!CAUTION]
> Ne jamais importer de modules Node.js natifs (`fs`, `child_process`, `better-sqlite3`, `node-pty`) directement dans le dossier `src/` (Renderer). Tout appel système passe impérativement par un canal IPC défini dans `main-src/` et exposé par `preload.cjs`.

---

## 2. ⚡ Cycle de Build & Scripts Essentiels

| Commande | Action |
|---|---|
| `npm run build:main` | Compile `main-src/` vers `electron/main.bundle.cjs` via esbuild. |
| `npm run build:renderer` | Compile l'application React/Monaco sous `dist/` via Vite. |
| `npm run build` | Exécute la synchronisation de team, le build main et le build renderer. |
| `npm run typecheck` | Vérifie les types TypeScript (`tsc --noEmit`). |
| `npm test` | Exécute les tests unitaires avec Vitest (`vitest run`). |
| `npm run release:win` | Compile les installeurs Windows x64 (NSIS + MSI). |
| `npm run release:mac:unsigned` | Compile les paquets macOS (DMG + ZIP non signés). |

---

## 3. 🧠 Boucle Agent & Modes Composer

L'architecture est « agent-first » :
1. **Modes Composer** :
   - `Agent` : Autonomie complète multi-tours avec exécution d'outils en continu.
   - `Plan` : Élaboration et affichage d'un plan d'actions avant toute modification de fichier.
   - `Ask` : Mode consultation / Q&A en lecture seule (outils d'écriture désactivés).
   - `Debug` : Analyse d'erreurs d'exécution et dépannage ciblé.
2. **Porte d'Approbation (`ToolApprovalGate`)** :
   - Les commandes shell (`execute_command`) et les modifications destructives de fichiers nécessitent une validation utilisateur préalable via l'interface, sauf si l'auto-approbation est explicitement activée par l'utilisateur.

---

## 4. 🔐 Secrets & Stockage Local

- **Local-first & BYOK** : Les clés API, fils de discussion et préférences sont stockés localement sur le poste de l'utilisateur (base SQLite locale et trousseau sécurisé).
- **Aucune transmission opaque** : Aucun secret ou clé API utilisateur ne doit être transmis à un serveur distant tiers sans consentement explicite.
