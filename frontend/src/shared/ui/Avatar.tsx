import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface AvatarProps {
  src?: string
  fallback: string
  className?: string
}

export default function Avatar({ src, fallback, className }: AvatarProps) {
  return (
    <div
      className={twMerge(
        clsx('flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold select-none', className),
      )}
    >
      {src ? <img src={src} alt={fallback} className="h-full w-full object-cover" /> : <span>{fallback.charAt(0).toUpperCase()}</span>}
    </div>
  )
}

