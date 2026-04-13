import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging'
import { getFirebaseConfigFromEnv, getFcmVapidKeyFromEnv } from './firebaseConfig'

export const FCM_SERVICE_WORKER_PATH = '/firebase-messaging-sw.js'
export const FCM_SERVICE_WORKER_SCOPE = '/firebase-cloud-messaging-push-scope'

let cachedApp: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp | null {
  const config = getFirebaseConfigFromEnv()
  if (!config) return null
  if (!cachedApp) {
    cachedApp = getApps().length ? getApps()[0]! : initializeApp(config)
  }
  return cachedApp
}

export async function isBrowserPushMessagingSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false
  return isSupported()
}

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(FCM_SERVICE_WORKER_PATH, {
    scope: FCM_SERVICE_WORKER_SCOPE,
  })
}

export function getMessagingInstance(app: FirebaseApp): Messaging {
  return getMessaging(app)
}

export async function getFcmDeviceToken(
  messaging: Messaging,
  serviceWorkerRegistration: ServiceWorkerRegistration,
): Promise<string> {
  const vapidKey = getFcmVapidKeyFromEnv()
  if (!vapidKey) {
    throw new Error('VITE_FCM_VAPID_KEY is not set')
  }
  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  })
}

export function onForegroundMessage(
  messaging: Messaging,
  handler: (payload: MessagePayload) => void,
): () => void {
  return onMessage(messaging, handler)
}
