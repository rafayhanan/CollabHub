import { getToken } from "./auth"

export type WebSocketEvent =
  | { type: "message_created"; data: { channelId: string; message: any } }
  | { type: "message_updated"; data: { channelId: string; message: any } }
  | { type: "message_deleted"; data: { channelId: string; messageId: string } }
  | { type: "task_updated"; data: { projectId: string; task: any } }
  | { type: "task_created"; data: { projectId: string; task: any } }
  | { type: "task_deleted"; data: { projectId: string; taskId: string } }
  | { type: "user_joined_project"; data: { projectId: string; user: any } }
  | { type: "user_left_project"; data: { projectId: string; userId: string } }
  | { type: "typing_start"; data: { channelId: string; userId: string; userName: string } }
  | { type: "typing_stop"; data: { channelId: string; userId: string } }

export type WebSocketEventHandler = (event: WebSocketEvent) => void

class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventHandlers: Set<WebSocketEventHandler> = new Set()
  private isConnecting = false
  private shouldReconnect = true

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true
    const token = getToken()

    if (!token) {
      console.warn("[WebSocket] No auth token available")
      this.isConnecting = false
      return
    }

    try {
      // Connect to WebSocket server with auth token
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000/ws"
      this.ws = new WebSocket(`${wsUrl}?token=${token}`)

      this.ws.onopen = () => {
        console.log("[WebSocket] Connected")
        this.isConnecting = false
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const wsEvent: WebSocketEvent = JSON.parse(event.data)
          this.eventHandlers.forEach((handler) => handler(wsEvent))
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error)
        }
      }

      this.ws.onclose = (event) => {
        console.log("[WebSocket] Disconnected:", event.code, event.reason)
        this.isConnecting = false
        this.ws = null

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
          setTimeout(() => this.connect(), delay)
        }
      }

      this.ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error)
        this.isConnecting = false
      }
    } catch (error) {
      console.error("[WebSocket] Failed to connect:", error)
      this.isConnecting = false
    }
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(event: { type: string; data: any }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event))
    } else {
      console.warn("[WebSocket] Cannot send message - not connected")
    }
  }

  subscribe(handler: WebSocketEventHandler) {
    this.eventHandlers.add(handler)
    return () => this.eventHandlers.delete(handler)
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsManager = new WebSocketManager()

// Auto-connect when module loads
if (typeof window !== "undefined") {
  wsManager.connect()
}
