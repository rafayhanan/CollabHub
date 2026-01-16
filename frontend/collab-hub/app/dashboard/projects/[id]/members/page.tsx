"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ProjectMembers } from "@/components/users/project-members"
import { useAuth } from "@/hooks/use-auth"
import { useProject } from "@/hooks/use-projects"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { useCreateProject, useProjects } from "@/hooks/use-projects"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectMembersPage() {
  const params = useParams()
  const { user } = useAuth()
  const projectId = typeof params.id === "string" ? params.id : null
  const { data: project, isLoading } = useProject(projectId)
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { mutateAsync: createProjectMutation } = useCreateProject()
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false)
  const isOwner = useMemo(
    () => project?.members?.some((m) => m.userId === user?.id && m.role === "OWNER") || false,
    [project, user],
  )

  const handleCreateProject = async (name: string, description: string) => {
    await createProjectMutation({ name, description })
  }

  if (isLoading || projectsLoading) {
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
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar projects={projects} onCreateProject={() => setIsCreateProjectDialogOpen(true)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onCreateProject={() => setIsCreateProjectDialogOpen(true)} />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.name} - Members</h1>
              <p className="text-muted-foreground">Manage project members and invitations</p>
            </div>

            <ProjectMembers projectId={project.id} currentUserId={user?.id || ""} isOwner={isOwner} />
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
