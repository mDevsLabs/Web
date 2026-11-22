import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  build: {
    chunkSizeWarningLimit: 1500,
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts")) {
            return "charts";
          }
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("node_modules/remark-gfm")
          ) {
            return "markdown";
          }
          if (
            id.includes("node_modules/monaco-editor") ||
            id.includes("node_modules/@monaco-editor/react")
          ) {
            return "monaco";
          }
          if (id.includes("node_modules/shiki")) {
            return "shiki";
          }
          if (
            id.includes("node_modules/@xterm/xterm") ||
            id.includes("node_modules/@xterm/addon-fit") ||
            id.includes("node_modules/@xterm/addon-search")
          ) {
            return "xterm";
          }
          return undefined;
        },
      },
    },
    target: "chrome140",
  },
  css: {
    // Sans configuration en ligne, Vite cherche un fichier PostCSS en remontant
    // depuis apps/coder et tombe sur le postcss.config.mjs de la racine du
    // dépôt (Tailwind du site Next). Sur un runner CI où seules les dépendances
    // d'apps/coder sont installées, ce fichier échoue sur
    // « Cannot find module '@tailwindcss/postcss' » dès la première feuille
    // CSS et casse le build du renderer, donc les installeurs. Cet objet coupe
    // la recherche : l'application n'utilise ni PostCSS ni Tailwind.
    postcss: { plugins: [] },
  },
  optimizeDeps: {
    include: ["monaco-editor", "react", "react-dom", "shiki"],
  },
  plugins: [react()],
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@resources": path.resolve(__dirname, "resources"),
    },
  },
  root: ".",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});
