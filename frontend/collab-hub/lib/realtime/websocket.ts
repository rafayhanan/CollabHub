import { io, type Socket } from "socket.io-client"
import { getAccessToken } from "../api/token"

type MessagePayload = Record<string, unknown>
type TaskPayload = Record<string, unknown>
type UserPayload = Record<string, unknown>

export type WebSocketEvent =
  | { type: "message_created"; data: { channelId: string; message: MessagePayload } }
  | { type: "message_updated"; data: { channelId: string; message: MessagePayload } }
  | { type: "message_deleted"; data: { channelId: string; messageId: string } }
  | { type: "task_updated"; data: { projectId: string; task: TaskPayload } }
  | { type: "task_created"; data: { projectId: string; task: TaskPayload } }
  | { type: "task_deleted"; data: { projectId: string; taskId: string } }
  | { type: "user_joined_project"; data: { projectId: string; user: UserPayload } }
  | { type: "user_left_project"; data: { projectId: string; userId: string } }
  | { type: "typing_start"; data: { channelId: string; userId: string; userName: string } }
  | { type: "typing_stop"; data: { channelId: string; userId: string } }

export type WebSocketEventHandler = (event: WebSocketEvent) => void

class WebSocketManager {
  private socket: Socket | null = null
  private eventHandlers: Set<WebSocketEventHandler> = new Set()
  private isConnecting = false
  private shouldReconnect = true

  connect() {
    if (this.socket?.connected || this.isConnecting) {
      return
    }

    this.isConnecting = true
    const token = getAccessToken()

    if (!token) {
      console.warn("[Socket.io] No auth token available")
      this.isConnecting = false
      return
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const path = process.env.NEXT_PUBLIC_WS_PATH || "/socket.io"

      this.socket = io(baseUrl, {
        path,
        auth: { token },
        autoConnect: true,
        reconnection: true,
      })

      this.socket.on("connect", () => {
        console.log("[Socket.io] Connected")
        this.isConnecting = false
      })

      this.socket.on("connect_error", (error) => {
        console.error("[Socket.io] Connection error:", error)
        this.isConnecting = false
      })

      this.socket.onAny((event, data) => {
        const wsEvent = { type: event, data } as WebSocketEvent
        this.eventHandlers.forEach((handler) => handler(wsEvent))
      })
    } catch (error) {
      console.error("[Socket.io] Failed to connect:", error)
      this.isConnecting = false
    }
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  send(event: { type: string; data: unknown }) {
    if (this.socket?.connected) {
      this.socket.emit(event.type, event.data)
    } else {
      console.warn("[Socket.io] Cannot send message - not connected")
    }
  }

  joinChannel(channelId: string) {
    if (this.socket?.connected) {
      this.socket.emit("join_channel", { channelId })
    }
  }

  leaveChannel(channelId: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave_channel", { channelId })
    }
  }

  subscribe(handler: WebSocketEventHandler) {
    this.eventHandlers.add(handler)
    return () => this.eventHandlers.delete(handler)
  }

  isConnected() {
    return Boolean(this.socket?.connected)
  }
}

export const wsManager = new WebSocketManager()

// Auto-connect when module loads
// TODO: Enable this once WebSocket is implemented on the backend
// if (typeof window !== "undefined") {
//   wsManager.connect()
// }
