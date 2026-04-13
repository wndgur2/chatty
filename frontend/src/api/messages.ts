import type { Message, SendMessageRequest, SendMessageResponse } from '../types/api'
import { apiClient } from './client'

export interface GetMessagesParams {
  chatroomId: number
  limit?: number
  offset?: number
}

export function getMessages({ chatroomId, limit, offset }: GetMessagesParams): Promise<Message[]> {
  return apiClient.get(`/chatrooms/${chatroomId}/messages`, {
    params: { limit, offset },
  })
}

export function sendMessage({
  chatroomId,
  request,
}: {
  chatroomId: number
  request: SendMessageRequest
}): Promise<SendMessageResponse> {
  return apiClient.post(`/chatrooms/${chatroomId}/messages`, request)
}
