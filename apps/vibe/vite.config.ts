import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
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
