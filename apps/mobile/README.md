# mAI Mobile

Client **Capacitor 6** qui ouvre `https://mai-officiel.vercel.app` dans une
WebView Android ou iOS. Il n'embarque **ni le serveur Next.js, ni aucune logique** :
une connexion réseau et un site distant accessible sont nécessaires.

Ce n'est pas l'endroit du CLI ni de mAI Coder : ils utilisent des terminaux et des
fichiers locaux et sont distribués par [mAI Desktop](../desktop/README.md).

## Il n'y a pas de code applicatif ici

L'application tient dans un seul fichier de configuration. `tsconfig.json`
n'inclut que `capacitor.config.ts` ; `src/` n'existe pas.

```
capacitor.config.ts   Origine distante, schémas, appId, plugins
resources/            Icônes et splash (générés)
www/                  Coquille locale de repli — écrite à la main, versionnée
scripts/              generate-icons.mjs
android/  ios/        Absents de Git, créés par `cap add`
```

**`www/` n'est pas un export de Next.js.** C'est une page HTML posée à la main,
utilisée lorsque la WebView ne peut pas joindre l'origine distante. Rien à
construire dans le dépôt avant de lancer ce client.

## Démarrer

pnpm 10, propre lockfile, **pas** de `pnpm-workspace.yaml` — la CI installe avec
`--ignore-workspace`. Prérequis : Node.js, Android Studio et le SDK Android ;
macOS et Xcode pour iOS.

```sh
pnpm install
pnpm run generate:icons
pnpm run add:android
pnpm run sync
```

Sur macOS, `pnpm run add:ios` à la place de `add:android`.

## Commandes

| Commande | Action |
| --- | --- |
| `pnpm run dev` | **`cap sync`** — ce n'est pas un serveur de développement |
| `pnpm run build` | `tsc --noEmit` sur la configuration |
| `pnpm run sync` | Recopie la configuration et `www/` dans les projets natifs |
| `pnpm run add:android` / `add:ios` | Génère le projet natif |
| `pnpm run build:android` | APK de debug |
| `pnpm run build:android:release` | APK « release » **non signé** |
| `pnpm run build:ios` | IPA sans signature |

## Configuration du client

| Réglage | Valeur |
| --- | --- |
| `appId` | `app.mai.officiel.mobile` |
| `server.url` | `https://mai-officiel.vercel.app` |
| `androidScheme` | `https` |
| `iosScheme` | `capacitor` |
| `cleartext` | `false` |

La WebView locale iOS utilise le schéma `capacitor` : `http` et `https` sont
réservés par WKWebView et ne sont pas des schémas locaux valides.

Aucune variable d'environnement n'est lue, et **aucune signature n'est
configurée** : `build:android:release` transmet des identifiants de keystore vides
et `build:ios` désactive le code signing. Signer et distribuer demande une
configuration de certificats propre à chaque plateforme.

## Piège d'ordre

`generate:icons` réécrit `resources/` et `www/icon.png` et refuse de réduire un
PNG existant plus grand. Les icônes doivent être régénérées **après** `cap add`,
pour corriger les mipmaps Android et l'AppIcon iOS — la CI le fait deux fois.

Changer Capacitor ou la configuration native exige un nouvel installateur ; une
nouvelle version du site distant, non. CI :
[`.github/workflows/build.yml`](../../.github/workflows/build.yml).
