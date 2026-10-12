# mAI Mobile

Cette application Capacitor ouvre **https://mai-officiel.vercel.app** dans une WebView Android ou iOS. Elle n’embarque pas le serveur Next.js ; une connexion réseau et un site distant accessible sont nécessaires.

Une nouvelle version Web est détectée toutes les minutes et au retour au premier plan ou en ligne. L’application attend la fin des réponses IA, des générations et des saisies avant de recharger. Les changements de Capacitor et de la configuration native demandent un nouvel installateur. Le CLI et Coder, qui utilisent des terminaux et des fichiers locaux, sont fournis par l’application de bureau.

## Développement

Prérequis : Node.js, pnpm et les outils natifs de la plateforme ciblée. Android demande Android Studio et le SDK Android. La génération iOS demande macOS et Xcode.

Depuis apps/mobile :

~~~powershell
pnpm install
pnpm run generate:icons
pnpm run add:android
pnpm run sync
~~~

Pour iOS, utilisez pnpm run add:ios sur macOS. La configuration du client distant et les options d’écran d’accueil se trouvent dans capacitor.config.ts.

La WebView locale iOS utilise le schéma `capacitor` ; `http` et `https` sont réservés par WKWebView et ne sont pas des schémas locaux valides. `server.url` conserve l’origine HTTPS du site officiel.

## Compilation

~~~sh
pnpm run build:android
pnpm run build:android:release
pnpm run build:ios
~~~

Ces scripts synchronisent les assets Capacitor puis appellent les outils natifs. La signature et la distribution de production demandent une configuration de certificats propre à chaque plateforme.

## Automatisation

Le workflow partagé est [.github/workflows/build.yml](../../.github/workflows/build.yml). Il construit les clients WebView selon les règles du workflow ; les étapes mobiles peuvent nécessiter leurs runners et outils natifs dédiés.
