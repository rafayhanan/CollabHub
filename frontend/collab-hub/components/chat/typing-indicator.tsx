"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

interface TypingIndicatorProps {
  typingUsers: Array<{ userId: string; userName: string }>
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (typingUsers.length === 0) return

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [typingUsers.length])

  if (typingUsers.length === 0) return null

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing${dots}`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing${dots}`
    } else {
      return `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing${dots}`
    }
  }

  return (
    <div className="px-4 py-2 border-t">
      <Badge variant="secondary" className="text-xs">
        {getTypingText()}
      </Badge>
    </div>
  )
}
