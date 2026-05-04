import axios, { type InternalAxiosRequestConfig } from 'axios'
import { queryClient } from '../app/providers/queryClient'
import {
  clearAuth,
  clearGuestSession,
  getAccessToken,
  getGuestAccessToken,
} from '../shared/lib/auth'
import { notifySessionExpired } from '../shared/lib/sessionExpired'

const useDevProxy = import.meta.env.DEV && (import.meta.env.VITE_DEV_PROXY_TARGET?.trim()?.length ?? 0) > 0
const apiOrigin = import.meta.env.VITE_API_URL?.trim()
const baseURL = useDevProxy ? '/api' : `${apiOrigin}/api`
const DEV_API_DELAY_MS = 1500

function isAuthLoginRequest(config: InternalAxiosRequestConfig | undefined): boolean {
  const url = config?.url ?? ''
  return url.includes('auth/login')
}

function isAuthGuestSessionRequest(config: InternalAxiosRequestConfig | undefined): boolean {
  const url = config?.url ?? ''
  return url.includes('auth/guest-session')
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  async (config) => {
    if (import.meta.env.DEV) {
      await new Promise((resolve) => {
        setTimeout(resolve, DEV_API_DELAY_MS)
      })
    }

    const memberToken = getAccessToken()
    const guestToken = getGuestAccessToken()
    if (memberToken) {
      config.headers.Authorization = `Bearer ${memberToken}`
    } else if (guestToken) {
      config.headers.Authorization = `Bearer ${guestToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error?.response?.status === 401) {
      if (isAuthLoginRequest(error.config) || isAuthGuestSessionRequest(error.config)) {
        console.error('API Error:', error)
        return Promise.reject(error)
      }
      const hadMember = !!getAccessToken()
      if (hadMember) {
        clearAuth()
        queryClient.clear()
        notifySessionExpired('member')
      } else if (getGuestAccessToken()) {
        clearGuestSession()
        queryClient.clear()
        notifySessionExpired('guest')
      }
    }
    console.error('API Error:', error)
    return Promise.reject(error)
  },
)
