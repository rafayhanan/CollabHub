"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { Skeleton } from "@/components/ui/skeleton"
import type { Message } from "@/lib/api/types"

interface MessageListProps {
  messages: Message[]
  onEditMessage: (messageId: string, content: string) => void
  onDeleteMessage: (messageId: string) => void
  isLoading?: boolean
}

export function MessageList({ messages, onEditMessage, onDeleteMessage, isLoading = false }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const isConsecutiveMessage = (currentMessage: Message, previousMessage: Message | undefined) => {
    if (!previousMessage) return false

    const timeDiff = new Date(currentMessage.createdAt).getTime() - new Date(previousMessage.createdAt).getTime()
    const isSameAuthor = currentMessage.authorId === previousMessage.authorId
    const isWithinTimeWindow = timeDiff < 5 * 60 * 1000 // 5 minutes

    return isSameAuthor && isWithinTimeWindow
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground">Start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      <div className="p-4 space-y-1">
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : undefined
          const isConsecutive = isConsecutiveMessage(message, previousMessage)

          return (
            <MessageBubble
              key={message.id}
              message={message}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              isConsecutive={isConsecutive}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
