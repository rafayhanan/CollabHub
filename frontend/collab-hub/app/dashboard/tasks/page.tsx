"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { KanbanColumn } from "@/components/tasks/kanban-column"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getProjects, getUserTasks, createTask, updateTask, createProject, type Project, type Task } from "@/lib/api"
import { Search, Plus, LayoutGrid, List } from "lucide-react"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { useTaskEvents } from "@/hooks/use-websocket"

export default function TasksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false)
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false)
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [createTaskStatus, setCreateTaskStatus] = useState<Task["status"]>("TODO")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    filterTasks()
  }, [filterTasks])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [projectsData, tasksData] = await Promise.all([getProjects(), getUserTasks()])
      setProjects(projectsData)
      setTasks(tasksData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const filterTasks = useCallback(() => {
    let filtered = tasks

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by project
    if (selectedProject !== "all") {
      filtered = filtered.filter((task) => task.projectId === selectedProject)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchQuery, selectedProject])

  const handleCreateTask = async (
    projectId: string,
    title: string,
    description: string,
    status: Task["status"],
    dueDate?: string,
  ) => {
    const newTask = await createTask(projectId, title, description, dueDate)
    // Update the task status if different from default
    if (status !== "TODO") {
      const updatedTask = await updateTask(newTask.id, { status })
      setTasks((prev) => [updatedTask, ...prev])
    } else {
      setTasks((prev) => [newTask, ...prev])
    }
  }

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description" | "status" | "dueDate">>,
  ) => {
    const updatedTask = await updateTask(taskId, updates)
    setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)))
  }

  const handleDeleteTask = async (task: Task) => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      // Note: The API doesn't have a delete task endpoint in the provided documentation
      // This would need to be implemented on the backend
      console.log("Delete task:", task)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsEditTaskDialogOpen(true)
  }

  const handleStatusChange = async (task: Task, newStatus: Task["status"]) => {
    await handleUpdateTask(task.id, { status: newStatus })
  }

  const handleCreateProject = async (name: string, description: string) => {
    const newProject = await createProject(name, description)
    setProjects((prev) => [newProject, ...prev])
  }

  useTaskEvents(selectedProject === "all" ? null : selectedProject, {
    onTaskCreated: (task) => {
      setTasks((prev) => [task, ...prev])
    },
    onTaskUpdated: (updatedTask) => {
      setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
    },
    onTaskDeleted: (taskId) => {
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    },
  })

  const todoTasks = filteredTasks.filter((task) => task.status === "TODO")
  const inProgressTasks = filteredTasks.filter((task) => task.status === "IN_PROGRESS")
  const doneTasks = filteredTasks.filter((task) => task.status === "DONE")

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
    <div className="flex h-screen bg-background">
      <Sidebar projects={projects} onCreateProject={() => setIsCreateProjectDialogOpen(true)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onCreateProject={() => setIsCreateProjectDialogOpen(true)} />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-balance">Task Management</h1>
                <p className="text-muted-foreground">Organize and track your tasks across all projects.</p>
              </div>
              <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-48">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KanbanColumn
                  title="Todo"
                  status="TODO"
                  tasks={todoTasks}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskStatusChange={handleStatusChange}
                  onCreateTask={(status) => {
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
                  onCreateTask={(status) => {
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
                  onCreateTask={(status) => {
                    setCreateTaskStatus(status)
                    setIsCreateTaskDialogOpen(true)
                  }}
                  color="bg-primary"
                />
              </div>
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
                        <div className="flex items-start justify-between">
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
        projects={projects}
        initialStatus={createTaskStatus}
      />

      <EditTaskDialog
        open={isEditTaskDialogOpen}
        onOpenChange={setIsEditTaskDialogOpen}
        onUpdateTask={handleUpdateTask}
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
