import { useParams } from 'react-router'
import Button from '../../../shared/ui/Button'
import { useSendTestNotification } from '../hooks/useSendTestNotification'

interface SendTestNotificationButtonProps {
  isDevOverride?: boolean
}

export default function SendTestNotificationButton({
  isDevOverride,
}: SendTestNotificationButtonProps) {
  const { id } = useParams<{ id: string }>()
  const { mutateAsync: sendTestNotification, isPending, error } = useSendTestNotification()
  const isDevelopmentBuild = isDevOverride ?? import.meta.env.DEV

  if (!isDevelopmentBuild) return null

  const chatroomId = Number(id)
  const disabled = !Number.isFinite(chatroomId) || chatroomId <= 0 || isPending
  const errorMessage = error instanceof Error ? error.message : undefined

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => void sendTestNotification({ chatroomId: chatroomId.toString() })}
      title={errorMessage}
      aria-label="Send Notice"
    >
      {isPending ? 'Sending...' : 'Send Notice'}
    </Button>
  )
}
