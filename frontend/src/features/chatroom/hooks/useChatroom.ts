import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  branchChatroom,
  cloneChatroom,
  deleteChatroom,
  getChatroom,
  updateChatroom,
} from '../../../api/chatrooms'
import { chatroomKeys } from '../../chatrooms/queryKeys'
import type { Chatroom } from '../../../types/api'

export const useChatroom = (id: number) => {
  return useQuery({
    queryKey: chatroomKeys.detail(id),
    queryFn: () => getChatroom(id),
    enabled: !!id,
  })
}

export const useUpdateChatroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateChatroom,
    onMutate: async (variables) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: chatroomKeys.list() }),
        queryClient.cancelQueries({ queryKey: chatroomKeys.detail(variables.id) }),
      ])

      const previousList = queryClient.getQueryData<Chatroom[]>(chatroomKeys.list())
      const previousDetail = queryClient.getQueryData<Chatroom>(chatroomKeys.detail(variables.id))

      queryClient.setQueryData<Chatroom>(chatroomKeys.detail(variables.id), (oldChatroom) => {
        if (!oldChatroom) return oldChatroom
        return {
          ...oldChatroom,
          ...variables.data,
          updatedAt: new Date().toISOString(),
        }
      })

      queryClient.setQueryData<Chatroom[]>(chatroomKeys.list(), (oldChatrooms = []) =>
        oldChatrooms.map((chatroom) =>
          chatroom.id === variables.id
            ? {
                ...chatroom,
                ...variables.data,
                updatedAt: new Date().toISOString(),
              }
            : chatroom,
        ),
      )

      return {
        previousList,
        previousDetail,
      }
    },
    onError: (_error, variables, context) => {
      if (!context) return
      queryClient.setQueryData(chatroomKeys.list(), context.previousList)
      queryClient.setQueryData(chatroomKeys.detail(variables.id), context.previousDetail)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
      queryClient.invalidateQueries({ queryKey: chatroomKeys.detail(variables.id) })
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
      queryClient.invalidateQueries({ queryKey: chatroomKeys.detail(variables.id) })
    },
  })
}

export const useDeleteChatroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteChatroom,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: chatroomKeys.list() })
      const previousList = queryClient.getQueryData<Chatroom[]>(chatroomKeys.list())
      const previousDetail = queryClient.getQueryData<Chatroom>(chatroomKeys.detail(id))

      queryClient.setQueryData<Chatroom[]>(chatroomKeys.list(), (oldChatrooms = []) =>
        oldChatrooms.filter((chatroom) => chatroom.id !== id),
      )
      queryClient.removeQueries({ queryKey: chatroomKeys.detail(id) })

      return {
        previousList,
        previousDetail,
      }
    },
    onError: (_error, id, context) => {
      if (!context) return
      queryClient.setQueryData(chatroomKeys.list(), context.previousList)
      queryClient.setQueryData(chatroomKeys.detail(id), context.previousDetail)
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
      queryClient.invalidateQueries({ queryKey: chatroomKeys.detail(id) })
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
      queryClient.invalidateQueries({ queryKey: chatroomKeys.detail(id) })
    },
  })
}

export const useCloneChatroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cloneChatroom,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: chatroomKeys.list() })
      const previousList = queryClient.getQueryData<Chatroom[]>(chatroomKeys.list()) ?? []
      const sourceChatroom = previousList.find((chatroom) => chatroom.id === id)
      const optimisticChatroom: Chatroom = {
        id: -Date.now(),
        name: sourceChatroom ? `${sourceChatroom.name} (Copy...)` : 'Cloning chatroom...',
        basePrompt: sourceChatroom?.basePrompt ?? '',
        profileImageUrl: sourceChatroom?.profileImageUrl ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Chatroom[]>(chatroomKeys.list(), (oldChatrooms = []) => [
        ...oldChatrooms,
        optimisticChatroom,
      ])

      return {
        previousList,
        optimisticId: optimisticChatroom.id,
      }
    },
    onError: (_error, _id, context) => {
      if (!context) return
      queryClient.setQueryData(chatroomKeys.list(), context.previousList)
    },
    onSuccess: (newChatroom, _id, context) => {
      if (context) {
        queryClient.setQueryData<Chatroom[]>(chatroomKeys.list(), (oldChatrooms = []) =>
          oldChatrooms.map((chatroom) =>
            chatroom.id === context.optimisticId ? newChatroom : chatroom,
          ),
        )
      }
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
    },
  })
}

export const useBranchChatroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: branchChatroom,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: chatroomKeys.list() })
      const previousList = queryClient.getQueryData<Chatroom[]>(chatroomKeys.list()) ?? []
      const sourceChatroom = previousList.find((chatroom) => chatroom.id === id)
      const optimisticChatroom: Chatroom = {
        id: -Date.now(),
        name: sourceChatroom ? `${sourceChatroom.name} (Branch...)` : 'Branching chatroom...',
        basePrompt: sourceChatroom?.basePrompt ?? '',
        profileImageUrl: sourceChatroom?.profileImageUrl ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Chatroom[]>(chatroomKeys.list(), (oldChatrooms = []) => [
        ...oldChatrooms,
        optimisticChatroom,
      ])

      return {
        previousList,
        optimisticId: optimisticChatroom.id,
      }
    },
    onError: (_error, _id, context) => {
      if (!context) return
      queryClient.setQueryData(chatroomKeys.list(), context.previousList)
    },
    onSuccess: (newChatroom, _id, context) => {
      if (context) {
        queryClient.setQueryData<Chatroom[]>(chatroomKeys.list(), (oldChatrooms = []) =>
          oldChatrooms.map((chatroom) =>
            chatroom.id === context.optimisticId ? newChatroom : chatroom,
          ),
        )
      }
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
    },
  })
}
