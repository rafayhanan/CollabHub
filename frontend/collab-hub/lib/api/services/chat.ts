import { apiClient } from "../http-client"
import type { Channel, Message } from "../types"

export const getProjectChannels = async (projectId: string): Promise<Channel[]> => {
  const response = await apiClient.get<Channel[]>(`/channels/project/${projectId}`)
  return response.data
}

export const createChannel = async (
  name: string,
  type: Channel["type"],
  description?: string,
  projectId?: string,
  taskId?: string,
  memberIds?: string[],
): Promise<Channel> => {
  const response = await apiClient.post<Channel>("/channels", {
    name,
    type,
    description,
    projectId,
    taskId,
    memberIds,
  })
  return response.data
}

export const addChannelMember = async (channelId: string, userId: string): Promise<void> => {
  await apiClient.post(`/channels/${channelId}/members`, { userId })
}

export const getChannelMessages = async (channelId: string, limit = 50, offset = 0): Promise<Message[]> => {
  const response = await apiClient.get<Message[]>(
    `/channels/${channelId}/messages?limit=${limit}&offset=${offset}`,
  )
  return response.data
}

export const sendMessage = async (channelId: string, content: string): Promise<Message> => {
  const response = await apiClient.post<Message>(`/channels/${channelId}/messages`, { content })
  return response.data
}

export const editMessage = async (messageId: string, content: string): Promise<Message> => {
  const response = await apiClient.put<Message>(`/messages/${messageId}`, { content })
  return response.data
}

export const deleteMessage = async (messageId: string): Promise<void> => {
  await apiClient.delete(`/messages/${messageId}`)
}
