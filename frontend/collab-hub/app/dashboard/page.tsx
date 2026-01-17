"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { ProjectCard } from "@/components/dashboard/project-card"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Project } from "@/lib/api/types"
import { useCreateProject, useDeleteProject, useProjects } from "@/hooks/use-projects"
import { useAllProjectTasks, useUserTasks } from "@/hooks/use-tasks"
import { Plus, CheckSquare, Clock, AlertCircle, TrendingUp } from "lucide-react"
import { getApiErrorMessage } from "@/lib/api/error"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useProjects()
  const { data: userTasks = [], isLoading: tasksLoading, error: tasksError } = useUserTasks()
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
  const managedProjectIds = useMemo(
    () =>
      projects
        .filter((project) => {
          const role = roleByProjectId.get(project.id)
          return role === "OWNER" || role === "MANAGER"
        })
        .map((project) => project.id),
    [projects, roleByProjectId],
  )
  const isManagerOrOwner = managedProjectIds.length > 0
  const {
    data: managedProjectTasks = [],
    isLoading: managedTasksLoading,
    error: managedTasksError,
  } = useAllProjectTasks(managedProjectIds, isManagerOrOwner)
  const projectTaskStats = useMemo(() => {
    const stats = new Map<string, { total: number; completed: number; inProgress: number }>()
    for (const task of managedProjectTasks) {
      const current = stats.get(task.projectId) || { total: 0, completed: 0, inProgress: 0 }
      current.total += 1
      if (task.status === "DONE") current.completed += 1
      if (task.status === "IN_PROGRESS") current.inProgress += 1
      stats.set(task.projectId, current)
    }
    return stats
  }, [managedProjectTasks])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const { mutateAsync: createProjectMutation } = useCreateProject()
  const { mutateAsync: deleteProjectMutation } = useDeleteProject()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (isAuthenticated) {
      setIsLoading(false)
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (projectsError || tasksError || managedTasksError) {
      setError(getApiErrorMessage(projectsError || tasksError || managedTasksError, "Failed to load dashboard data"))
    }
  }, [projectsError, tasksError, managedTasksError])

  const handleCreateProject = async (name: string, description: string) => {
    await createProjectMutation({ name, description })
  }

  const handleDeleteProject = async (project: Project) => {
    const role = roleByProjectId.get(project.id)
    if (role !== "OWNER") return
    toast({
      title: "Delete project?",
      description: `This will permanently delete "${project.name}" and its data.`,
      variant: "destructive",
      action: (
        <ToastAction
          altText="Confirm delete"
          onClick={() => deleteProjectMutation(project.id)}
        >
          Delete
        </ToastAction>
      ),
    })
  }

  const handleEditProject = (project: Project) => {
    // TODO: Implement edit functionality
    console.log("Edit project:", project)
  }

  if (authLoading || isLoading || projectsLoading || tasksLoading || managedTasksLoading) {
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
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const overviewTasks = isManagerOrOwner ? managedProjectTasks : userTasks
  const taskStats = {
    total: overviewTasks.length,
    todo: overviewTasks.filter((t) => t.status === "TODO").length,
    inProgress: overviewTasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: overviewTasks.filter((t) => t.status === "DONE").length,
    overdue: overviewTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE").length,
  }
  const myTaskStats = {
    total: userTasks.length,
    todo: userTasks.filter((t) => t.status === "TODO").length,
    inProgress: userTasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: userTasks.filter((t) => t.status === "DONE").length,
    overdue: userTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE").length,
  }

  return (
    <div className="flex min-h-screen md:h-screen bg-background">
      <Sidebar projects={projects} onCreateProject={() => setIsCreateDialogOpen(true)} className="hidden md:flex" />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <DashboardHeader
          onCreateProject={() => setIsCreateDialogOpen(true)}
          mobileSidebar={<MobileSidebar projects={projects} onCreateProject={() => setIsCreateDialogOpen(true)} />}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-balance">Welcome back!</h1>
              <p className="text-muted-foreground text-pretty">
                Here&apos;s what&apos;s happening with your projects and tasks today.
              </p>
            </div>

            {/* Quick Stats */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isManagerOrOwner ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <p className="text-xs text-muted-foreground">Active projects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{isManagerOrOwner ? "All Tasks" : "My Tasks"}</CardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{taskStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {taskStats.completed} completed, {taskStats.inProgress} in progress
                  </p>
                </CardContent>
              </Card>

              {isManagerOrOwner && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{myTaskStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {myTaskStats.completed} completed, {myTaskStats.inProgress} in progress
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{taskStats.inProgress}</div>
                  <p className="text-xs text-muted-foreground">Tasks being worked on</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{taskStats.overdue}</div>
                  <p className="text-xs text-muted-foreground">Tasks past due date</p>
                </CardContent>
              </Card>
            </div>

            {/* Projects Section */}
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold">Your Projects</h2>
                <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

              {projects.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">No projects yet</h3>
                        <p className="text-muted-foreground text-pretty">
                          Create your first project to start organizing your work and collaborating with your team.
                        </p>
                      </div>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Project
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={{
                        ...project,
                        taskStats: projectTaskStats.get(project.id),
                        memberCount: project.members?.length,
                      }}
                      onEdit={handleEditProject}
                      onDelete={handleDeleteProject}
                      canDelete={roleByProjectId.get(project.id) === "OWNER"}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Tasks */}
            {overviewTasks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{isManagerOrOwner ? "Recent Tasks (All Projects)" : "Recent Tasks"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overviewTasks.slice(0, 4).map((task) => (
                    <Card key={task.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base text-balance">{task.title}</CardTitle>
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
                        {task.description && (
                          <CardDescription className="text-sm text-pretty">{task.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {task.dueDate && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {isManagerOrOwner && userTasks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">My Assigned Tasks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userTasks.slice(0, 4).map((task) => (
                    <Card key={task.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base text-balance">{task.title}</CardTitle>
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
                        {task.description && (
                          <CardDescription className="text-sm text-pretty">{task.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {task.dueDate && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
