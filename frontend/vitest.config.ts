import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { firebaseMessagingSwPlugin } from './vite-plugin-firebase-messaging-sw'

export default defineConfig({
  plugins: [react(), tailwindcss(), firebaseMessagingSwPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    env: {
      VITE_FCM_VAPID_KEY: 'test-vapid-key',
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: '1:123:web:abc',
    },
  },
})
