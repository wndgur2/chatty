import type {
  RegisterNotificationRequest,
  RegisterNotificationResponse,
  SendTestNotificationRequest,
  SendTestNotificationResponse,
} from '../types/api'
import { apiClient } from './client'

export function registerDeviceToken(
  request: RegisterNotificationRequest,
): Promise<RegisterNotificationResponse> {
  return apiClient.post('/notifications/register', request)
}

export function sendTestNotification(
  request: SendTestNotificationRequest,
): Promise<SendTestNotificationResponse> {
  return apiClient.post('/notifications/test', request)
}
