import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'

const navigateSpy = vi.hoisted(() => vi.fn())
const mutateSpy = vi.hoisted(() => vi.fn())
const useAuthStoreSpy = vi.hoisted(() => vi.fn())
const useLoginSpy = vi.hoisted(() => vi.fn())

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div>redirect:{to}</div>,
    useNavigate: () => navigateSpy,
  }
})

vi.mock('../features/auth/hooks/useLogin', () => ({ useLogin: useLoginSpy }))
vi.mock('../shared/stores/authStore', () => ({ useAuthStore: useAuthStoreSpy }))

describe('LoginPage', () => {
  beforeEach(() => {
    navigateSpy.mockReset()
    mutateSpy.mockReset()
    useAuthStoreSpy.mockImplementation((selector: (state: { accessToken: string | null }) => unknown) =>
      selector({ accessToken: null }),
    )
    useLoginSpy.mockReturnValue({ mutate: mutateSpy, isPending: false })
  })

  it('renders login form for unauthenticated users', () => {
    render(<LoginPage />)
    expect(screen.getByText('Chatty Login')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy()
  })

  it('submits trimmed username and navigates on success', () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: '  jun  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(mutateSpy).toHaveBeenCalledWith(
      { username: 'jun' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    )

    const options = mutateSpy.mock.calls[0][1] as { onSuccess: () => void }
    options.onSuccess()
    expect(navigateSpy).toHaveBeenCalledWith('/', { replace: true, state: { fromLogin: true } })
  })

  it('redirects authenticated users to home', () => {
    useAuthStoreSpy.mockImplementation((selector: (state: { accessToken: string | null }) => unknown) =>
      selector({ accessToken: 'token' }),
    )
    render(<LoginPage />)
    expect(screen.getByText('redirect:/')).toBeTruthy()
  })
})
