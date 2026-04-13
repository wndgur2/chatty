import type { FirebaseOptions } from 'firebase/app'

export function getFirebaseConfigFromEnv(): FirebaseOptions | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  const appId = import.meta.env.VITE_FIREBASE_APP_ID
  if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId) {
    return null
  }
  return {
    apiKey,
    authDomain,
    projectId,
    messagingSenderId,
    appId,
  }
}

export function getFcmVapidKeyFromEnv(): string | null {
  const key = import.meta.env.VITE_FCM_VAPID_KEY
  return key ? key : null
}
