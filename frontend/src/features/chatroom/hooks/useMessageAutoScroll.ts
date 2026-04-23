import { useEffect, useRef } from 'react'

interface UseMessageAutoScrollParams {
  displayMessagesCount: number
  isSending: boolean
  isTyping: boolean
}

export const useMessageAutoScroll = ({
  displayMessagesCount,
  isSending,
  isTyping,
}: UseMessageAutoScrollParams) => {
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  const isNearBottom = () => {
    const container = messagesScrollRef.current
    if (!container) return true

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    return distanceFromBottom < 120
  }

  const handleComposerFocus = () => {
    if (!isNearBottom()) return
    scrollToBottom('auto')
    setTimeout(() => scrollToBottom('smooth'), 300)
  }

  useEffect(() => {
    scrollToBottom('smooth')
  }, [displayMessagesCount, isSending, isTyping])

  return {
    messagesScrollRef,
    messagesEndRef,
    handleComposerFocus,
  }
}
