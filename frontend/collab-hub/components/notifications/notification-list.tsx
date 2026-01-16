"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/hooks/use-notifications"
import { getApiErrorMessage } from "@/lib/api/error"

export function NotificationList() {
  const { data: notifications = [], isLoading, error } = useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead } = useMarkAllNotificationsRead()

  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <p className="text-muted-foreground">{getApiErrorMessage(error, "Failed to load notifications")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Notifications</CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead()} className="gap-2 w-full sm:w-auto">
            <Check className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">No notifications yet</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{notification.title}</p>
                    {!notification.readAt && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                  {notification.link && (
                    <Link href={notification.link} className="text-sm text-emerald-600 hover:underline">
                      View details
                    </Link>
                  )}
                </div>
                {!notification.readAt && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(notification.id)} className="w-full sm:w-auto">
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
