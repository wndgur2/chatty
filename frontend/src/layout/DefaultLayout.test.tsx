import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateSpy = vi.hoisted(() => vi.fn())
const useFcmForegroundSpy = vi.hoisted(() => vi.fn())
const useUIStoreSpy = vi.hoisted(() => vi.fn())
const useStableBackNavigationSpy = vi.hoisted(() => vi.fn())
const clearPopupSpy = vi.hoisted(() => vi.fn())
const getPopupChatroomPathSpy = vi.hoisted(() => vi.fn())
const toggleSidebarSpy = vi.hoisted(() => vi.fn())
const setSidebarOpenSpy = vi.hoisted(() => vi.fn())
const useBlockerSpy = vi.hoisted(() => vi.fn())
const handlePopNavigationSpy = vi.hoisted(() => vi.fn())

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
    Outlet: () => <div>layout-outlet</div>,
    useNavigate: () => navigateSpy,
    useBlocker: useBlockerSpy,
  }
})

vi.mock('../features/notifications/hooks/useFcmForeground', () => ({
  useFcmForeground: useFcmForegroundSpy,
}))
vi.mock('../shared/stores/uiStore', () => ({ useUIStore: useUIStoreSpy }))
vi.mock('../shared/hooks/useStableBackNavigation', () => ({
  useStableBackNavigation: useStableBackNavigationSpy,
}))
vi.mock('../features/chatrooms/components/SideBar', () => ({ default: () => <div>sidebar</div> }))
vi.mock('../features/notifications/components/PushNotificationButton', () => ({
  default: () => <button>push</button>,
}))
vi.mock('../features/notifications/components/SendTestNotificationButton', () => ({
  default: () => <button>send-test</button>,
}))
vi.mock('../features/notifications/components/ForegroundNotificationPopup', () => ({
  default: ({
    open,
    title,
    body,
    onClick,
  }: {
    open: boolean
    title: string
    body: string
    onClick: () => void
  }) => (
    <button onClick={onClick}>{open ? `${title}:${body}` : 'no-popup'}</button>
  ),
}))
vi.mock('../shared/ui/GithubLink', () => ({ default: () => <div>github-link</div> }))

describe('DefaultLayout', () => {
  const loadDefaultLayout = async () => {
    const mod = await import('./DefaultLayout')
    return mod.default
  }

  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    navigateSpy.mockReset()
    clearPopupSpy.mockReset()
    getPopupChatroomPathSpy.mockReset()
    toggleSidebarSpy.mockReset()
    setSidebarOpenSpy.mockReset()
    useBlockerSpy.mockReset()
    handlePopNavigationSpy.mockReset()
    useFcmForegroundSpy.mockReturnValue({
      popup: { title: 'AI', body: 'Hi' },
      clearPopup: clearPopupSpy,
      getPopupChatroomPath: getPopupChatroomPathSpy,
    })
    useStableBackNavigationSpy.mockReturnValue({
      showExitHint: false,
      handlePopNavigation: handlePopNavigationSpy,
    })
    useUIStoreSpy.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        isSidebarOpen: true,
        toggleSidebar: toggleSidebarSpy,
        setSidebarOpen: setSidebarOpenSpy,
      }),
    )
  })

  it('renders shell and navigates when foreground popup is clicked', async () => {
    const DefaultLayout = await loadDefaultLayout()
    getPopupChatroomPathSpy.mockReturnValue('/chat/2')
    render(<DefaultLayout />)

    expect(screen.getByText('layout-outlet')).toBeTruthy()
    expect(screen.getByText('sidebar')).toBeTruthy()
    fireEvent.click(screen.getByText('AI:Hi'))
    expect(navigateSpy).toHaveBeenCalledWith('/chat/2')
    expect(clearPopupSpy).toHaveBeenCalled()
  })

  it('renders release metadata when release env variables exist', async () => {
    vi.stubEnv('VITE_RELEASE_SHA', '1a2b3c4d5e6f')
    vi.stubEnv('VITE_RELEASE_BUILT_AT', '2026-04-23T12:34:56Z')
    const DefaultLayout = await loadDefaultLayout()

    render(<DefaultLayout />)

    expect(screen.getByText('1a2b3c4 • 2026-04-23 12:34:56')).toBeTruthy()
  })

  it('hides release metadata when release env variables are missing', async () => {
    const DefaultLayout = await loadDefaultLayout()

    render(<DefaultLayout />)

    expect(screen.queryByText(/sha:/i)).toBeNull()
  })

  it('shows exit hint when stable back navigation requests it', async () => {
    useStableBackNavigationSpy.mockReturnValue({
      showExitHint: true,
      handlePopNavigation: handlePopNavigationSpy,
    })
    const DefaultLayout = await loadDefaultLayout()

    render(<DefaultLayout />)

    expect(screen.getByText('Press back again to exit')).toBeTruthy()
  })

  it('delegates POP navigation blocking to stable back navigation hook', async () => {
    handlePopNavigationSpy.mockReturnValue(true)
    const DefaultLayout = await loadDefaultLayout()

    render(<DefaultLayout />)

    const blockerHandler = useBlockerSpy.mock.calls[0]?.[0] as
      | ((args: { historyAction: 'POP' | 'PUSH' | 'REPLACE' }) => boolean)
      | undefined
    expect(blockerHandler).toBeTruthy()

    const shouldBlockPop = blockerHandler?.({ historyAction: 'POP' })

    expect(handlePopNavigationSpy).toHaveBeenCalledTimes(1)
    expect(shouldBlockPop).toBe(true)
  })
})
