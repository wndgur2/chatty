import { useMutation } from '@tanstack/react-query'
import { registerDeviceToken } from '../../../api/notifications'

export const useRegisterNotification = () => {
  return useMutation({
    mutationFn: registerDeviceToken,
  })
}
