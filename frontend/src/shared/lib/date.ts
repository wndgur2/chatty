export function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()

  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return formatTime(isoString)
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  const isCurrentYear = date.getFullYear() === now.getFullYear()
  if (isCurrentYear) {
    return formatDate(isoString)
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

