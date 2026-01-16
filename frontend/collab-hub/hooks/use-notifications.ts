import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api/services/notifications"
import type { Notification } from "@/lib/api/types"

export const notificationKeys = {
  all: ["notifications"] as const,
}

export const useNotifications = () => {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: getNotifications,
  })
}

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData<Notification[]>(notificationKeys.all, (old) =>
        old
          ? old.map((notification) =>
              notification.id === notificationId && !notification.readAt
                ? { ...notification, readAt: new Date().toISOString() }
                : notification,
            )
          : old,
      )
    },
  })
}

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(notificationKeys.all, (old) =>
        old ? old.map((notification) => ({ ...notification, readAt: notification.readAt || new Date().toISOString() })) : old,
      )
    },
  })
}
