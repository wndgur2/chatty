import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type RefObject,
} from 'react'
import type { Message } from '../../../types/api'
import { useSendMessage } from './useMessages'

interface UseChatroomMessageComposerParams {
  chatroomId: number
  messages: Message[]
  isTyping: boolean
  streamingContent: string
}

export const useChatroomMessageComposer = ({
  chatroomId,
  messages,
  isTyping,
  streamingContent,
}: UseChatroomMessageComposerParams) => {
  const sendMessageMutation = useSendMessage()
  const [inputValue, setInputValue] = useState('')
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const [, startSendTransition] = useTransition()
  const nextTempMessageIdRef = useRef(-1)
  const waitingSinceRef = useRef<number | null>(null)

  const [displayMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (current, optimistic: Message) => [...current, optimistic],
  )

  const isStreaming = !!streamingContent
  const isSendLocked =
    sendMessageMutation.isPending || isWaitingForResponse || isTyping || isStreaming
  const isLoadingIndicatorVisible =
    (sendMessageMutation.isPending || isWaitingForResponse || isTyping) && !isStreaming

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    if (isStreaming) {
      timeoutId = setTimeout(() => setIsWaitingForResponse(false), 0)
    } else if (isWaitingForResponse && displayMessages.length > 0) {
      const lastMsg = displayMessages[displayMessages.length - 1]
      const lastMessageCreatedAt = lastMsg?.createdAt ? new Date(lastMsg.createdAt).getTime() : 0
      const waitingSince = waitingSinceRef.current ?? 0
      if (lastMsg?.sender === 'ai' && lastMessageCreatedAt >= waitingSince) {
        timeoutId = setTimeout(() => setIsWaitingForResponse(false), 0)
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [displayMessages, isStreaming, isWaitingForResponse])

  const handleSendMessage = (event: FormEvent, inputRef: RefObject<HTMLTextAreaElement | null>) => {
    event.preventDefault()
    if (!inputValue.trim() || isSendLocked) return

    const content = inputValue.trim()
    const tempId = nextTempMessageIdRef.current--
    const optimisticMessage: Message = {
      id: tempId,
      sender: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    startSendTransition(async () => {
      addOptimisticMessage(optimisticMessage)
      waitingSinceRef.current = Date.now()
      setIsWaitingForResponse(true)
      try {
        await sendMessageMutation.mutateAsync({
          chatroomId,
          request: { content },
        })
      } catch {
        setIsWaitingForResponse(false)
      }
    })

    setInputValue('')
    inputRef.current?.blur()
  }

  return {
    inputValue,
    setInputValue,
    displayMessages,
    isSendLocked,
    isLoadingIndicatorVisible,
    isWaitingForResponse,
    sendMessageMutation,
    handleSendMessage,
  }
}
