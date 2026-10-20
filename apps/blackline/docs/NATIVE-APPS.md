# Applications BLACKLINE 1.2.0

## Architecture

- **Desktop : Electron 44.8.0**, electron-builder 26.15.3. Le protocole local sécurisé `blackline://app` sert les fichiers copiés depuis `dist/`. Aucun site distant, iframe ou serveur local nécessaire. Node est désactivé dans le rendu, isolation de contexte et sandbox activés, CSP, navigation externe bloquée. L’export JSON utilise la boîte de téléchargement du système.
- **Mobile : Capacitor 8.5.3**, Android et iOS. Le dossier `web` contient les assets de la compilation et un pont embarqué. Paysage configuré dans les manifestes, avec le plugin Screen Orientation ; mise en pause à l’arrière-plan et prise en charge du retour Android. Export JSON par Filesystem/Share vers la feuille système. Les données du jeu restent locales.
- Les deux applications utilisent le moteur TypeScript/WebGL du jeu ; le contenu s’exécute dans le moteur de rendu intégré à l’application. Il ne s’agit pas d’une vue du Site en ligne dans une iframe, ni d’une réécriture du moteur en code natif.

## GitHub Actions

`.github/workflows/build.yml` :

| Job | Résultat prévu |
| --- | --- |
| web | `blackline-web`, après TypeScript/tests/budgets |
| desktop / Windows | Installateur NSIS `.exe`, x64 |
| desktop / macOS | DMG et ZIP, arm64 et x64 |
| desktop / Linux | AppImage x64 |
| android | APK **debug**, signé par la clé de développement générée par Gradle |
| ios | ZIP `.app` pour **simulateur iOS**, sans signature d’appareil |

Les jobs natifs utilisent le même artefact web vérifié. Pas de secrets requis pour ces paquets de développement. Les installateurs desktop ne sont pas signés/notariés ; il faudra configurer la signature pour une diffusion finale. L’artefact iOS simulateur ne s’installe pas sur un iPhone : un build pour appareil avec identité et profil Apple est nécessaire. Android release/Play Store nécessite aussi sa configuration de signature.

Les builds natifs ne se lancent pas sur les PR. Ils se lancent sur push ou via Actions → BLACKLINE → Run workflow. Aucune exécution GitHub Actions n’a été effectuée depuis cette session ; aucune réussite native complète ni binaire final n’est revendiqué.

## Local

À la racine : `npm ci`, `npm run build`.

Desktop :

```bash
cd apps/desktop
npm ci
npm run prepare:web
npm start
npm run package
```

Mobile :

```bash
cd apps/mobile
npm ci
npm run prepare:web
npx cap add android
npx cap sync android
npm run configure:android
```

Puis `bash android/gradlew -p android assembleDebug --no-daemon`, ou ouvrir le projet dans Android Studio. Pour iOS sur macOS : `npx cap add ios`, `npx cap sync ios`, `npm run configure:ios`, puis ouvrir `ios/App/App.xcodeproj` dans Xcode. Les dossiers de plateformes générés sont ignorés ; ne relancer `cap add` que si le dossier manque. Relancer `configure:*` après `cap sync`.

Le script copie les icônes BLACKLINE, fixe le paysage et la version 1.2.0. iOS inclut le manifeste de confidentialité de l’usage des dates de fichiers pour l’export. Les plateformes, les dépendances et le pont natif sont testés à la préparation ; la compilation finale nécessite les outils propres à chaque plateforme (Android SDK 36/JDK 21, Xcode 26+).

Sur certains grands écrans Android, le système peut ignorer le verrouillage d’orientation ; le garde paysage du jeu suspend alors la partie. Les performances dépendent de WebGL 2, du GPU et de la mémoire.

Références : https://capacitorjs.com/docs/updating/8-0 ; https://capacitorjs.com/docs/apis/share ; https://capacitorjs.com/docs/apis/filesystem ; https://www.electronjs.org/docs/latest/tutorial/security ; https://www.electron.build/v26/docs/cli/
