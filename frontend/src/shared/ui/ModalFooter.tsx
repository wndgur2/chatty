import type { ReactNode } from 'react'

interface ModalFooterProps {
  leftSlot?: ReactNode
  children: ReactNode
  className?: string
}

export default function ModalFooter({ leftSlot, children, className = '' }: ModalFooterProps) {
  return (
    <div className={`flex justify-between gap-3 mt-4 ${className}`}>
      <div>{leftSlot}</div>
      <div className="flex justify-end gap-3">{children}</div>
    </div>
  )
}
