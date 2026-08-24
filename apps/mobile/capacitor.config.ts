import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  android: {
    allowMixedContent: false,
    backgroundColor: "#0a0a0a",
  },
  appId: "app.mai.officiel.mobile",
  appName: "mAI",
  ios: {
    backgroundColor: "#0a0a0a",
    contentInset: "always",
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#0a0a0a",
      launchShowDuration: 1500,
    },
    StatusBar: {
      backgroundColor: "#0a0a0a",
      style: "dark",
    },
  },
  // Charge directement le site – pas de serveur local nécessaire
  // En mode natif, Capacitor utilisera server.url comme WebView source
  server: {
    androidScheme: "https",
    cleartext: false,
    iosScheme: "https",
    url: "https://mai-officiel.vercel.app",
  },
  webDir: "www",
};

export default config;
