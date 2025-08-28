"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Edit, Trash2, Check, X } from "lucide-react"
import type { Message } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: Message
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  isConsecutive?: boolean
}

export function MessageBubble({ message, onEdit, onDelete, isConsecutive = false }: MessageBubbleProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const isOwnMessage = user?.id === message.authorId

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className={cn("group flex items-start space-x-3", isConsecutive && "mt-1", !isConsecutive && "mt-4")}>
      {!isConsecutive && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {message.author.name?.charAt(0) || message.author.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {isConsecutive && <div className="w-8 flex-shrink-0" />}

      <div className="flex-1 min-w-0">
        {!isConsecutive && (
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="text-sm font-medium text-foreground">{message.author.name || message.author.email}</span>
            <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
          </div>
        )}

        <div className="flex items-start space-x-2">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSaveEdit()
                    } else if (e.key === "Escape") {
                      handleCancelEdit()
                    }
                  }}
                  className="text-sm"
                  autoFocus
                />
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={handleSaveEdit} className="h-6 px-2">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 px-2">
                    <X className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground">Enter to save • Esc to cancel</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-foreground break-words">{message.content}</div>
            )}
          </div>

          {isOwnMessage && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(message.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}
