import type { Message, SendMessageRequest, SendMessageResponse } from '../types/api'
import { apiClient } from './client'

export interface GetMessagesParams {
  chatroomId: number
  limit?: number
  offset?: number
}

const SEND_MESSAGE_DEBUG_DELAY_MS = 1200

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
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
  return delay(SEND_MESSAGE_DEBUG_DELAY_MS).then(() =>
    apiClient.post(`/chatrooms/${chatroomId}/messages`, request),
  )
}
