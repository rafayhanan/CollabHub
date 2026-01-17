import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deleteMessage, editMessage, getChannelMessages, sendMessage } from "@/lib/api/services/chat"
import type { Message } from "@/lib/api/types"

export const messageKeys = {
  channel: (channelId: string) => ["messages", "channel", channelId] as const,
}

export const useChannelMessages = (channelId: string | null) => {
  return useQuery({
    queryKey: channelId ? messageKeys.channel(channelId) : ["messages", "channel", "none"],
    queryFn: () => getChannelMessages(channelId as string),
    enabled: !!channelId,
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ channelId, content }: { channelId: string; content: string }) => sendMessage(channelId, content),
    onSuccess: (newMessage) => {
      queryClient.setQueryData<Message[]>(messageKeys.channel(newMessage.channelId), (old) =>
        old?.some((msg) => msg.id === newMessage.id) ? old : old ? [...old, newMessage] : [newMessage],
      )
    },
  })
}

export const useEditMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) => editMessage(messageId, content),
    onSuccess: (updatedMessage) => {
      queryClient.setQueryData<Message[]>(messageKeys.channel(updatedMessage.channelId), (old) =>
        old ? old.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)) : old,
      )
    },
  })
}

export const useDeleteMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: Message) => deleteMessage(message.id),
    onSuccess: (_, message) => {
      queryClient.setQueryData<Message[]>(messageKeys.channel(message.channelId), (old) =>
        old ? old.filter((msg) => msg.id !== message.id) : old,
      )
    },
  })
}
