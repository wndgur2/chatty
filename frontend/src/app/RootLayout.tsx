import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { ROUTES } from '../routes/paths'
import { registerSessionExpiredHandler } from '../shared/lib/sessionExpired'
import { useAutoPushNotifications } from '../features/notifications/hooks/useAutoPushNotifications'

export default function RootLayout() {
  useAutoPushNotifications()
  const navigate = useNavigate()

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      navigate(ROUTES.LOGIN, { replace: true })
    })
    return () => registerSessionExpiredHandler(null)
  }, [navigate])

  return <Outlet />
}
