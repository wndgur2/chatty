import { useEffect } from 'react'
import { useRegisterNotification } from './useRegisterNotification'
import {
  FCM_SERVICE_WORKER_SCOPE,
  getFirebaseApp,
  getFcmDeviceToken,
  getMessagingInstance,
  isBrowserPushMessagingSupported,
  registerMessagingServiceWorker,
} from '../../../shared/notifications/firebase'
import {
  getFirebaseConfigFromEnv,
  getFcmVapidKeyFromEnv,
} from '../../../shared/notifications/firebaseConfig'

const STORAGE_KEY = 'chatty:fcm-registered'
let hasAutoRequestedPushPermission = false

type RegisterDeviceTokenFn = (payload: { deviceToken: string }) => Promise<unknown>

async function canUsePushNotifications() {
  if (!(await isBrowserPushMessagingSupported())) return false
  if (!getFirebaseConfigFromEnv() || !getFcmVapidKeyFromEnv()) return false
  return true
}

async function registerGrantedPermission(registerDeviceToken: RegisterDeviceTokenFn) {
  const registration = await registerMessagingServiceWorker()
  const app = getFirebaseApp()
  if (!app) throw new Error('Missing Firebase app configuration')
  const messaging = getMessagingInstance(app)
  const token = await getFcmDeviceToken(messaging, registration)
  await registerDeviceToken({ deviceToken: token })
  localStorage.setItem(STORAGE_KEY, 'true')
}

export function useAutoPushNotifications() {
  const { mutateAsync: registerDeviceToken } = useRegisterNotification()

  useEffect(() => {
    if (hasAutoRequestedPushPermission) return
    hasAutoRequestedPushPermission = true

    let cancelled = false

    const run = async () => {
      if (!(await canUsePushNotifications())) return
      if (typeof Notification === 'undefined' || Notification.permission !== 'default') return

      const permission = await Notification.requestPermission()
      if (cancelled || permission !== 'granted') return

      try {
        await registerGrantedPermission(registerDeviceToken)
      } catch {
        // User can retry from the sidebar button.
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [registerDeviceToken])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!(await canUsePushNotifications())) return
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      if (localStorage.getItem(STORAGE_KEY) !== 'true') return

      const app = getFirebaseApp()
      if (!app) return

      try {
        const existingRegistration =
          (await navigator.serviceWorker.getRegistration(FCM_SERVICE_WORKER_SCOPE)) ?? null
        if (cancelled) return
        const registration = existingRegistration ?? (await registerMessagingServiceWorker())
        const messaging = getMessagingInstance(app)
        const token = await getFcmDeviceToken(messaging, registration)
        await registerDeviceToken({ deviceToken: token })
      } catch {
        // Token refresh is best-effort and can be retried manually.
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [registerDeviceToken])
}
