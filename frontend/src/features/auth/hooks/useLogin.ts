import { useMutation } from '@tanstack/react-query'
import { login as loginRequest, mergeGuestSession } from '../../../api/auth'
import {
  clearGuestSession,
  getGuestAccessToken,
  setAccessToken,
  setCurrentUser,
} from '../../../shared/lib/auth'

export const useLogin = () => {
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: async (response) => {
      setAccessToken(response.accessToken)
      setCurrentUser(response.user)
      const guestToken = getGuestAccessToken()
      if (guestToken) {
        try {
          await mergeGuestSession(guestToken)
        } catch {
          // Merge is best-effort; member session is still valid.
        }
        clearGuestSession()
      }
    },
  })
}
