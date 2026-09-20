import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpg'],
      manifest: {
        name: 'Shelf Life - Controle de Validade',
        short_name: 'ShelfLife',
        description: 'Controle de Validade de Produtos',
        theme_color: '#F9F9F6',
        background_color: '#F9F9F6',
        display: 'standalone',
        icons: [
          {
            src: 'logo.jpg',
            sizes: '192x192 512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ]
});
