"use client"

import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"
import type { Task } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { TaskCard } from "./task-card"

interface SortableTaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (task: Task, newStatus: Task["status"]) => void
}

export function SortableTaskCard({ task, onEdit, onDelete, onStatusChange }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn("touch-none", isDragging && "opacity-60")}>
      <div {...attributes} {...listeners}>
        <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} isDragging={isDragging} />
      </div>
    </div>
  )
}
