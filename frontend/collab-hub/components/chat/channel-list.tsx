"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Hash, Lock, Megaphone, MessageSquare, MoreHorizontal, Plus, Users } from "lucide-react"
import type { Channel } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ChannelListProps {
  channels: Channel[]
  activeChannelId?: string
  onChannelSelect: (channel: Channel) => void
  onCreateChannel: () => void
  onEditChannel?: (channel: Channel) => void
  onDeleteChannel?: (channel: Channel) => void
}

export function ChannelList({
  channels,
  activeChannelId,
  onChannelSelect,
  onCreateChannel,
  onEditChannel,
  onDeleteChannel,
}: ChannelListProps) {
  const getChannelIcon = (type: Channel["type"]) => {
    switch (type) {
      case "PROJECT_GENERAL":
        return Hash
      case "TASK_SPECIFIC":
        return MessageSquare
      case "PRIVATE_DM":
        return Lock
      case "ANNOUNCEMENTS":
        return Megaphone
      default:
        return Hash
    }
  }

  const getChannelTypeLabel = (type: Channel["type"]) => {
    switch (type) {
      case "PROJECT_GENERAL":
        return "General"
      case "TASK_SPECIFIC":
        return "Task"
      case "PRIVATE_DM":
        return "DM"
      case "ANNOUNCEMENTS":
        return "Announcement"
      default:
        return "Channel"
    }
  }

  const groupedChannels = channels.reduce(
    (acc, channel) => {
      acc[channel.type].push(channel)
      return acc
    },
    {
      PROJECT_GENERAL: [] as Channel[],
      ANNOUNCEMENTS: [] as Channel[],
      TASK_SPECIFIC: [] as Channel[],
      PRIVATE_DM: [] as Channel[],
    },
  )

  const renderChannelGroup = (title: string, channels: Channel[], type: Channel["type"]) => {
    if (channels.length === 0) return null

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 py-1">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {channels.length}
          </Badge>
        </div>
        {channels.map((channel) => {
          const Icon = getChannelIcon(channel.type)
          const isActive = channel.id === activeChannelId

          return (
            <div key={channel.id} className="group flex items-center">
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onChannelSelect(channel)}
                className={cn(
                  "flex-1 justify-start text-left h-8 px-2",
                  isActive && "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="mr-2 h-3 w-3 flex-shrink-0" />
                <span className="truncate text-sm">{channel.name}</span>
                <div className="flex items-center space-x-1 ml-auto">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{channel.members.length}</span>
                </div>
              </Button>

              {(onEditChannel || onDeleteChannel) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEditChannel && (
                      <DropdownMenuItem onClick={() => onEditChannel(channel)}>Edit Channel</DropdownMenuItem>
                    )}
                    {onDeleteChannel && (
                      <DropdownMenuItem onClick={() => onDeleteChannel(channel)} className="text-destructive">
                        Delete Channel
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-card-foreground">Channels</h2>
          <Button variant="ghost" size="sm" onClick={onCreateChannel} className="h-6 w-6 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-4">
          {renderChannelGroup("Announcements", groupedChannels.ANNOUNCEMENTS, "ANNOUNCEMENTS")}
          {renderChannelGroup("General", groupedChannels.PROJECT_GENERAL, "PROJECT_GENERAL")}
          {renderChannelGroup("Tasks", groupedChannels.TASK_SPECIFIC, "TASK_SPECIFIC")}
          {renderChannelGroup("Direct Messages", groupedChannels.PRIVATE_DM, "PRIVATE_DM")}
        </div>

        {channels.length === 0 && (
          <div className="text-center py-8">
            <div className="space-y-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No channels yet</p>
              <Button variant="outline" size="sm" onClick={onCreateChannel}>
                <Plus className="h-3 w-3 mr-1" />
                Create Channel
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
