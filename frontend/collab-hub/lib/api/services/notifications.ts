import { apiClient } from "../http-client"
import type { Notification } from "../types"

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await apiClient.get<Notification[]>("/notifications")
  return response.data
}

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await apiClient.post(`/notifications/${notificationId}/read`)
}

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.post("/notifications/read-all")
}
