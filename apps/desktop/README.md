# mAI Desktop

Client Electron qui ouvre **`https://mai-officiel.vercel.app`** dans une fenêtre
de bureau : l'interface et les fonctions IA viennent du site distant. Ce n'est pas
une coquille vide — la fenêtre principale héberge aussi un **terminal natif**
(`node-pty` + xterm.js), une fenêtre « À propos », un **lanceur de mAI Coder** et
un mécanisme de recharge à la nouvelle version Web.

L'application complète mAI Coder est embarquée dans l'installateur. Le terminal
permet d'utiliser le CLI et en propose l'installation s'il manque, ce qui exige
Node.js et npm sur la machine.

## Démarrer

`apps/desktop` n'est pas un membre du workspace pnpm racine : pnpm 10, son propre
`pnpm-workspace.yaml` et son propre lockfile. Prérequis : Node.js 22 ou supérieur.

```sh
pnpm install
pnpm run generate:icons
pnpm run dev
```

Ou depuis la racine du dépôt : `pnpm desktop:dev`, `pnpm desktop:build`.

## Compilation

```sh
pnpm run build     # garde de version, tsc, puis bundle du terminal
pnpm run dist      # installateur de la plateforme hôte
```

`dist:win`, `dist:mac` et `dist:linux` produisent les paquets sur leur plateforme
respectivement. `dev`, `pack` et `dist` exécutent d'abord `prepare:coder` : ils
compilent `apps/coder` et copient son **runtime Electron complet** dans
`build/coder-<architecture>`, que `extraResources` place dans `Resources/coder`.
La garde `scripts/check-coder.mjs` refuse un paquet sans le binaire Coder attendu.

Compiler les dépendances natives demande Python et les outils C++ de Visual Studio
sur Windows, les outils Xcode sur macOS, Python, make et un compilateur C++ sur
Linux. **Aucune signature** n'est configurée : `identity: null`,
`hardenedRuntime: false`, `publish: null`.

## Commandes

| Commande | Action |
| --- | --- |
| `pnpm run dev` | Prepare Coder, puis Electron en développement |
| `pnpm run build` | Vérifie l'alignement de version, compile, bundle le terminal |
| `pnpm run pack` / `dist` | Paquet local / installateurs |
| `pnpm run generate:icons` | Régénère `build/` du PNG de la racine (`public/logo.png`) |
| `pnpm run prepare:coder` | Compilation et copie du runtime Coder seul |

## Deux règles à tenir

- **La version de `apps/desktop/package.json` doit égaler celle du `package.json`
  racine.** `pnpm run build` vérifie cet alignement avant de compiler : un installateur
  annoncé en 0.9.3 qui embarque un Coder d'une autre version est inutilisable.
- **Les liens externes HTTP(S) et mail s'ouvrent dans le navigateur système**, et
  les requêtes IPC de lancement de Coder sont réservées à la fenêtre principale.

Le client distant se règle par `MAI_DESKTOP_APP_URL` (une autre instance de déploiement)
et `MAI_DESKTOP_CHANNEL` (`beta` change le titre de la fenêtre). Le lanceur pose
`MAI_CODER_EMBEDDED`, `MAI_CODER_LOAD_DIST` et `MAI_API_BASE` sur le Coder qu'il démarre.

## Recharge à la nouvelle version

La version Web est sondée **toutes les 60 secondes**. Quand une nouvelle
construction est décelée, la recharge n'intervient qu'après **30 secondes sans
activité** suivies de **20 secondes** pendant lesquelles la page est jugée sûre.
Réponses IA, générations, pièces jointes, brouillons et formulaires non enregistrés
retardent donc la recharge. Les changements du runtime Electron, du CLI ou de
Coder exigent un nouvel installateur.

CI : [`.github/workflows/build.yml`](../../.github/workflows/build.yml).
