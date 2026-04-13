import { useCallback, useEffect, useState } from 'react'
import { useRegisterNotification } from './useRegisterNotification'
import {
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

export type PushUiState =
  | 'unsupported'
  | 'config_missing'
  | 'denied'
  | 'idle'
  | 'registering'
  | 'enabled'
  | 'error'

type RegisterDeviceTokenFn = (payload: { deviceToken: string }) => Promise<unknown>

async function registerGrantedPermission(registerDeviceToken: RegisterDeviceTokenFn) {
  const registration = await registerMessagingServiceWorker()
  const app = getFirebaseApp()
  if (!app) throw new Error('Missing Firebase app configuration')
  const messaging = getMessagingInstance(app)
  const token = await getFcmDeviceToken(messaging, registration)
  await registerDeviceToken({ deviceToken: token })
  localStorage.setItem(STORAGE_KEY, 'true')
}

function getInitialPushUiState(): PushUiState {
  if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return 'denied'
  if (
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted' &&
    localStorage.getItem(STORAGE_KEY) === 'true'
  ) {
    return 'enabled'
  }
  return 'idle'
}

export function usePushNotifications() {
  const { mutateAsync: registerDeviceToken, isPending } = useRegisterNotification()
  const [state, setState] = useState<PushUiState>(() => getInitialPushUiState())
  const [lastError, setLastError] = useState<string | null>(null)

  const enablePush = useCallback(async () => {
    setLastError(null)
    if (!(await isBrowserPushMessagingSupported())) {
      setState('unsupported')
      return
    }
    if (!getFirebaseConfigFromEnv() || !getFcmVapidKeyFromEnv()) {
      setState('config_missing')
      return
    }

    setState('registering')
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'denied') {
        setState('denied')
        return
      }
      if (permission !== 'granted') {
        setState('idle')
        return
      }

      await registerGrantedPermission(registerDeviceToken)
      setState('enabled')
    } catch (e) {
      setState('error')
      setLastError(e instanceof Error ? e.message : 'Failed to enable notifications')
    }
  }, [registerDeviceToken])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!(await isBrowserPushMessagingSupported())) {
        if (cancelled) return
        setState('unsupported')
        return
      }
      if (!getFirebaseConfigFromEnv() || !getFcmVapidKeyFromEnv()) {
        if (cancelled) return
        setState('config_missing')
        return
      }
      if (Notification.permission === 'denied') {
        if (cancelled) return
        setState('denied')
        return
      }
      if (Notification.permission === 'granted' && localStorage.getItem(STORAGE_KEY) === 'true') {
        if (cancelled) return
        setState('enabled')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const busy = state === 'registering' || isPending

  return {
    state,
    lastError,
    enablePush,
    busy,
  }
}
