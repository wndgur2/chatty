import type { Chatroom, CreateChatroomRequest, UpdateChatroomRequest } from '../types/api'
import { apiClient } from './client'

export function getChatrooms(): Promise<Chatroom[]> {
  return apiClient.get('/chatrooms')
}

export function createChatroom(data: CreateChatroomRequest): Promise<Chatroom> {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('basePrompt', data.basePrompt)
  if (data.profileImage) formData.append('profileImage', data.profileImage)
  return apiClient.post('/chatrooms', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getChatroom(id: number): Promise<Chatroom> {
  return apiClient.get(`/chatrooms/${id}`)
}

export function updateChatroom({
  id,
  data,
}: {
  id: number
  data: UpdateChatroomRequest
}): Promise<Chatroom> {
  const formData = new FormData()
  if (data.name) formData.append('name', data.name)
  if (data.basePrompt) formData.append('basePrompt', data.basePrompt)
  if (data.profileImage) formData.append('profileImage', data.profileImage)
  return apiClient.patch(`/chatrooms/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteChatroom(id: number): Promise<void> {
  return apiClient.delete(`/chatrooms/${id}`)
}

export function cloneChatroom(id: number): Promise<Chatroom> {
  return apiClient.post(`/chatrooms/${id}/clone`)
}

export function branchChatroom(id: number): Promise<Chatroom> {
  return apiClient.post(`/chatrooms/${id}/branch`)
}
