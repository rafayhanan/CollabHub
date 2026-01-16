"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { useProject, useProjects, useCreateProject } from "@/hooks/use-projects"
import { useProjectTasks } from "@/hooks/use-tasks"
import type { Task } from "@/lib/api/types"
import Link from "next/link"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = typeof params.id === "string" ? params.id : null
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false)

  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { mutateAsync: createProjectMutation } = useCreateProject()
  const { data: project, isLoading: projectLoading } = useProject(projectId)
  const { data: tasks = [], isLoading: tasksLoading } = useProjectTasks(projectId)

  const taskStats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.status === "DONE").length
    const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length
    const todo = tasks.filter((task) => task.status === "TODO").length
    return { total, completed, inProgress, todo }
  }, [tasks])

  const handleCreateProject = async (name: string, description: string) => {
    await createProjectMutation({ name, description })
  }

  if (projectsLoading || projectLoading || tasksLoading) {
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
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Project not found.</p>
            <Link href="/dashboard">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
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

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-balance">{project.name}</h1>
              <p className="text-muted-foreground text-pretty">{project.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Tasks</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{taskStats.total}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Todo</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{taskStats.todo}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">In Progress</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{taskStats.inProgress}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Completed</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{taskStats.completed}</CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Project Tasks</CardTitle>
                    <CardDescription>Tasks associated with this project.</CardDescription>
                  </div>
                  <Link href="/dashboard/tasks">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      View All Tasks
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 6).map((task: Task) => (
                      <div key={task.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border rounded-lg p-3">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                        </div>
                        <Badge variant="secondary">{task.status.replace("_", " ")}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>
                      {project.members?.length || 0} member{project.members?.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                  <Link href={`/dashboard/projects/${project.id}/members`}>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Manage Members
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {project.members && project.members.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {project.members.slice(0, 6).map((member) => (
                      <Badge key={member.userId} variant="outline">
                        {member.user.name || member.user.email}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <CreateProjectDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
