import type { LoginRequest, LoginResponse } from '../types/api'
import { apiClient } from './client'

export function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient.post('/auth/login', data)
}

export interface GuestSessionResponse {
  accessToken: string
  guestSessionId: string
}

export function createGuestSession(): Promise<GuestSessionResponse> {
  return apiClient.post('/auth/guest-session')
}

export function mergeGuestSession(guestToken: string): Promise<{ success: true }> {
  return apiClient.post(
    '/auth/merge-guest',
    {},
    {
      headers: {
        'X-Guest-Token': guestToken,
      },
    },
  )
}
