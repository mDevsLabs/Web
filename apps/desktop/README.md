# mAI Desktop

Ce client Electron ouvre **https://mai-officiel.vercel.app** dans une fenêtre de bureau. L’interface et les fonctions IA viennent du site distant. L’application complète mAI Coder est incluse dans l’installateur. Le terminal natif permet d’utiliser le CLI et propose son installation s’il est absent ; cette installation exige Node.js et npm sur la machine.

L’application vérifie le déploiement Web toutes les minutes et au retour au premier plan ou en ligne. Elle recharge une nouvelle version lorsque l’écran est libre, après les réponses IA, les générations et les saisies en cours. Les changements du runtime Electron, du CLI ou de Coder demandent un nouvel installateur.

## Développement

Depuis ce dossier, installez les dépendances, générez les icônes si nécessaire et lancez l’application :

~~~powershell
pnpm install
pnpm run generate:icons
pnpm run dev
~~~

La cible distante est définie dans `src/main.ts`. Les liens externes HTTP(S) et mail s’ouvrent dans le navigateur système.

`dev`, `pack` et `dist` préparent Coder avant le lancement ou l’empaquetage. Installez aussi ses dépendances depuis `apps/coder` avec `pnpm install --frozen-lockfile`. La préparation compile les deux bundles et copie son runtime Electron complet, ses ressources et ses modules natifs dans `build/coder-<architecture>`. Sur Windows, la compilation native demande Python et les outils C++ Visual Studio ; sur macOS, les outils Xcode ; sur Linux, Python, make et un compilateur C++.

Coder garde son profil local et ses réglages propres. Son bouton lance le binaire inclus et signale les erreurs. Les requêtes IPC de lancement sont réservées à la fenêtre principale du site officiel.

## Compilation

~~~powershell
pnpm run build
pnpm run dist
~~~

Les commandes `dist:win`, `dist:mac` et `dist:linux` produisent les paquets sur leur plateforme respective. `dist:mac` prépare Coder pour x64 et ARM64. Electron Builder recompile aussi les dépendances natives du CLI pour chaque architecture. La garde `scripts/check-coder.mjs` refuse un paquet qui ne contient pas le binaire Coder attendu.

Les projets natifs générés et les artefacts de compilation ne sont pas les sources de l’interface Web.

## CI

Le workflow de build et de publication est [build.yml](../../.github/workflows/build.yml). Il prend en charge les clients desktop et mobile selon les chemins modifiés et les déclencheurs du workflow.
