import { useQuery, useMutation } from '@tanstack/react-query'
import { getMessages, sendMessage } from '../../../api/messages'
import { getMessagesQueryKey } from '../queryKeys'

export const useMessages = (chatroomId: number, limit?: number, offset?: number) => {
  return useQuery({
    queryKey: getMessagesQueryKey(chatroomId, { limit, offset }),
    queryFn: () => getMessages({ chatroomId, limit, offset }),
    enabled: !!chatroomId,
  })
}

export const useSendMessage = () => {
  return useMutation({
    mutationFn: sendMessage,
  })
}
