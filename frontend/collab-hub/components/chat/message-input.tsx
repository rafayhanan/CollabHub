"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { useWebSocket } from "@/hooks/use-websocket"

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  channelId?: string
}

export function MessageInput({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false,
  channelId,
}: MessageInputProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { sendEvent } = useWebSocket()

  useEffect(() => {
    if (!channelId) return

    const handleTypingStop = () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTyping) {
        setIsTyping(false)
        sendEvent({
          type: "typing_stop",
          data: { channelId },
        })
      }
    }

    return () => {
      handleTypingStop()
    }
  }, [channelId, isTyping, sendEvent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isLoading) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (isTyping && channelId) {
      setIsTyping(false)
      sendEvent({
        type: "typing_stop",
        data: { channelId },
      })
    }

    setIsLoading(true)
    try {
      await onSendMessage(content.trim())
      setContent("")
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)

    if (e.target.value.trim() && channelId) {
      const handleTypingStart = () => {
        if (!isTyping) {
          setIsTyping(true)
          sendEvent({
            type: "typing_start",
            data: { channelId },
          })
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
          sendEvent({
            type: "typing_stop",
            data: { channelId },
          })
        }, 2000)
      }

      handleTypingStart()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-2 p-4 border-t border-border bg-background">
      <div className="flex-1">
        <Textarea
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className="min-h-[40px] max-h-32 resize-none"
        />
      </div>
      <Button type="submit" size="sm" disabled={!content.trim() || disabled || isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  )
}
