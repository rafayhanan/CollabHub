"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import type { ProjectMember, Task } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api/error"

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateTask: (
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description" | "status" | "dueDate">>,
  ) => Promise<void>
  onUpdateAssignments: (task: Task, assignedUserIds: string[]) => Promise<void>
  canManageTask: (task: Task) => boolean
  projectMembers?: Record<string, ProjectMember[]>
  task: Task | null
}

export function EditTaskDialog({
  open,
  onOpenChange,
  onUpdateTask,
  onUpdateAssignments,
  canManageTask,
  projectMembers = {},
  task,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<Task["status"]>("TODO")
  const [dueDate, setDueDate] = useState<Date>()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([])

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setStatus(task.status)
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
      setAssignedUserIds(
        task.assignments?.map((assignment) => assignment.user?.id).filter(Boolean) as string[],
      )
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return

    if (!title.trim()) {
      setError("Task title is required")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await onUpdateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      })
      await onUpdateAssignments(task, assignedUserIds)
      onOpenChange(false)
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update task"))
    } finally {
      setIsLoading(false)
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the task details and status.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              disabled={isLoading || !canManageTask(task)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task (optional)"
              disabled={isLoading || !canManageTask(task)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as Task["status"])}
              disabled={isLoading || !canManageTask(task)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">Todo</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                  disabled={isLoading || !canManageTask(task)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {task && projectMembers[task.projectId]?.length ? (
            <div className="space-y-2">
              <Label>Assign Members</Label>
              <div className="space-y-2 rounded-md border p-3">
                {projectMembers[task.projectId].map((member) => (
                  <label key={member.userId} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={assignedUserIds.includes(member.userId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedUserIds((prev) => [...prev, member.userId])
                        } else {
                          setAssignedUserIds((prev) => prev.filter((id) => id !== member.userId))
                        }
                      }}
                      disabled={isLoading || !canManageTask(task)}
                    />
                    <span>{member.user.name || member.user.email}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !canManageTask(task)}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
