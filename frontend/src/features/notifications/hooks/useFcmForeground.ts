import { useEffect, useEffectEvent, useState } from 'react'
import { useParams } from 'react-router'
import {
  getFirebaseApp,
  getMessagingInstance,
  isBrowserPushMessagingSupported,
  onForegroundMessage,
} from '../../../shared/notifications/firebase'
import { ROUTES } from '../../../routes/paths'

export interface ForegroundPopupNotification {
  chatroomId: string
  title: string
  body: string
}

function parseForegroundPayload(payload: {
  data?: Record<string, string>
}): ForegroundPopupNotification | null {
  const data = payload.data
  const chatroomId = data?.chatroomId?.trim()
  if (!chatroomId) return null

  return {
    chatroomId,
    title: data?.chatroomName ?? data?.title ?? 'Chatty',
    body: data?.messagePreview ?? data?.body ?? '',
  }
}

function normalizeRouteChatroomId(routeId: string): string {
  try {
    return decodeURIComponent(routeId).trim()
  } catch {
    return routeId.trim()
  }
}

function isMessageForActiveChatroom(
  routeChatroomId: string | undefined,
  messageChatroomId: string,
): boolean {
  if (!routeChatroomId) return false
  return normalizeRouteChatroomId(routeChatroomId) === messageChatroomId.trim()
}

export function useFcmForeground() {
  const [popup, setPopup] = useState<ForegroundPopupNotification | null>(null)
  const { id: routeChatroomId } = useParams<{ id?: string }>()
  const handleForegroundMessage = useEffectEvent((payload: { data?: Record<string, string> }) => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    const parsed = parseForegroundPayload(payload)
    if (!parsed) return
    if (isMessageForActiveChatroom(routeChatroomId, parsed.chatroomId)) return
    setPopup(parsed)
  })

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    void (async () => {
      if (!(await isBrowserPushMessagingSupported())) return
      if (cancelled) return
      const app = getFirebaseApp()
      if (!app) return

      const messaging = getMessagingInstance(app)
      unsubscribe = onForegroundMessage(messaging, (payload) => {
        console.log('onForegroundMessage', payload)
        handleForegroundMessage(payload as { data?: Record<string, string> })
      })
    })()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const clearPopup = () => {
    setPopup(null)
  }

  const getPopupChatroomPath = () => {
    if (!popup) return null
    return ROUTES.CHATROOM(encodeURIComponent(popup.chatroomId))
  }

  return {
    popup,
    clearPopup,
    getPopupChatroomPath,
  }
}
