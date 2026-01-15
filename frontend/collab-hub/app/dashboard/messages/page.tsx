"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ChannelList } from "@/components/chat/channel-list"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { CreateChannelDialog } from "@/components/chat/create-channel-dialog"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import {
  getProjects,
  getUserTasks,
  getProjectChannels,
  getChannelMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  createChannel,
  createProject,
  type Project,
  type Task,
  type Channel,
  type Message,
} from "@/lib/api"
import { Hash, MessageSquare, Users } from "lucide-react"
import { useChannelEvents } from "@/hooks/use-websocket"

export default function MessagesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [isCreateChannelDialogOpen, setIsCreateChannelDialogOpen] = useState(false)
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (isAuthenticated) {
      loadInitialData()
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (activeChannel) {
      loadChannelMessages(activeChannel.id)
    }
  }, [activeChannel])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const [projectsData, tasksData] = await Promise.all([getProjects(), getUserTasks()])
      setProjects(projectsData)
      setTasks(tasksData)

      // Load channels for all projects
      if (projectsData.length > 0) {
        const allChannels: Channel[] = []
        for (const project of projectsData) {
          try {
            const projectChannels = await getProjectChannels(project.id)
            allChannels.push(...projectChannels)
          } catch (err) {
            console.error(`Failed to load channels for project ${project.id}:`, err)
          }
        }
        setChannels(allChannels)

        // Select first channel if available
        if (allChannels.length > 0) {
          setActiveChannel(allChannels[0])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadChannelMessages = async (channelId: string) => {
    try {
      setIsMessagesLoading(true)
      const messagesData = await getChannelMessages(channelId)
      setMessages(messagesData)
    } catch (err) {
      console.error("Failed to load messages:", err)
      setMessages([])
    } finally {
      setIsMessagesLoading(false)
    }
  }

  const handleChannelSelect = (channel: Channel) => {
    setActiveChannel(channel)
  }

  const handleSendMessage = async (content: string) => {
    if (!activeChannel) return

    const tempMessage = {
      id: `temp-${Date.now()}`,
      content,
      channelId: activeChannel.id,
      authorId: "current-user", // This would be the actual user ID
      author: { id: "current-user", name: "You", email: "" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      const newMessage = await sendMessage(activeChannel.id, content)
      setMessages((prev) => prev.map((msg) => (msg.id === tempMessage.id ? newMessage : msg)))
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id))
      console.error("Failed to send message:", error)
    }
  }

  const handleEditMessage = async (messageId: string, content: string) => {
    const updatedMessage = await editMessage(messageId, content)
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? updatedMessage : msg)))
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(messageId)
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    }
  }

  const handleCreateChannel = async (
    name: string,
    type: Channel["type"],
    description?: string,
    projectId?: string,
    taskId?: string,
  ) => {
    const newChannel = await createChannel(name, type, description, projectId, taskId)
    setChannels((prev) => [newChannel, ...prev])
    setActiveChannel(newChannel)
  }

  const handleCreateProject = async (name: string, description: string) => {
    const newProject = await createProject(name, description)
    setProjects((prev) => [newProject, ...prev])
  }

  useChannelEvents(activeChannel?.id || null, {
    onMessageCreated: (message) => {
      setMessages((prev) => [...prev, message])
    },
    onMessageUpdated: (updatedMessage) => {
      setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)))
    },
    onMessageDeleted: (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
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

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r bg-sidebar">
          <Skeleton className="h-16 w-full" />
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <Skeleton className="h-16 w-full" />
          <div className="flex h-[calc(100vh-4rem)]">
            <div className="w-64 border-r">
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
    <div className="flex h-screen bg-background">
      <Sidebar projects={projects} onCreateProject={() => setIsCreateProjectDialogOpen(true)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onCreateProject={() => setIsCreateProjectDialogOpen(true)} />

        <div className="flex-1 flex overflow-hidden">
          <ChannelList
            channels={channels}
            activeChannelId={activeChannel?.id}
            onChannelSelect={handleChannelSelect}
            onCreateChannel={() => setIsCreateChannelDialogOpen(true)}
          />

          <div className="flex-1 flex flex-col">
            {error && (
              <div className="border-b border-border bg-destructive/10 text-destructive text-sm px-4 py-2">
                {error}
              </div>
            )}
            {activeChannel ? (
              <>
                {/* Channel Header */}
                <div className="border-b border-border p-4 bg-background">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {activeChannel.type === "PROJECT_GENERAL" && <Hash className="h-5 w-5 text-muted-foreground" />}
                      {activeChannel.type === "TASK_SPECIFIC" && (
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      )}
                      {activeChannel.type === "PRIVATE_DM" && <Users className="h-5 w-5 text-muted-foreground" />}
                      <h1 className="text-lg font-semibold">{activeChannel.name}</h1>
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
                  isLoading={isMessagesLoading}
                />

                <TypingIndicator typingUsers={typingUsers} />

                {/* Message Input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  placeholder={`Message #${activeChannel.name}`}
                  channelId={activeChannel.id} // Pass channelId for typing indicators
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="w-96">
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
      />

      <CreateProjectDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
