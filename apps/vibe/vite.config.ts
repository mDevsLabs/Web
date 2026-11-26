import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  css: {
    // Sans configuration explicite, Vite cherche un fichier PostCSS en remontant
    // depuis apps/vibe et charge le postcss.config.mjs de la racine du dépôt.
    // Ce dernier tente de charger '@tailwindcss/postcss' (utilisé par Next.js),
    // qui n'est pas installé dans apps/vibe (qui utilise @tailwindcss/vite).
    // Déclarer postcss inline avec plugins: [] isole apps/vibe.
    postcss: { plugins: [] },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    // Sous pnpm, les dépendances transitives (ex. react-router pour
    // react-router-dom) et les pairs des paquets file: (@mdevs/icons,
    // @mdevs/ui) vivent dans le store virtuel (.pnpm/). Déréférencer les
    // symlinks est indispensable pour que Rolldown les résolve depuis
    // leur chemin réel, comme `preserveSymlinks: false` dans tsconfig.app.json.
    dedupe: ['react', 'react-dom'],
    preserveSymlinks: false,
  },
  server: {
    port: 3000,
    // Le proxy local doit rester sur le port attendu par l'API_BASE relatif.
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/v1': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/vibe': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/login': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/register': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/verify-login': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/verify-register': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/resend-code': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/models': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/chat': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/speech': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/images': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/upload': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
      '/logout': {
        target: 'https://mai.val.run',
        changeOrigin: true,
      },
    },
  },
})
