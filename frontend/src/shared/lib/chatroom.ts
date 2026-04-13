import type { Chatroom } from '../../types/api'

export const getChatroomActivityAt = (chatroom: Chatroom) => chatroom.updatedAt || chatroom.createdAt

export const sortByChatroomActivityDesc = (a: Chatroom, b: Chatroom) =>
  new Date(getChatroomActivityAt(b)).getTime() - new Date(getChatroomActivityAt(a)).getTime()
