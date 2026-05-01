import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { firebaseMessagingSwPlugin } from './vite-plugin-firebase-messaging-sw'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const httpsEnabled = env.VITE_HTTPS === 'true'
  const certPath = resolve(process.cwd(), env.VITE_HTTPS_CERT ?? './certs/localhost.pem')
  const keyPath = resolve(process.cwd(), env.VITE_HTTPS_KEY ?? './certs/localhost-key.pem')
  const canUseHttps = httpsEnabled && existsSync(certPath) && existsSync(keyPath)

  return {
    server: canUseHttps
      ? {
          https: {
            cert: readFileSync(certPath),
            key: readFileSync(keyPath),
          },
        }
      : undefined,
    plugins: [
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],
        workbox: {
          // Avoid terser plugin early-exit in this environment.
          mode: 'development',
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 8,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
          ],
        },
        manifest: {
          id: '/',
          name: 'Chatty - Texting with AI',
          short_name: 'Chatty',
          description: 'A fast real-time texting app with AI.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'browser'],
          orientation: 'portrait',
          lang: 'en',
          dir: 'ltr',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          categories: ['social', 'communication', 'productivity'],
          prefer_related_applications: false,
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
            },
            {
              src: '/pwa/maskable-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Open Chats',
              short_name: 'Chats',
              description: 'Jump directly into your conversation list.',
              url: '/',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Login',
              short_name: 'Login',
              description: 'Go to the login screen quickly.',
              url: '/login',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
      firebaseMessagingSwPlugin(),
    ],
  }
})
