# mAI Desktop

Ce client Electron ouvre le site mAI dans une fenêtre de bureau. Il s’agit d’un conteneur léger : l’interface, la session et les fonctions IA restent fournies par le site distant.

## Développement

Depuis ce dossier, installez les dépendances, générez les icônes si nécessaire et lancez l’application :

~~~powershell
pnpm install
pnpm run generate:icons
pnpm run dev
~~~

La cible distante est définie dans apps/desktop/src/main.ts. Les liens externes s’ouvrent dans le navigateur système.

## Compilation

~~~powershell
pnpm run build
pnpm run dist
~~~

Les commandes dist:win, dist:mac et dist:linux produisent le paquet de la plateforme correspondante. Une compilation macOS demande macOS ; la création d’un installateur Windows depuis un autre système dépend de Wine et de la configuration Electron Builder.

Les projets natifs générés et les artefacts de compilation ne sont pas les sources de l’interface Web.

## CI

Le workflow de build et de publication est [build.yml](../../.github/workflows/build.yml). Il prend en charge les clients desktop et mobile selon les chemins modifiés et les déclencheurs du workflow.
