import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, Socket } from 'socket.io-client'
import { getMessagesQueryKey } from '../queryKeys'
import type { Message } from '../../../types/api'

const WS_URL = import.meta.env.VITE_API_URL

export const STREAMING_MESSAGE_ID = Number.MAX_SAFE_INTEGER

export const useWebSocketStream = (chatroomId: number) => {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const handleTypingState = useEffectEvent((payload: { chatroomId: number; isTyping: boolean }) => {
    if (payload.chatroomId !== chatroomId) return
    setIsTyping(payload.isTyping)
  })

  const handleMessageChunk = useEffectEvent((payload: { chatroomId: number; chunk: string }) => {
    if (payload.chatroomId !== chatroomId) return
    setIsTyping(false)
    setStreamingContent((old) => old + payload.chunk)
  })

  const handleMessageComplete = useEffectEvent(
    (payload: { chatroomId: number; content: string; messageId: number }) => {
      if (payload.chatroomId !== chatroomId) return

      queryClient.setQueryData<Message[]>(getMessagesQueryKey(chatroomId), (oldMessages) => {
        if (!oldMessages) return []

        const filteredMessages = oldMessages.filter((message) => message.id !== payload.messageId)

        const finalMessage: Message = {
          id: payload.messageId,
          sender: 'ai',
          content: payload.content || streamingContent,
          createdAt: new Date().toISOString(),
        }

        return [...filteredMessages, finalMessage]
      })

      setStreamingContent('')
      setIsTyping(false)
    },
  )

  useEffect(() => {
    if (!chatroomId || socketRef.current?.connected) return

    const socket = io(WS_URL, {
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setStreamingContent('')
      console.log(`Socket.io connected for chatroom ${chatroomId}`)
      socket.emit('joinRoom', { chatroomId })
    })

    socket.on('ai_typing_state', handleTypingState)
    socket.on('ai_message_chunk', handleMessageChunk)
    socket.on('ai_message_complete', handleMessageComplete)

    socket.on('disconnect', () => {
      console.log(`Socket.io disconnected for chatroom ${chatroomId}`)
    })

    return () => {
      if (!socketRef.current) return
      socketRef.current.off('ai_typing_state', handleTypingState)
      socketRef.current.off('ai_message_chunk', handleMessageChunk)
      socketRef.current.off('ai_message_complete', handleMessageComplete)
      socketRef.current.emit('leaveRoom', { chatroomId })
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [chatroomId])

  return {
    getSocket: () => socketRef.current,
    isTyping,
    streamingContent,
  }
}
