import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../../types/api'

interface AuthState {
  accessToken: string | null
  user: User | null
  guestAccessToken: string | null
  guestSessionId: string | null
  setAccessToken: (token: string) => void
  setCurrentUser: (user: User) => void
  setAuth: (token: string, user: User) => void
  setGuestSession: (guestAccessToken: string, guestSessionId: string) => void
  clearAuth: () => void
  clearGuestSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      guestAccessToken: null,
      guestSessionId: null,
      setAccessToken: (token) => set({ accessToken: token }),
      setCurrentUser: (user) => set({ user }),
      setAuth: (token, user) => set({ accessToken: token, user }),
      setGuestSession: (guestAccessToken, guestSessionId) =>
        set({ guestAccessToken, guestSessionId }),
      clearAuth: () => set({ accessToken: null, user: null }),
      clearGuestSession: () =>
        set({ guestAccessToken: null, guestSessionId: null }),
    }),
    {
      name: 'chatty-auth-store',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        guestAccessToken: state.guestAccessToken,
        guestSessionId: state.guestSessionId,
      }),
    },
  ),
)
