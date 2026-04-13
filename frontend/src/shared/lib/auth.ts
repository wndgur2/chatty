import type { User } from '../../types/api'
import { useAuthStore } from '../stores/authStore'

export const setAccessToken = (token: string) => {
  useAuthStore.getState().setAccessToken(token)
}

export const getAccessToken = () => useAuthStore.getState().accessToken

export const setCurrentUser = (user: User) => {
  useAuthStore.getState().setCurrentUser(user)
}

export const getCurrentUser = (): User | null => useAuthStore.getState().user

export const clearAuth = () => {
  useAuthStore.getState().clearAuth()
}

export const isAuthenticated = () => !!getAccessToken()
