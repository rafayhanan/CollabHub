"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Clock, MoreHorizontal, User } from "lucide-react"
import type { Task } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (task: Task, newStatus: Task["status"]) => void
  isDragging?: boolean
  canManage?: boolean
  canDelete?: boolean
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  isDragging,
  canManage = true,
  canDelete = true,
}: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE"

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "TODO":
        return "bg-muted text-muted-foreground"
      case "IN_PROGRESS":
        return "bg-secondary text-secondary-foreground"
      case "DONE":
        return "bg-primary text-primary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityColor = () => {
    if (isOverdue) return "border-l-destructive"
    if (task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) {
      return "border-l-orange-500"
    }
    return "border-l-transparent"
  }

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 border-l-4",
        getPriorityColor(),
        isDragging && "opacity-60 shadow-lg",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-medium text-sm text-balance leading-tight">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-muted-foreground text-pretty line-clamp-2">{task.description}</p>
            )}
          </div>
          {canManage || canDelete ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)} disabled={!canManage}>
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(task, "TODO")} disabled={!canManage}>
                  Move to Todo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(task, "IN_PROGRESS")} disabled={!canManage}>
                  Move to In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(task, "DONE")} disabled={!canManage}>
                  Move to Done
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive" disabled={!canDelete}>
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status Badge */}
        <Badge className={cn("text-xs", getStatusColor(task.status))} variant="secondary">
          {task.status.replace("_", " ")}
        </Badge>

        {/* Due Date */}
        {task.dueDate && (
          <div className={cn("flex items-center text-xs", isOverdue ? "text-destructive" : "text-muted-foreground")}>
            <Calendar className="h-3 w-3 mr-1" />
            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
            {isOverdue && <Clock className="h-3 w-3 ml-1" />}
          </div>
        )}

        {/* Assignments */}
        {task.assignments && task.assignments.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Assigned to:</span>
            </div>
            <div className="flex -space-x-1">
              {task.assignments.slice(0, 3).map((assignment, index) => (
                <Avatar key={index} className="h-5 w-5 border border-background">
                  <AvatarFallback className="text-xs">
                    {assignment.user?.name?.charAt(0) ||
                      assignment.user?.email?.charAt(0).toUpperCase() ||
                      "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assignments.length > 3 && (
                <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{task.assignments.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
