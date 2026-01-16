"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { Channel, Project, Task } from "@/lib/api/types"

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateChannel: (
    name: string,
    type: Channel["type"],
    description?: string,
    projectId?: string,
    taskId?: string,
  ) => Promise<void>
  projects: Project[]
  tasks?: Task[]
  initialProjectId?: string
}

export function CreateChannelDialog({
  open,
  onOpenChange,
  onCreateChannel,
  projects,
  tasks = [],
  initialProjectId,
}: CreateChannelDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<Channel["type"]>("PROJECT_GENERAL")
  const [projectId, setProjectId] = useState(initialProjectId || "")
  const [taskId, setTaskId] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Channel name is required")
      return
    }

    if ((type === "PROJECT_GENERAL" || type === "ANNOUNCEMENTS") && !projectId) {
      setError("Please select a project")
      return
    }

    if (type === "TASK_SPECIFIC" && !taskId) {
      setError("Please select a task")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await onCreateChannel(
        name.trim(),
        type,
        description.trim() || undefined,
        projectId || undefined,
        taskId || undefined,
      )
      // Reset form
      setName("")
      setDescription("")
      setType("PROJECT_GENERAL")
      setProjectId(initialProjectId || "")
      setTaskId("")
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create channel")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTasks = tasks.filter((task) => !projectId || task.projectId === projectId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
          <DialogDescription>Create a new channel for team communication.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter channel name"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Channel Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as Channel["type"])} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROJECT_GENERAL">Project General</SelectItem>
                <SelectItem value="TASK_SPECIFIC">Task Specific</SelectItem>
                <SelectItem value="ANNOUNCEMENTS">Announcements</SelectItem>
                <SelectItem value="PRIVATE_DM">Private Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(type === "PROJECT_GENERAL" || type === "ANNOUNCEMENTS") && (
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "TASK_SPECIFIC" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={projectId} onValueChange={setProjectId} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {projectId && (
                <div className="space-y-2">
                  <Label htmlFor="task">Task</Label>
                  <Select value={taskId} onValueChange={setTaskId} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the channel purpose"
              disabled={isLoading}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Channel"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
