"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { KanbanColumn } from "@/components/tasks/kanban-column"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useQueryClient } from "@tanstack/react-query"
import type { ProjectMember, Task } from "@/lib/api/types"
import { useProjects, useCreateProject } from "@/hooks/use-projects"
import {
  useAllProjectTasks,
  useAssignTask,
  useCreateTask,
  useDeleteTask,
  useProjectTasks,
  useUnassignTask,
  useUpdateTask,
} from "@/hooks/use-tasks"
import { Search, Plus, LayoutGrid, List } from "lucide-react"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { useTaskEvents } from "@/hooks/use-websocket"
import { getApiErrorMessage } from "@/lib/api/error"
import { DndContext, DragOverlay, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import { TaskCard } from "@/components/tasks/task-card"

export default function TasksPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useProjects()
  const projectIds = useMemo(() => projects.map((project) => project.id), [projects])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false)
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false)
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [createTaskStatus, setCreateTaskStatus] = useState<Task["status"]>("TODO")
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const {
    data: allProjectTasks = [],
    isLoading: allTasksLoading,
    error: allTasksError,
  } = useAllProjectTasks(selectedProject === "all" ? projectIds : [])
  const {
    data: projectTasks = [],
    isLoading: projectTasksLoading,
    error: projectTasksError,
  } = useProjectTasks(selectedProject !== "all" ? selectedProject : null)

  const tasks = selectedProject === "all" ? allProjectTasks : projectTasks
  const isTasksLoading = selectedProject === "all" ? allTasksLoading : projectTasksLoading

  const { mutateAsync: createTaskMutation } = useCreateTask()
  const { mutateAsync: updateTaskMutation } = useUpdateTask()
  const { mutateAsync: deleteTaskMutation } = useDeleteTask()
  const { mutateAsync: assignTaskMutation } = useAssignTask()
  const { mutateAsync: unassignTaskMutation } = useUnassignTask()
  const { mutateAsync: createProjectMutation } = useCreateProject()

  useEffect(() => {
    if (projectsError || allTasksError || projectTasksError) {
      setError(getApiErrorMessage(projectsError || allTasksError || projectTasksError, "Failed to load data"))
    }
  }, [projectsError, allTasksError, projectTasksError])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (isAuthenticated) {
      setIsLoading(false)
    }
  }, [isAuthenticated, authLoading, router])

  const handleCreateTask = async (
    projectId: string,
    title: string,
    description: string,
    status: Task["status"],
    dueDate?: string,
    assignments?: Array<{ userId: string; note?: string }>,
  ) => {
    const newTask = await createTaskMutation({ projectId, title, description, dueDate, assignments })
    if (status !== "TODO") {
      await updateTaskMutation({ taskId: newTask.id, updates: { status } })
    }
  }

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description" | "status" | "dueDate">>,
  ) => {
    await updateTaskMutation({ taskId, updates })
  }

  const handleUpdateAssignments = async (task: Task, nextUserIds: string[]) => {
    const currentIds = new Set(
      task.assignments?.map((assignment) => assignment.user?.id).filter(Boolean) as string[],
    )
    const nextIds = new Set(nextUserIds)

    const toAssign = [...nextIds].filter((id) => !currentIds.has(id))
    const toUnassign = [...currentIds].filter((id) => !nextIds.has(id))

    if (toAssign.length > 0) {
      await assignTaskMutation({
        taskId: task.id,
        assignments: toAssign.map((userId) => ({ userId })),
      })
    }

    await Promise.all(toUnassign.map((userId) => unassignTaskMutation({ taskId: task.id, userId })))
  }

  const handleDeleteTask = async (task: Task) => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await deleteTaskMutation(task)
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to delete task"))
      }
    }
  }

  const handleEditTask = (task: Task) => {
    if (!canManageProject(task.projectId)) return
    setEditingTask(task)
    setIsEditTaskDialogOpen(true)
  }

  const handleStatusChange = async (task: Task, newStatus: Task["status"]) => {
    if (!canManageProject(task.projectId)) return
    await handleUpdateTask(task.id, { status: newStatus })
  }

  const handleCreateProject = async (name: string, description: string) => {
    await createProjectMutation({ name, description })
  }

  useTaskEvents(selectedProject === "all" ? null : selectedProject, {
    onTaskCreated: (task) => {
      queryClient.setQueryData<Task[]>(["tasks", "project", task.projectId], (old) =>
        old ? [task, ...old] : [task],
      )
      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks", "projects"] },
        (old) => (old ? [task, ...old] : old),
      )
    },
    onTaskUpdated: (updatedTask) => {
      queryClient.setQueryData<Task[]>(["tasks", "project", updatedTask.projectId], (old) =>
        old ? old.map((task) => (task.id === updatedTask.id ? updatedTask : task)) : old,
      )
      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks", "projects"] },
        (old) => (old ? old.map((task) => (task.id === updatedTask.id ? updatedTask : task)) : old),
      )
    },
    onTaskDeleted: (taskId) => {
      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks"] },
        (old) => (old ? old.filter((task) => task.id !== taskId) : old),
      )
    },
  })

  const filteredTasks = useMemo(() => {
    let filtered = tasks

    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedProject !== "all") {
      filtered = filtered.filter((task) => task.projectId === selectedProject)
    }

    return filtered
  }, [tasks, searchQuery, selectedProject])

  const todoTasks = filteredTasks.filter((task) => task.status === "TODO")
  const inProgressTasks = filteredTasks.filter((task) => task.status === "IN_PROGRESS")
  const doneTasks = filteredTasks.filter((task) => task.status === "DONE")
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
  const canManageProject = (projectId: string) => {
    const role = roleByProjectId.get(projectId)
    return role === "OWNER" || role === "MANAGER"
  }
  const canDeleteProjectTasks = (projectId: string) => roleByProjectId.get(projectId) === "OWNER"
  const canCreateAnyTask = projects.some((project) => canManageProject(project.id))
  const manageableProjects = projects.filter((project) => canManageProject(project.id))
  const tasksById = useMemo(() => new Map(filteredTasks.map((task) => [task.id, task])), [filteredTasks])
  const activeTask = activeTaskId ? tasksById.get(activeTaskId) : null

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const handleDragStart = (event: { active: { id: string | number } }) => {
    const activeId = String(event.active.id)
    const task = tasksById.get(activeId)
    if (task && !canManageProject(task.projectId)) {
      setActiveTaskId(null)
      return
    }
    setActiveTaskId(activeId)
  }

  const handleDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event
    setActiveTaskId(null)

    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    const task = tasksById.get(activeId)
    if (!task) return

    const statusIds: Task["status"][] = ["TODO", "IN_PROGRESS", "DONE"]
    let targetStatus: Task["status"] | null = null

    if (statusIds.includes(overId as Task["status"])) {
      targetStatus = overId as Task["status"]
    } else {
      const overTask = tasksById.get(overId)
      if (overTask) targetStatus = overTask.status
    }

    if (targetStatus && targetStatus !== task.status) {
      handleStatusChange(task, targetStatus)
    }
  }

  const handleDragCancel = () => {
    setActiveTaskId(null)
  }

  if (authLoading || isLoading || projectsLoading || isTasksLoading) {
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
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen md:h-screen bg-background">
      <Sidebar
        projects={projects}
        onCreateProject={() => setIsCreateProjectDialogOpen(true)}
        className="hidden md:flex"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onCreateProject={() => setIsCreateProjectDialogOpen(true)}
          mobileSidebar={<MobileSidebar projects={projects} onCreateProject={() => setIsCreateProjectDialogOpen(true)} />}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-balance">Task Management</h1>
                <p className="text-muted-foreground">Organize and track your tasks across all projects.</p>
              </div>
              {canCreateAnyTask ? (
                <Button onClick={() => setIsCreateTaskDialogOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              ) : null}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap flex-1">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "kanban" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

            {/* Kanban Board */}
            {viewMode === "kanban" && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KanbanColumn
                    title="Todo"
                    status="TODO"
                    tasks={todoTasks}
                    onTaskEdit={handleEditTask}
                    onTaskDelete={handleDeleteTask}
                    onTaskStatusChange={handleStatusChange}
                  canManageTask={(task) => canManageProject(task.projectId)}
                  canDeleteTask={(task) => canDeleteProjectTasks(task.projectId)}
                  canCreateTask={canCreateAnyTask}
                    onCreateTask={(status) => {
                    if (!canCreateAnyTask) return
                    setCreateTaskStatus(status)
                    setIsCreateTaskDialogOpen(true)
                    }}
                    color="bg-muted"
                  />
                  <KanbanColumn
                    title="In Progress"
                    status="IN_PROGRESS"
                    tasks={inProgressTasks}
                    onTaskEdit={handleEditTask}
                    onTaskDelete={handleDeleteTask}
                    onTaskStatusChange={handleStatusChange}
                  canManageTask={(task) => canManageProject(task.projectId)}
                  canDeleteTask={(task) => canDeleteProjectTasks(task.projectId)}
                  canCreateTask={canCreateAnyTask}
                    onCreateTask={(status) => {
                    if (!canCreateAnyTask) return
                    setCreateTaskStatus(status)
                    setIsCreateTaskDialogOpen(true)
                    }}
                    color="bg-secondary"
                  />
                  <KanbanColumn
                    title="Done"
                    status="DONE"
                    tasks={doneTasks}
                    onTaskEdit={handleEditTask}
                    onTaskDelete={handleDeleteTask}
                    onTaskStatusChange={handleStatusChange}
                  canManageTask={(task) => canManageProject(task.projectId)}
                  canDeleteTask={(task) => canDeleteProjectTasks(task.projectId)}
                  canCreateTask={canCreateAnyTask}
                    onCreateTask={(status) => {
                    if (!canCreateAnyTask) return
                    setCreateTaskStatus(status)
                    setIsCreateTaskDialogOpen(true)
                    }}
                    color="bg-primary"
                  />
                </div>
                <DragOverlay>
                  {activeTask ? (
                    <div className="w-[300px]">
                      <TaskCard
                        task={activeTask}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                        isDragging
                        canManage={canManageProject(activeTask.projectId)}
                        canDelete={canDeleteProjectTasks(activeTask.projectId)}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No tasks found.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">{task.title}</h3>
                            {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                          </div>
                          <Badge
                            variant={
                              task.status === "DONE"
                                ? "default"
                                : task.status === "IN_PROGRESS"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateTaskDialog
        open={isCreateTaskDialogOpen}
        onOpenChange={setIsCreateTaskDialogOpen}
        onCreateTask={handleCreateTask}
        projects={manageableProjects}
        initialStatus={createTaskStatus}
        projectMembers={projects.reduce<Record<string, ProjectMember[]>>((acc, project) => {
          acc[project.id] = project.members || []
          return acc
        }, {})}
      />

      <EditTaskDialog
        open={isEditTaskDialogOpen}
        onOpenChange={setIsEditTaskDialogOpen}
        onUpdateTask={handleUpdateTask}
        onUpdateAssignments={handleUpdateAssignments}
        canManageTask={(task) => canManageProject(task.projectId)}
        projectMembers={projects.reduce<Record<string, ProjectMember[]>>((acc, project) => {
          acc[project.id] = project.members || []
          return acc
        }, {})}
        task={editingTask}
      />

      <CreateProjectDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
