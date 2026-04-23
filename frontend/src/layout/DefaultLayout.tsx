import { useEffect } from 'react'
import { Outlet, Link, useBlocker, useNavigate } from 'react-router'
import { Menu } from 'lucide-react'
import { ROUTES } from '../routes/paths'
import Button from '../shared/ui/Button'
import SideBar from '../features/chatrooms/components/SideBar'
import PushNotificationButton from '../features/notifications/components/PushNotificationButton'
import SendTestNotificationButton from '../features/notifications/components/SendTestNotificationButton'
import ForegroundNotificationPopup from '../features/notifications/components/ForegroundNotificationPopup'
import { useFcmForeground } from '../features/notifications/hooks/useFcmForeground'
import { useUIStore } from '../shared/stores/uiStore'
import GithubLink from '../shared/ui/GithubLink'

const releaseSha = import.meta.env.VITE_RELEASE_SHA?.slice(0, 7)
const releaseBuiltAtValue = import.meta.env.VITE_RELEASE_BUILT_AT

function formatReleaseBuiltAt(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toISOString().replace('T', ' ').replace('.000Z', ' UTC')
}

export default function DefaultLayout() {
  const navigate = useNavigate()
  const { popup, clearPopup, getPopupChatroomPath } = useFcmForeground()
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const formattedBuiltAt = releaseBuiltAtValue ? formatReleaseBuiltAt(releaseBuiltAtValue) : null
  const releaseLabel =
    releaseSha && formattedBuiltAt
      ? `sha:${releaseSha} • built:${formattedBuiltAt}`
      : null

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
    if (historyAction === 'PUSH' || historyAction === 'REPLACE') {
      setSidebarOpen(false)
      return false
    }
    return true
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

      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out md:border-r bg-white overflow-hidden flex flex-col shrink-0 z-50 fixed md:static inset-0 md:inset-auto ${
          isSidebarOpen
            ? 'w-full max-w-full md:w-1/3 md:min-w-[280px] md:max-w-[320px] pointer-events-auto opacity-100'
            : 'w-0 min-w-0 max-w-0 md:w-16 md:min-w-[64px] md:max-w-[64px] md:items-center pointer-events-none md:pointer-events-auto opacity-0 md:opacity-100'
        }`}
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="h-16 flex items-center shrink-0 w-full justify-between px-3 md:px-3 px-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
            <Menu className="h-6 w-6" />
          </Button>
          <div className="md:hidden flex flex-1 justify-start">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          {isSidebarOpen ? (
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
          className="h-16 flex items-center justify-between px-4 md:px-6 border-b shrink-0 gap-4 bg-white z-30"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/icon.svg"
                alt=""
                className="w-8 h-8 shrink-0 rounded-lg"
                width={32}
                height={32}
                aria-hidden
              />
              <div className="flex flex-col">
                <h1 className="font-bold tracking-tight text-xl text-gray-900 leading-tight">Chatty</h1>
                {releaseLabel ? (
                  <span className="text-[10px] text-gray-500 leading-tight">{releaseLabel}</span>
                ) : null}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <GithubLink size="medium" className="h-9" />
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main
          className={`flex-1 min-h-0 flex flex-col relative w-full overflow-hidden bg-gray-50 transition-opacity duration-300 opacity-100`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
