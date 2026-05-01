import axios, { type InternalAxiosRequestConfig } from 'axios'
import { queryClient } from '../app/providers/queryClient'
import { clearAuth, getAccessToken } from '../shared/lib/auth'
import { notifySessionExpired } from '../shared/lib/sessionExpired'

const baseURL = import.meta.env.VITE_API_URL + '/api'
const DEV_API_DELAY_MS = 1500

function isAuthLoginRequest(config: InternalAxiosRequestConfig | undefined): boolean {
  const url = config?.url ?? ''
  return url.includes('auth/login')
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

    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error?.response?.status === 401) {
      if (isAuthLoginRequest(error.config)) {
        console.error('API Error:', error)
        return Promise.reject(error)
      }
      clearAuth()
      queryClient.clear()
      notifySessionExpired()
    }
    console.error('API Error:', error)
    return Promise.reject(error)
  },
)
