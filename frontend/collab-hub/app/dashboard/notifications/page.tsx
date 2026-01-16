"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { NotificationList } from "@/components/notifications/notification-list"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { useCreateProject, useProjects } from "@/hooks/use-projects"
import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsPage() {
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false)
  const { data: projects = [], isLoading } = useProjects()
  const { mutateAsync: createProjectMutation } = useCreateProject()

  const handleCreateProject = async (name: string, description: string) => {
    await createProjectMutation({ name, description })
  }

  if (isLoading) {
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
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">All your project updates in one place</p>
            </div>

            <NotificationList />
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
