import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { ROUTES } from '../routes/paths'
import { registerSessionExpiredHandler } from '../shared/lib/sessionExpired'
import { useAutoPushNotifications } from '../features/notifications/hooks/useAutoPushNotifications'
import { useEnsureGuestSession } from '../features/auth/hooks/useEnsureGuestSession'

export default function RootLayout() {
  useEnsureGuestSession()
  useAutoPushNotifications()
  const navigate = useNavigate()

  useEffect(() => {
    registerSessionExpiredHandler((reason) => {
      if (reason === 'guest') {
        navigate(ROUTES.HOME, { replace: true })
      } else {
        navigate(ROUTES.LOGIN, { replace: true })
      }
    })
    return () => registerSessionExpiredHandler(null)
  }, [navigate])

  return <Outlet />
}
