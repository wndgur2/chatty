import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../../types/api'

interface AuthState {
  accessToken: string | null
  user: User | null
  setAccessToken: (token: string) => void
  setCurrentUser: (user: User) => void
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAccessToken: (token) => set({ accessToken: token }),
      setCurrentUser: (user) => set({ user }),
      setAuth: (token, user) => set({ accessToken: token, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'chatty-auth-store',
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    },
  ),
)
