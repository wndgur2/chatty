import type { LoginRequest, LoginResponse } from '../types/api'
import { apiClient } from './client'

export function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient.post('/auth/login', data)
}
