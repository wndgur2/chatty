import { useMutation } from '@tanstack/react-query'
import { login as loginRequest } from '../../../api/auth'
import { setAccessToken, setCurrentUser } from '../../../shared/lib/auth'

export const useLogin = () => {
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (response) => {
      setAccessToken(response.accessToken)
      setCurrentUser(response.user)
    },
  })
}
