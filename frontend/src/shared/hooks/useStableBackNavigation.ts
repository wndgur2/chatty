import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { ROUTES } from '../../routes/paths'

const EXIT_WINDOW_MS = 2000
const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

interface UseStableBackNavigationParams {
  isSidebarOpen: boolean
  setSidebarOpen: (isOpen: boolean) => void
}

interface UseStableBackNavigationResult {
  showExitHint: boolean
  handlePopNavigation: () => boolean
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

export function useStableBackNavigation({
  isSidebarOpen,
  setSidebarOpen,
}: UseStableBackNavigationParams): UseStableBackNavigationResult {
  const location = useLocation()
  const [showExitHint, setShowExitHint] = useState(false)
  const [isExitArmed, setIsExitArmed] = useState(false)
  const exitTimerRef = useRef<number | null>(null)

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }
  }, [])

  const resetExitState = useCallback(() => {
    setIsExitArmed(false)
    setShowExitHint(false)
    clearExitTimer()
  }, [clearExitTimer])

  useEffect(() => clearExitTimer, [clearExitTimer])

  const armExitWindow = useCallback(() => {
    setIsExitArmed(true)
    setShowExitHint(true)

    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current)
    }

    exitTimerRef.current = window.setTimeout(() => {
      setIsExitArmed(false)
      setShowExitHint(false)
      exitTimerRef.current = null
    }, EXIT_WINDOW_MS)
  }, [])

  const handlePopNavigation = useCallback(() => {
    if (isSidebarOpen && isMobileViewport()) {
      setSidebarOpen(false)
      return true
    }

    if (location.pathname !== ROUTES.HOME) {
      resetExitState()
      return false
    }

    if (isExitArmed) {
      resetExitState()
      return false
    }

    armExitWindow()
    return true
  }, [armExitWindow, isExitArmed, isSidebarOpen, location.pathname, resetExitState, setSidebarOpen])

  return {
    showExitHint,
    handlePopNavigation,
  }
}
