import { useActionState, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ROUTES } from '../routes/paths'
import Input from '../shared/ui/Input'
import Button from '../shared/ui/Button'
import { useLogin } from '../features/auth/hooks/useLogin'
import { useAuthStore } from '../shared/stores/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [username, setUsername] = useState('')
  const [loginState, submitLogin, isSubmitting] = useActionState(
    async (_: { error: string }, formData: FormData) => {
      const trimmed = String(formData.get('username') ?? '').trim()
      if (!trimmed) {
        return { error: 'Username is required.' }
      }

      try {
        await loginMutation.mutateAsync({ username: trimmed })
        navigate(ROUTES.HOME, { replace: true, state: { fromLogin: true } })
        return { error: '' }
      } catch {
        return { error: 'Login failed. Please try again.' }
      }
    },
    { error: '' },
  )
  const isAuthenticated = useAuthStore((state) => !!state.accessToken)
  const isBusy = isSubmitting || loginMutation.isPending

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gray-50 px-4">
      <div
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Chatty Login</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in with your username to continue.</p>
        </div>

        <form action={submitLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <Input
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="my-username"
              autoComplete="username"
              autoFocus
              error={loginState.error}
              disabled={isBusy}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={!username.trim() || isBusy}
          >
            {isBusy ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
