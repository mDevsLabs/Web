# mAI Mobile

Cette application Capacitor ouvre le site mAI officiel dans une WebView Android ou iOS. Elle n’embarque pas le serveur Next.js ; une connexion réseau et un site distant accessible sont nécessaires.

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

## Compilation

~~~sh
pnpm run build:android
pnpm run build:android:release
pnpm run build:ios
~~~

Ces scripts synchronisent les assets Capacitor puis appellent les outils natifs. La signature et la distribution de production demandent une configuration de certificats propre à chaque plateforme.

## Automatisation

Le workflow partagé est [.github/workflows/build.yml](../../.github/workflows/build.yml). Il construit les clients WebView selon les règles du workflow ; les étapes mobiles peuvent nécessiter leurs runners et outils natifs dédiés.
