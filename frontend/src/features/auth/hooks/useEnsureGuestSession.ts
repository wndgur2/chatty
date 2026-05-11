import { useEffect, useState } from 'react'
import { createGuestSession } from '../../../api/auth'
import { useAuthStore } from '../../../shared/stores/authStore'

export function useEnsureGuestSession() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated())
  const accessToken = useAuthStore((s) => s.accessToken)
  const guestAccessToken = useAuthStore((s) => s.guestAccessToken)
  const setGuestSession = useAuthStore((s) => s.setGuestSession)

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (accessToken || guestAccessToken) return
    let cancelled = false
    void (async () => {
      try {
        const res = await createGuestSession()
        if (!cancelled) {
          setGuestSession(res.accessToken, res.guestSessionId)
        }
      } catch {
        // Network/server errors surface on the next API call.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrated, accessToken, guestAccessToken, setGuestSession])
}
