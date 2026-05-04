export type SessionExpiredReason = 'member' | 'guest'

type SessionExpiredHandler = (reason: SessionExpiredReason) => void

let handler: SessionExpiredHandler | null = null

export function registerSessionExpiredHandler(fn: SessionExpiredHandler | null) {
  handler = fn
}

export function notifySessionExpired(reason: SessionExpiredReason = 'member') {
  handler?.(reason)
}
