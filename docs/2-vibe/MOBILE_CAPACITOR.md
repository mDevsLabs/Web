# 📱 Application Mobile Native Vibe (Capacitor)

Vibe dispose d'une version mobile hybride pour iOS et Android, propulsée par **Capacitor** et enveloppant l'application web dans une WebView hautement optimisée.

---

## 1. ⚙️ Configuration (`apps/vibe/capacitor.config.ts`)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mdevslabs.vibe',
  appName: 'Vibe',
  webDir: 'dist',
  server: {
    // URL distante cible chargée en production
    url: process.env.VIBE_WEB_URL || 'https://mai-vibe.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#09090b',
      showSpinner: false
    }
  }
};

export default config;
```

---

## 2. 🤖 Compilation Android (APK)

Le workflow CI/CD `.github/workflows/vibe-build-mobile.yml` automatise la création des builds :
- **Prérequis système** : Java 21 (Temurin), SDK Android, Gradle.
- **Résolution des conflits Kotlin** : Forçage de `org.jetbrains.kotlin:kotlin-stdlib:1.8.22` dans `android/app/build.gradle`.
- **Mode Release (signé)** : Si les secrets GitHub (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, etc.) sont configurés, l'APK est signé cryptographiquement.
- **Mode Debug (non signé)** : En l'absence de secret, l'APK est généré en mode Debug immédiatement installable sur tout appareil Android pour les tests.

---

## 3. 🍏 Compilation iOS (IPA)

- **Runner requis** : `macos-latest` avec Xcode.
- **Configuration Podfile** : Cible iOS minimale fixée à `iOS 15.0`.
- **Artefact produit** : Fichier `.ipa` non signé exporté via `xcodebuild archive` dans un conteneur `Payload/`, prêt pour re-signature via un profil d'approvisionnement Apple Developer.

---

## 4. 🚀 Commandes locales

Pour travailler localement sur le projet mobile :

```bash
cd apps/vibe

# Synchroniser le code web vers les plateformes natives
npx cap sync

# Ouvrir dans Android Studio
npx cap open android

# Ouvrir dans Xcode (sur macOS)
npx cap open ios
```
