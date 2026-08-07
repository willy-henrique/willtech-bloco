/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Will · Assistente pessoal',
          short_name: 'Will',
          description: 'Capture e organize sua memória em segundos.',
          theme_color: '#f7f6f3',
          background_color: '#f7f6f3',
          display: 'standalone',
          start_url: '/',
          lang: 'pt-BR',
          icons: [
            {
              src: '/icons/pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icons/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        },
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            motion: ['framer-motion'],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      globals: true,
    },
  };
});

