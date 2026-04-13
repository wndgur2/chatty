import type { KeyboardEvent, MouseEvent } from 'react'
import { X } from 'lucide-react'
import Button from '../../../shared/ui/Button'

interface ForegroundNotificationPopupProps {
  open: boolean
  title: string
  body: string
  onClick: () => void
  onClose: () => void
}

export default function ForegroundNotificationPopup({
  open,
  title,
  body,
  onClick,
  onClose,
}: ForegroundNotificationPopupProps) {
  const handleClose = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onClose()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onClick()
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:justify-end sm:px-6">
      <div
        role="button"
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        className={`w-full max-w-sm rounded-2xl border border-gray-200/90 bg-white/95 p-4 text-left shadow-[0_20px_45px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100 sm:translate-y-0'
            : 'pointer-events-none -translate-y-6 opacity-0 sm:-translate-y-8'
        }`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <p className="line-clamp-1 text-sm font-semibold text-gray-900">{title}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClose}
            aria-label="Dismiss notification popup"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="line-clamp-2 text-sm text-gray-600">{body}</p>
      </div>
    </div>
  )
}
