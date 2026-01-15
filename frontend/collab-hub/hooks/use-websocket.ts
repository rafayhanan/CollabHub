"use client"

import { useEffect, useCallback } from "react"
import { wsManager, type WebSocketEvent, type WebSocketEventHandler } from "@/lib/websocket"

export function useWebSocket(handler?: WebSocketEventHandler) {
  useEffect(() => {
    // Ensure connection is established
    wsManager.connect()

    // Subscribe to events if handler provided
    if (handler) {
      const unsubscribe = wsManager.subscribe(handler)
      return () => {
        // Ensure cleanup returns void (not the boolean from Set.delete)
        unsubscribe()
      }
    }
  }, [handler])

  const sendEvent = useCallback((event: { type: string; data: any }) => {
    wsManager.send(event)
  }, [])

  return {
    sendEvent,
    isConnected: wsManager.isConnected(),
  }
}

export function useChannelEvents(
  channelId: string | null,
  callbacks: {
    onMessageCreated?: (message: any) => void
    onMessageUpdated?: (message: any) => void
    onMessageDeleted?: (messageId: string) => void
    onTypingStart?: (userId: string, userName: string) => void
    onTypingStop?: (userId: string) => void
  },
) {
  const handler = useCallback(
    (event: WebSocketEvent) => {
      switch (event.type) {
        case "message_created":
          if (event.data.channelId === channelId) {
            callbacks.onMessageCreated?.(event.data.message)
          }
          break
        case "message_updated":
          if (event.data.channelId === channelId) {
            callbacks.onMessageUpdated?.(event.data.message)
          }
          break
        case "message_deleted":
          if (event.data.channelId === channelId) {
            callbacks.onMessageDeleted?.(event.data.messageId)
          }
          break
        case "typing_start":
          if (event.data.channelId === channelId) {
            callbacks.onTypingStart?.(event.data.userId, event.data.userName)
          }
          break
        case "typing_stop":
          if (event.data.channelId === channelId) {
            callbacks.onTypingStop?.(event.data.userId)
          }
          break
      }
    },
    [channelId, callbacks],
  )

  useWebSocket(handler)
}

export function useTaskEvents(
  projectId: string | null,
  callbacks: {
    onTaskCreated?: (task: any) => void
    onTaskUpdated?: (task: any) => void
    onTaskDeleted?: (taskId: string) => void
  },
) {
  const handler = useCallback(
    (event: WebSocketEvent) => {
      switch (event.type) {
        case "task_created":
          if (event.data.projectId === projectId) {
            callbacks.onTaskCreated?.(event.data.task)
          }
          break
        case "task_updated":
          if (event.data.projectId === projectId) {
            callbacks.onTaskUpdated?.(event.data.task)
          }
          break
        case "task_deleted":
          if (event.data.projectId === projectId) {
            callbacks.onTaskDeleted?.(event.data.taskId)
          }
          break
      }
    },
    [projectId, callbacks],
  )

  useWebSocket(handler)
}
