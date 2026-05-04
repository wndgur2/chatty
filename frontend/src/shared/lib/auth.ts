import type { User } from '../../types/api'
import { useAuthStore } from '../stores/authStore'

export const setAccessToken = (token: string) => {
  useAuthStore.getState().setAccessToken(token)
}

export const getAccessToken = () => useAuthStore.getState().accessToken

export const getGuestAccessToken = () => useAuthStore.getState().guestAccessToken

export const getGuestSessionId = () => useAuthStore.getState().guestSessionId

export const setCurrentUser = (user: User) => {
  useAuthStore.getState().setCurrentUser(user)
}

export const getCurrentUser = (): User | null => useAuthStore.getState().user

export const setGuestSession = (guestAccessToken: string, guestSessionId: string) => {
  useAuthStore.getState().setGuestSession(guestAccessToken, guestSessionId)
}

export const clearAuth = () => {
  useAuthStore.getState().clearAuth()
}

export const clearGuestSession = () => {
  useAuthStore.getState().clearGuestSession()
}

export const isMemberAuthenticated = () => !!getAccessToken()

/** Member (registered) session — guests use `guestAccessToken` only. */
export const isAuthenticated = isMemberAuthenticated
