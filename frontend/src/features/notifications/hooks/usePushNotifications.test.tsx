import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePushNotifications } from './usePushNotifications'

const registerSpy = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    status: 'success' as const,
    message: 'FCM token registered successfully.',
  }),
)

vi.mock('./useRegisterNotification', () => ({
  useRegisterNotification: () => ({
    mutateAsync: registerSpy,
    isPending: false,
  }),
}))

vi.mock('../../../shared/notifications/firebaseConfig', () => ({
  getFirebaseConfigFromEnv: () => ({
    apiKey: 'k',
    authDomain: 'a',
    projectId: 'p',
    messagingSenderId: 's',
    appId: 'i',
  }),
  getFcmVapidKeyFromEnv: () => 'test-vapid-key',
}))

vi.mock('../../../shared/notifications/firebase', () => ({
  isBrowserPushMessagingSupported: () => Promise.resolve(true),
  getFirebaseApp: () => ({}),
  getMessagingInstance: () => ({}),
  getFcmDeviceToken: () => Promise.resolve('mock-fcm-token'),
  registerMessagingServiceWorker: () =>
    Promise.resolve({} as ServiceWorkerRegistration),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('usePushNotifications', () => {
  beforeEach(() => {
    registerSpy.mockClear()
    localStorage.clear()
    vi.stubGlobal(
      'Notification',
      class {
        static permission: NotificationPermission = 'default'
        static requestPermission = vi.fn((): Promise<NotificationPermission> => {
          return Promise.resolve('granted')
        })
      } as unknown as typeof Notification,
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registers device token with backend after user enables push', async () => {
    const { result } = renderHook(() => usePushNotifications(), { wrapper })

    await waitFor(() => {
      expect(result.current.state).toBe('idle')
    })

    await act(async () => {
      await result.current.enablePush()
    })

    await waitFor(() => {
      expect(result.current.state).toBe('enabled')
    })

    expect(registerSpy).toHaveBeenCalledWith({ deviceToken: 'mock-fcm-token' })
    expect(localStorage.getItem('chatty:fcm-registered')).toBe('true')
  })

  it('sets denied state when permission request is rejected', async () => {
    vi.stubGlobal(
      'Notification',
      class {
        static permission: NotificationPermission = 'default'
        static requestPermission = vi.fn((): Promise<NotificationPermission> => {
          return Promise.resolve('denied')
        })
      } as unknown as typeof Notification,
    )

    const { result } = renderHook(() => usePushNotifications(), { wrapper })

    await act(async () => {
      await result.current.enablePush()
    })

    expect(result.current.state).toBe('denied')
    expect(registerSpy).not.toHaveBeenCalled()
  })
})
