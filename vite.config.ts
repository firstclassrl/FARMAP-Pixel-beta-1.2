import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import pkg from './package.json' assert { type: 'json' };

const enablePwa = process.env.VITE_ENABLE_PWA === 'true';
const enableSourcemap = process.env.VITE_SOURCEMAP === 'true';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [
    react(),
    ...(enablePwa ? [VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'PIXEL ICON.png'],
      manifest: {
        name: 'Pixel CRM - FARMAP',
        short_name: 'Pixel CRM',
        description: 'Gestione commerciale FARMAP',
        theme_color: '#dc2626',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'PIXEL ICON.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'PIXEL ICON.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })] : [])
  ],
  build: {
    sourcemap: enableSourcemap,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-select', '@radix-ui/react-label', '@radix-ui/react-alert-dialog'],
          form: ['react-hook-form', '@hookform/resolvers', 'zod'],
          data: ['date-fns', 'papaparse', 'xlsx']
        }
      }
    },
    chunkSizeWarningLimit: 2400
  },
  server: {
    host: true,
    port: 5173,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    },
    cors: {
      origin: true,
      credentials: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
      , 'ws': path.resolve(__dirname, './src/shims/empty.ts')
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts']
  }
});