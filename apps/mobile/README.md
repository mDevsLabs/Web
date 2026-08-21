# mAI Mobile (Android / iOS)

Application mobile Capacitor – simple WebView vers https://mai-officiel.vercel.app. **Non signée** (debug/unsigned).

## Structure

```
apps/mobile/
  capacitor.config.ts  # appId app.mai.officiel.mobile, server.url = https://mai-officiel.vercel.app
  www/index.html       # fallback iframe plein écran (hors natif)
  resources/icon.png   # généré depuis public/logo.png
  scripts/generate-icons.mjs
  android/             # généré via `npx cap add android` (non committé, créé en CI)
  ios/                 # généré via `npx cap add ios` (macOS)
```

## Logo

Même logo que le site `public/logo.png` (676×676) copié vers `resources/` et `www/icon.png`, puis décliné pour Android (`mipmap`) et iOS (`AppIcon`) via `generate-icons.mjs`. Si `sharp` présent, génération multi-résolutions propre.

## Dev local

```bash
cd apps/mobile
pnpm install
pnpm run generate:icons
npx cap add android   # une fois (nécessite Android SDK)
npx cap add ios       # sur macOS uniquement
npx cap sync
npx cap open android
npx cap open ios
```

## Build non signé

```bash
# Android Debug APK (debug keystore, non production)
pnpm run build:android
# → android/app/build/outputs/apk/debug/app-debug.apk

# Android Release non signé (vrai unsigned)
pnpm run build:android:release
# → android/app/build/outputs/apk/release/app-release-unsigned.apk

# iOS unsigned IPA (macOS uniquement, CODE_SIGNING_ALLOWED=NO)
pnpm run build:ios
# → ios/App/build/App.xcarchive + IPA manuel
```

CI : `.github/workflows/desktop.yml` génère les artefacts Android/iOS en parallèle des builds desktop, sans signature.
