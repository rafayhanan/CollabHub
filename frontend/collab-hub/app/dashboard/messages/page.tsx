"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { ChannelList } from "@/components/chat/channel-list"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { CreateChannelDialog } from "@/components/chat/create-channel-dialog"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import type { Channel, Message, ProjectMember } from "@/lib/api/types"
import { useProjects, useCreateProject } from "@/hooks/use-projects"
import { useUserTasks } from "@/hooks/use-tasks"
import { useAllProjectChannels, useCreateChannel } from "@/hooks/use-channels"
import { useChannelMessages, useDeleteMessage, useEditMessage, useSendMessage, messageKeys } from "@/hooks/use-messages"
import { useQueryClient } from "@tanstack/react-query"
import { Hash, MessageSquare, Megaphone } from "lucide-react"
import { useChannelEvents } from "@/hooks/use-websocket"
import { getApiErrorMessage } from "@/lib/api/error"
import { useToast } from "@/hooks/use-toast"

export default function MessagesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useProjects()
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useUserTasks()
  const projectIds = useMemo(() => projects.map((project) => project.id), [projects])
  const {
    data: channels = [],
    isLoading: channelsLoading,
    error: channelsError,
  } = useAllProjectChannels(projectIds)
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([])
  const [isCreateChannelDialogOpen, setIsCreateChannelDialogOpen] = useState(false)
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const { mutateAsync: createProjectMutation } = useCreateProject()
  const { mutateAsync: createChannelMutation } = useCreateChannel()
  const { data: messages = [], isLoading: messagesLoading } = useChannelMessages(activeChannel?.id || null)
  const { mutateAsync: sendMessageMutation } = useSendMessage()
  const { mutateAsync: editMessageMutation } = useEditMessage()
  const { mutateAsync: deleteMessageMutation } = useDeleteMessage()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (isAuthenticated) {
      setError("")
    }
  }, [isAuthenticated, authLoading, router])

  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  )
  const requestedProjectId = searchParams.get("projectId")
  useEffect(() => {
    if (channels.length === 0) return

    const preferredChannel = requestedProjectId
      ? channels.find(
        (channel) => channel.projectId === requestedProjectId && channel.type === "ANNOUNCEMENTS",
      ) ||
      channels.find(
        (channel) => channel.projectId === requestedProjectId && channel.type === "PROJECT_GENERAL",
      ) ||
      channels.find((channel) => channel.projectId === requestedProjectId) ||
      null
      : null

    if (!activeChannel && (preferredChannel || channels[0])) {
      setActiveChannel(preferredChannel || channels[0])
      return
    }

    if (requestedProjectId && activeChannel?.projectId !== requestedProjectId) {
      setActiveChannel(preferredChannel || channels[0])
    }
  }, [channels, activeChannel, requestedProjectId])

  useEffect(() => {
    if (projectsError || tasksError || channelsError) {
      setError(getApiErrorMessage(projectsError || tasksError || channelsError, "Failed to load data"))
    }
  }, [projectsError, tasksError, channelsError])

  const handleChannelSelect = (channel: Channel) => {
    setActiveChannel(channel)
  }

  const handleSendMessage = async (content: string) => {
    if (!activeChannel) return

    try {
      await sendMessageMutation({ channelId: activeChannel.id, content })
    } catch (sendError) {
      toast({
        title: "Message not sent",
        description: getApiErrorMessage(sendError, "Failed to send message"),
        variant: "destructive",
      })
    }
  }

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      await editMessageMutation({ messageId, content })
    } catch (err) {
      toast({
        title: "Update failed",
        description: getApiErrorMessage(err, "Failed to update message"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      const message = messages.find((msg) => msg.id === messageId)
      if (!message) return
      try {
        await deleteMessageMutation(message)
      } catch (err) {
        toast({
          title: "Delete failed",
          description: getApiErrorMessage(err, "Failed to delete message"),
          variant: "destructive",
        })
      }
    }
  }

  const handleCreateChannel = async (
    name: string,
    type: Channel["type"],
    description?: string,
    projectId?: string,
    taskId?: string,
    memberIds?: string[],
  ) => {
    const newChannel = await createChannelMutation({ name, type, description, projectId, taskId, memberIds })
    setActiveChannel(newChannel)
  }

  const handleCreateProject = async (name: string, description: string) => {
    await createProjectMutation({ name, description })
  }

  const roleByProjectId = useMemo(
    () =>
      new Map(
        projects.map((project) => [
          project.id,
          project.members?.find((member) => member.userId === user?.id)?.role || "MEMBER",
        ]),
      ),
    [projects, user?.id],
  )
  const canSendInChannel = useMemo(() => {
    if (!activeChannel) return false
    if (activeChannel.type !== "ANNOUNCEMENTS") return true
    const role = activeChannel.projectId ? roleByProjectId.get(activeChannel.projectId) : "MEMBER"
    return role === "OWNER" || role === "MANAGER"
  }, [activeChannel, roleByProjectId])

  useChannelEvents(activeChannel?.id || null, {
    onMessageCreated: (message) => {
      queryClient.setQueryData<Message[]>(messageKeys.channel(message.channelId), (old) => {
        if (old?.some((msg) => msg.id === message.id)) return old
        return old ? [...old, message] : [message]
      })
    },
    onMessageUpdated: (updatedMessage) => {
      queryClient.setQueryData<Message[]>(messageKeys.channel(updatedMessage.channelId), (old) =>
        old ? old.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)) : old,
      )
    },
    onMessageDeleted: (messageId) => {
      if (!activeChannel) return
      queryClient.setQueryData<Message[]>(messageKeys.channel(activeChannel.id), (old) =>
        old ? old.filter((msg) => msg.id !== messageId) : old,
      )
    },
    onTypingStart: (userId, userName) => {
      setTypingUsers((prev) => {
        if (prev.find((user) => user.userId === userId)) return prev
        return [...prev, { userId, userName }]
      })
    },
    onTypingStop: (userId) => {
      setTypingUsers((prev) => prev.filter((user) => user.userId !== userId))
    },
  })

  if (authLoading || projectsLoading || tasksLoading || channelsLoading) {
    return (
      <div className="flex min-h-screen md:h-screen">
        <div className="hidden md:block w-64 border-r bg-sidebar">
          <Skeleton className="h-16 w-full" />
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <Skeleton className="h-16 w-full" />
          <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
            <div className="md:w-64 border-r">
              <Skeleton className="h-full w-full" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen md:h-screen bg-background">
      <Sidebar projects={projects} onCreateProject={() => setIsCreateProjectDialogOpen(true)} className="hidden md:flex" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onCreateProject={() => setIsCreateProjectDialogOpen(true)}
          mobileSidebar={<MobileSidebar projects={projects} onCreateProject={() => setIsCreateProjectDialogOpen(true)} />}
        />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          <ChannelList
            channels={channels}
            projects={projects}
            activeChannelId={activeChannel?.id}
            onChannelSelect={handleChannelSelect}
            onCreateChannel={() => setIsCreateChannelDialogOpen(true)}
          />

          <div className="flex-1 flex flex-col min-h-0">
            {error && (
              <div className="border-b border-border bg-destructive/10 text-destructive text-sm px-4 py-2">
                {error}
              </div>
            )}
            {activeChannel ? (
              <>
                {/* Channel Header */}
                <div className="border-b border-border p-4 bg-background">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {activeChannel.type === "PROJECT_GENERAL" && <Hash className="h-5 w-5 text-muted-foreground" />}
                      {activeChannel.type === "TASK_SPECIFIC" && (
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      )}
                      {activeChannel.type === "ANNOUNCEMENTS" && <Megaphone className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <h1 className="text-lg font-semibold break-words">{activeChannel.name}</h1>
                        {activeChannel.projectId && (
                          <p className="text-xs text-muted-foreground">
                            {projectNameById.get(activeChannel.projectId)}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activeChannel.members.length} member{activeChannel.members.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                  {activeChannel.description && (
                    <p className="text-sm text-muted-foreground mt-1">{activeChannel.description}</p>
                  )}
                </div>

                {/* Messages */}
                <MessageList
                  messages={messages}
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                  isLoading={messagesLoading}
                />

                <TypingIndicator typingUsers={typingUsers} />

                {/* Message Input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  placeholder={`Message #${activeChannel.name}`}
                  channelId={activeChannel.id} // Pass channelId for typing indicators
                  disabled={!canSendInChannel}
                />
                {!canSendInChannel && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground">
                    Only owners and managers can send messages in announcements.
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="w-full max-w-md mx-4">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center space-x-2">
                      <MessageSquare className="h-6 w-6" />
                      <span>Welcome to Messages</span>
                    </CardTitle>
                    <CardDescription>Select a channel to start chatting with your team.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    {channels.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">No channels available yet.</p>
                        <p className="text-sm text-muted-foreground">Create your first channel to get started!</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Choose a channel from the sidebar to view messages and start conversations.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateChannelDialog
        open={isCreateChannelDialogOpen}
        onOpenChange={setIsCreateChannelDialogOpen}
        onCreateChannel={handleCreateChannel}
        projects={projects}
        tasks={tasks}
        projectMembers={projects.reduce<Record<string, ProjectMember[]>>((acc, project) => {
          acc[project.id] = project.members || []
          return acc
        }, {})}
      />

      <CreateProjectDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
