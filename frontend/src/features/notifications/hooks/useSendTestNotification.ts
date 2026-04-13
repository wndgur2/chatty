import { useMutation } from '@tanstack/react-query'
import { sendTestNotification } from '../../../api/notifications'

export const useSendTestNotification = () => {
  return useMutation({
    mutationFn: sendTestNotification,
  })
}
