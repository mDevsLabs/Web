import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuration Capacitor — application mobile mAI Vibe.
 * Le bundle Android/iOS charge l'application web déployée (Vercel)
 * pour que l'APK/IPA reste synchronisé sans republication store.
 */
const config: CapacitorConfig = {
  appId: 'com.mcompany.maivibe',
  appName: 'mAI Vibe',
  webDir: 'dist',
  server: {
    // L'app native charge l'URL de production (API https://mai.val.run utilisée par le SPA)
    url: process.env.VIBE_WEB_URL || 'https://mai-vibe.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
