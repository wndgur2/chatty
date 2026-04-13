// Core entity types
export interface Chatroom {
  id: number
  name: string
  basePrompt: string | null
  profileImageUrl: string | null
  createdAt: string // ISO 8601 Date string
  updatedAt?: string // ISO 8601 Date string
}

export interface Message {
  id: number
  sender: 'user' | 'ai'
  content: string
  createdAt: string // ISO 8601 Date string
}

// Custom request/response structures
export interface CreateChatroomRequest {
  name: string
  basePrompt: string
  profileImage?: File | Blob
}

export interface UpdateChatroomRequest {
  name?: string
  basePrompt?: string
  profileImage?: File | Blob
}

export interface SendMessageRequest {
  content: string
}

export interface SendMessageResponse {
  messageId: number
  status: 'processing' | 'success' | 'failed'
}

export interface RegisterNotificationRequest {
  deviceToken: string
}

export interface RegisterNotificationResponse {
  status: 'success' | 'error'
  message: string
}

export interface SendTestNotificationRequest {
  chatroomId: string
}

export interface SendTestNotificationResponse {
  status: 'success' | 'error'
  message: string
}

export interface User {
  id: string
  username: string
}

export interface LoginRequest {
  username: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}
