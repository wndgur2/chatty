import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const registerDeviceTokenSpy = vi.hoisted(() => vi.fn())
const isBrowserPushMessagingSupportedSpy = vi.hoisted(() => vi.fn())
const getFirebaseConfigFromEnvSpy = vi.hoisted(() => vi.fn())
const getFcmVapidKeyFromEnvSpy = vi.hoisted(() => vi.fn())
const registerMessagingServiceWorkerSpy = vi.hoisted(() => vi.fn())
const getFirebaseAppSpy = vi.hoisted(() => vi.fn())
const getMessagingInstanceSpy = vi.hoisted(() => vi.fn())
const getFcmDeviceTokenSpy = vi.hoisted(() => vi.fn())
const getRegistrationSpy = vi.hoisted(() => vi.fn())
const requestPermissionSpy = vi.hoisted(() => vi.fn())

vi.mock('./useRegisterNotification', () => ({
  useRegisterNotification: () => ({
    mutateAsync: registerDeviceTokenSpy,
  }),
}))

vi.mock('../../../shared/notifications/firebaseConfig', () => ({
  getFirebaseConfigFromEnv: getFirebaseConfigFromEnvSpy,
  getFcmVapidKeyFromEnv: getFcmVapidKeyFromEnvSpy,
}))

vi.mock('../../../shared/notifications/firebase', () => ({
  FCM_SERVICE_WORKER_SCOPE: '/firebase-cloud-messaging-push-scope',
  isBrowserPushMessagingSupported: isBrowserPushMessagingSupportedSpy,
  registerMessagingServiceWorker: registerMessagingServiceWorkerSpy,
  getFirebaseApp: getFirebaseAppSpy,
  getMessagingInstance: getMessagingInstanceSpy,
  getFcmDeviceToken: getFcmDeviceTokenSpy,
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

async function renderAutoHook() {
  vi.resetModules()
  const { useAutoPushNotifications } = await import('./useAutoPushNotifications')
  renderHook(() => useAutoPushNotifications(), { wrapper })
}

describe('useAutoPushNotifications', () => {
  beforeEach(() => {
    registerDeviceTokenSpy.mockReset()
    registerDeviceTokenSpy.mockResolvedValue({ ok: true })
    isBrowserPushMessagingSupportedSpy.mockReset()
    isBrowserPushMessagingSupportedSpy.mockResolvedValue(true)
    getFirebaseConfigFromEnvSpy.mockReset()
    getFirebaseConfigFromEnvSpy.mockReturnValue({
      apiKey: 'key',
      authDomain: 'domain',
      projectId: 'project',
      messagingSenderId: 'sender',
      appId: 'app',
    })
    getFcmVapidKeyFromEnvSpy.mockReset()
    getFcmVapidKeyFromEnvSpy.mockReturnValue('vapid-key')
    registerMessagingServiceWorkerSpy.mockReset()
    registerMessagingServiceWorkerSpy.mockResolvedValue({ scope: '/' } as ServiceWorkerRegistration)
    getFirebaseAppSpy.mockReset()
    getFirebaseAppSpy.mockReturnValue({ name: 'app' })
    getMessagingInstanceSpy.mockReset()
    getMessagingInstanceSpy.mockReturnValue({ name: 'messaging' })
    getFcmDeviceTokenSpy.mockReset()
    getFcmDeviceTokenSpy.mockResolvedValue('token-1')
    getRegistrationSpy.mockReset()
    getRegistrationSpy.mockResolvedValue(undefined)
    requestPermissionSpy.mockReset()
    requestPermissionSpy.mockResolvedValue('granted')
    localStorage.clear()

    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: getRegistrationSpy,
      },
    })
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: requestPermissionSpy,
    })
  })

  it('skips all work when push messaging is unsupported', async () => {
    isBrowserPushMessagingSupportedSpy.mockResolvedValue(false)

    await renderAutoHook()

    await waitFor(() => {
      expect(isBrowserPushMessagingSupportedSpy).toHaveBeenCalled()
    })
    expect(requestPermissionSpy).not.toHaveBeenCalled()
    expect(registerDeviceTokenSpy).not.toHaveBeenCalled()
  })

  it('requests permission once and registers token when granted', async () => {
    await renderAutoHook()

    await waitFor(() => {
      expect(requestPermissionSpy).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(registerDeviceTokenSpy).toHaveBeenCalledWith({ deviceToken: 'token-1' })
    })
    expect(localStorage.getItem('chatty:fcm-registered')).toBe('true')
  })

  it('does not register when permission is denied', async () => {
    requestPermissionSpy.mockResolvedValue('denied')

    await renderAutoHook()

    await waitFor(() => {
      expect(requestPermissionSpy).toHaveBeenCalledTimes(1)
    })
    expect(registerDeviceTokenSpy).not.toHaveBeenCalled()
  })

  it('refreshes token when already granted and registration marker exists', async () => {
    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission: requestPermissionSpy,
    })
    localStorage.setItem('chatty:fcm-registered', 'true')

    await renderAutoHook()

    await waitFor(() => {
      expect(getRegistrationSpy).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(registerDeviceTokenSpy).toHaveBeenCalledWith({ deviceToken: 'token-1' })
    })
    expect(requestPermissionSpy).not.toHaveBeenCalled()
  })

  it('falls back to registering service worker when no existing registration is found', async () => {
    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission: requestPermissionSpy,
    })
    localStorage.setItem('chatty:fcm-registered', 'true')
    getRegistrationSpy.mockResolvedValue(null)

    await renderAutoHook()

    await waitFor(() => {
      expect(registerMessagingServiceWorkerSpy).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(registerDeviceTokenSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('swallows registration errors without throwing', async () => {
    registerMessagingServiceWorkerSpy.mockRejectedValueOnce(new Error('network'))

    await expect(renderAutoHook()).resolves.toBeUndefined()
    await waitFor(() => {
      expect(requestPermissionSpy).toHaveBeenCalled()
    })
  })
})
