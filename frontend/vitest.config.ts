import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { firebaseMessagingSwPlugin } from './vite-plugin-firebase-messaging-sw'

const enforceCoverage = process.env.VITEST_ENFORCE_COVERAGE === '1'

export default defineConfig({
  plugins: [react(), tailwindcss(), firebaseMessagingSwPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup/vitest.setup.ts'],
    env: {
      VITE_FCM_VAPID_KEY: 'test-vapid-key',
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: '1:123:web:abc',
    },
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.integration.test.ts',
        'src/**/*.integration.test.tsx',
        'src/**/*.contract.test.ts',
        'src/**/*.contract.test.tsx',
        'src/test/**',
        'src/main.tsx',
      ],
      thresholds: enforceCoverage
        ? {
            lines: 60,
            statements: 60,
            functions: 60,
          }
        : undefined,
    },
  },
})
