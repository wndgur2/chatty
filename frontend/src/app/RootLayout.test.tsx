import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RootLayout from './RootLayout'
import { ROUTES } from '../routes/paths'

const navigateSpy = vi.hoisted(() => vi.fn())
const registerSessionExpiredHandlerSpy = vi.hoisted(() => vi.fn())
const useAutoPushNotificationsSpy = vi.hoisted(() => vi.fn())
const useEnsureGuestSessionSpy = vi.hoisted(() => vi.fn())

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => navigateSpy,
    Outlet: () => <div>root-outlet</div>,
  }
})

vi.mock('../shared/lib/sessionExpired', () => ({
  registerSessionExpiredHandler: registerSessionExpiredHandlerSpy,
}))

vi.mock('../features/notifications/hooks/useAutoPushNotifications', () => ({
  useAutoPushNotifications: useAutoPushNotificationsSpy,
}))

vi.mock('../features/auth/hooks/useEnsureGuestSession', () => ({
  useEnsureGuestSession: useEnsureGuestSessionSpy,
}))

describe('RootLayout', () => {
  beforeEach(() => {
    navigateSpy.mockReset()
    registerSessionExpiredHandlerSpy.mockReset()
    useAutoPushNotificationsSpy.mockReset()
    useEnsureGuestSessionSpy.mockReset()
  })

  it('renders outlet and wires session-expired redirect handler', () => {
    render(<RootLayout />)

    expect(screen.getByText('root-outlet')).toBeTruthy()
    expect(useEnsureGuestSessionSpy).toHaveBeenCalledTimes(1)
    expect(useAutoPushNotificationsSpy).toHaveBeenCalledTimes(1)
    expect(registerSessionExpiredHandlerSpy).toHaveBeenCalled()

    const callback = registerSessionExpiredHandlerSpy.mock.calls[0][0] as (
      reason: 'member' | 'guest',
    ) => void
    callback('member')
    expect(navigateSpy).toHaveBeenCalledWith(ROUTES.LOGIN, { replace: true })
    navigateSpy.mockClear()
    callback('guest')
    expect(navigateSpy).toHaveBeenCalledWith(ROUTES.HOME, { replace: true })
  })
})
