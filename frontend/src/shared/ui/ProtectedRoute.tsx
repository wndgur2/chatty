import { Navigate, Outlet, useLocation } from 'react-router'
import { ROUTES } from '../../routes/paths'
import { useAuthStore } from '../stores/authStore'

export default function ProtectedRoute() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => !!state.accessToken)

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
