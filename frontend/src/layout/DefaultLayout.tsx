import { useEffect, useState } from 'react'
import { Link, Outlet, useBlocker, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Menu } from 'lucide-react'
import Button from '../shared/ui/Button'
import SideBar from '../features/chatrooms/components/SideBar'
import PushNotificationButton from '../features/notifications/components/PushNotificationButton'
import SendTestNotificationButton from '../features/notifications/components/SendTestNotificationButton'
import ForegroundNotificationPopup from '../features/notifications/components/ForegroundNotificationPopup'
import { useFcmForeground } from '../features/notifications/hooks/useFcmForeground'
import { useUIStore } from '../shared/stores/uiStore'
import { useStableBackNavigation } from '../shared/hooks/useStableBackNavigation'
import LoginModal from '../features/auth/components/LoginModal'
import { useAuthStore } from '../shared/stores/authStore'
import { chatroomKeys } from '../features/chatrooms/queryKeys'
import { ROUTES } from '../routes/paths'

export default function DefaultLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const { popup, clearPopup, getPopupChatroomPath } = useFcmForeground()
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const { showExitHint, handlePopNavigation } = useStableBackNavigation({
    isSidebarOpen,
    setSidebarOpen,
  })
  useEffect(() => {
    if (!popup) return
    const timeoutId = window.setTimeout(() => {
      clearPopup()
    }, 5000)
    return () => window.clearTimeout(timeoutId)
  }, [popup, clearPopup])

  const handlePopupClick = () => {
    const targetPath = getPopupChatroomPath()
    if (!targetPath) return
    navigate(targetPath)
    clearPopup()
  }

  useBlocker(({ historyAction }) => {
    switch (historyAction) {
      case 'PUSH':
      case 'REPLACE':
        setSidebarOpen(false)
        return false
      case 'POP':
        return handlePopNavigation()
      default:
        return false
    }
  })

  return (
    <div
      className="flex flex-row h-full min-h-0 max-h-full w-full mx-auto overflow-hidden md:border-x border-color transition-colors duration-200 bg-white"
      style={{ borderColor: 'var(--border-color)', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}
    >
      <ForegroundNotificationPopup
        open={Boolean(popup)}
        title={popup?.title ?? ''}
        body={popup?.body ?? ''}
        onClick={handlePopupClick}
        onClose={clearPopup}
      />
      {showExitHint ? (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
          aria-live="polite"
        >
          <div className="rounded-full bg-gray-900/95 text-white text-sm px-4 py-2 shadow-lg">
            Press back again to exit
          </div>
        </div>
      ) : null}

      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out md:border-r bg-white overflow-hidden flex flex-col shrink-0 z-50 fixed md:static inset-0 md:inset-auto ${
          isSidebarOpen
            ? 'w-full max-w-full md:w-1/3 md:min-w-[280px] md:max-w-[320px] pointer-events-auto opacity-100'
            : 'w-0 min-w-0 max-w-0 md:w-16 md:min-w-[64px] md:max-w-[64px] md:items-center pointer-events-none md:pointer-events-auto opacity-0 md:opacity-100'
        }`}
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="h-14 md:h-16 flex items-center shrink-0 w-full justify-between px-3 sm:px-4 md:px-3">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
            <Menu className="h-6 w-6" />
          </Button>
          <div className="md:hidden flex flex-1 justify-start">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-9 w-9">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          {isSidebarOpen && accessToken ? (
            <div className="flex items-center gap-2">
              <PushNotificationButton />
              <SendTestNotificationButton />
            </div>
          ) : null}
        </div>

        <div
          className={`flex-1 w-full md:w-full md:min-w-[280px] overflow-y-auto transition-opacity duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <SideBar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden relative w-full">
        {/* Header */}
        <header
          className="h-14 md:h-16 flex items-center justify-between px-3 sm:px-4 md:px-6 border-b shrink-0 gap-3 bg-white z-30"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-9 w-9">
                <Menu className="h-6 w-6" />
              </Button>
            </div>
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
            >
              <img
                src="/icon.svg"
                alt=""
                className="w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-lg"
                width={32}
                height={32}
                aria-hidden
              />
              <div className="flex flex-col min-w-0">
                <h1 className="font-bold tracking-tight text-lg md:text-xl text-gray-900 leading-tight truncate">
                  Chatty
                </h1>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {accessToken ? (
              <span
                className="text-sm text-gray-600 max-w-[140px] truncate"
                title={currentUser?.username}
              >
                {currentUser?.username}
              </span>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="h-9"
                onClick={() => setLoginModalOpen(true)}
              >
                Sign in
              </Button>
            )}
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main
          className={`flex-1 min-h-0 flex flex-col relative w-full overflow-hidden bg-gray-50 transition-opacity duration-300 opacity-100`}
        >
          <Outlet />
        </main>
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
        }}
      />
    </div>
  )
}
