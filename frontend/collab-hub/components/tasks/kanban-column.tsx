"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TaskCard } from "./task-card"
import { Plus } from "lucide-react"
import type { Task } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  title: string
  status: Task["status"]
  tasks: Task[]
  onTaskEdit: (task: Task) => void
  onTaskDelete: (task: Task) => void
  onTaskStatusChange: (task: Task, newStatus: Task["status"]) => void
  onCreateTask: (status: Task["status"]) => void
  color?: string
}

export function KanbanColumn({
  title,
  status,
  tasks,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onCreateTask,
  color = "bg-muted",
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const taskData = e.dataTransfer.getData("text/plain")
      const task: Task = JSON.parse(taskData)

      if (task.status !== status) {
        onTaskStatusChange(task, status)
      }
    } catch (error) {
      console.error("Error handling task drop:", error)
    }
  }

  return (
    <Card
      className={cn(
        "flex flex-col h-full min-h-[600px] transition-colors",
        isDragOver && "ring-2 ring-primary ring-offset-2",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <div className={cn("w-3 h-3 rounded-full", color)} />
            <span>{title}</span>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onCreateTask(status)} className="h-6 w-6 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", color)}>
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">No tasks yet</p>
            <Button variant="ghost" size="sm" onClick={() => onCreateTask(status)} className="text-xs">
              Add a task
            </Button>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onStatusChange={onTaskStatusChange}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
