import { Bell, BellOff } from 'lucide-react'
import Button from '../../../shared/ui/Button'
import { usePushNotifications } from '../hooks/usePushNotifications'

function labelForState(
  state: ReturnType<typeof usePushNotifications>['state'],
  busy: boolean,
): string {
  if (busy) return 'Enabling…'
  switch (state) {
    case 'unsupported':
      return 'Notifications not supported'
    case 'config_missing':
      return 'Push not configured'
    case 'denied':
      return 'Notifications blocked'
    case 'enabled':
      return 'Notifications on'
    case 'error':
      return 'Retry notifications'
    default:
      return 'Enable notifications'
  }
}

export default function PushNotificationButton() {
  const { state, lastError, enablePush, busy } = usePushNotifications()

  const disabled =
    busy || state === 'unsupported' || state === 'config_missing' || state === 'denied'

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => void enablePush()}
        className="gap-1.5"
        title={lastError ?? undefined}
        aria-label={labelForState(state, busy)}
      >
        {state === 'enabled' ? (
          <Bell className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <BellOff className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        )}
      </Button>
    </div>
  )
}
