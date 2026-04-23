import { afterEach, describe, expect, it, vi } from 'vitest'
import { getFcmVapidKeyFromEnv, getFirebaseConfigFromEnv } from './firebaseConfig'

describe('firebase config env helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns null when required firebase env values are missing', () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', '')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '')
    vi.stubEnv('VITE_FIREBASE_APP_ID', '')

    expect(getFirebaseConfigFromEnv()).toBeNull()
  })

  it('returns firebase options when all env values exist', () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'api-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'auth.domain')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'project')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'sender')
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'app-id')

    expect(getFirebaseConfigFromEnv()).toEqual({
      apiKey: 'api-key',
      authDomain: 'auth.domain',
      projectId: 'project',
      messagingSenderId: 'sender',
      appId: 'app-id',
    })
  })

  it('returns vapid key or null', () => {
    vi.stubEnv('VITE_FCM_VAPID_KEY', '')
    expect(getFcmVapidKeyFromEnv()).toBeNull()

    vi.stubEnv('VITE_FCM_VAPID_KEY', 'vapid')
    expect(getFcmVapidKeyFromEnv()).toBe('vapid')
  })
})
