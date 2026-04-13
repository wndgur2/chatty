import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, Socket } from 'socket.io-client'
import { getMessagesQueryKey } from '../queryKeys'
import type { Message } from '../../../types/api'

const WS_URL = import.meta.env.VITE_API_URL

export const STREAMING_MESSAGE_ID = Number.MAX_SAFE_INTEGER

export const useWebSocketStream = (chatroomId: number) => {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const streamingContentRef = useRef('')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  useEffect(() => {
    streamingContentRef.current = streamingContent
  }, [streamingContent])

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const socket = io(WS_URL, {
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setStreamingContent('')
      console.log(`Socket.io connected for chatroom ${chatroomId}`)
      socket.emit('joinRoom', { chatroomId })
    })

    socket.on('ai_typing_state', (payload: { chatroomId: number; isTyping: boolean }) => {
      if (payload.chatroomId !== chatroomId) return
      setIsTyping(payload.isTyping)
    })

    socket.on('ai_message_chunk', (payload: { chatroomId: number; chunk: string }) => {
      if (payload.chatroomId !== chatroomId) return

      setIsTyping(false)
      setStreamingContent((old) => old + payload.chunk)
    })

    socket.on(
      'ai_message_complete',
      (payload: { chatroomId: number; content: string; messageId: number }) => {
        if (payload.chatroomId !== chatroomId) return

        queryClient.setQueryData<Message[]>(getMessagesQueryKey(chatroomId), (oldMessages) => {
          if (!oldMessages) return []

          const filteredMessages = oldMessages.filter((m) => m.id !== payload.messageId)

          const finalMessage: Message = {
            id: payload.messageId,
            sender: 'ai',
            content: payload.content || streamingContentRef.current,
            createdAt: new Date().toISOString(),
          }

          return [...filteredMessages, finalMessage]
        })

        setStreamingContent('')
        // Stop typing indicator if not explicitly ended by typing state event
        setIsTyping(false)
      },
    )

    socket.on('disconnect', () => {
      console.log(`Socket.io disconnected for chatroom ${chatroomId}`)
    })
  }, [chatroomId, queryClient])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leaveRoom', { chatroomId })
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [chatroomId])

  useEffect(() => {
    if (chatroomId) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [chatroomId, connect, disconnect])

  return {
    getSocket: () => socketRef.current,
    isTyping,
    streamingContent,
  }
}
