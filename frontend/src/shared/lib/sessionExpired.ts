type SessionExpiredHandler = () => void

let handler: SessionExpiredHandler | null = null

export function registerSessionExpiredHandler(fn: SessionExpiredHandler | null) {
  handler = fn
}

export function notifySessionExpired() {
  handler?.()
}
