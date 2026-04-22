import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DefaultLayout from './DefaultLayout'

const navigateSpy = vi.hoisted(() => vi.fn())
const useFcmForegroundSpy = vi.hoisted(() => vi.fn())
const useUIStoreSpy = vi.hoisted(() => vi.fn())
const clearPopupSpy = vi.hoisted(() => vi.fn())
const getPopupChatroomPathSpy = vi.hoisted(() => vi.fn())
const toggleSidebarSpy = vi.hoisted(() => vi.fn())
const setSidebarOpenSpy = vi.hoisted(() => vi.fn())

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
    Outlet: () => <div>layout-outlet</div>,
    useNavigate: () => navigateSpy,
    useBlocker: () => undefined,
  }
})

vi.mock('../features/notifications/hooks/useFcmForeground', () => ({
  useFcmForeground: useFcmForegroundSpy,
}))
vi.mock('../shared/stores/uiStore', () => ({ useUIStore: useUIStoreSpy }))
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
  beforeEach(() => {
    navigateSpy.mockReset()
    clearPopupSpy.mockReset()
    getPopupChatroomPathSpy.mockReset()
    toggleSidebarSpy.mockReset()
    setSidebarOpenSpy.mockReset()
    useFcmForegroundSpy.mockReturnValue({
      popup: { title: 'AI', body: 'Hi' },
      clearPopup: clearPopupSpy,
      getPopupChatroomPath: getPopupChatroomPathSpy,
    })
    useUIStoreSpy.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        isSidebarOpen: true,
        toggleSidebar: toggleSidebarSpy,
        setSidebarOpen: setSidebarOpenSpy,
      }),
    )
  })

  it('renders shell and navigates when foreground popup is clicked', () => {
    getPopupChatroomPathSpy.mockReturnValue('/chat/2')
    render(<DefaultLayout />)

    expect(screen.getByText('layout-outlet')).toBeTruthy()
    expect(screen.getByText('sidebar')).toBeTruthy()
    fireEvent.click(screen.getByText('AI:Hi'))
    expect(navigateSpy).toHaveBeenCalledWith('/chat/2')
    expect(clearPopupSpy).toHaveBeenCalled()
  })
})
