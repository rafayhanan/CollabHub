"use client"

import { useMemo, useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { useCreateProject, useProjects } from "@/hooks/use-projects"
import type { ProjectMember } from "@/lib/api/types"

export default function TeamPage() {
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false)
  const { data: projects = [], isLoading } = useProjects()
  const { mutateAsync: createProjectMutation } = useCreateProject()

  const members = useMemo(() => {
    const map = new Map<string, ProjectMember>()
    projects.forEach((project) => {
      project.members?.forEach((member) => {
        if (!map.has(member.userId)) {
          map.set(member.userId, member)
        }
      })
    })
    return Array.from(map.values())
  }, [projects])

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
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-balance">Team</h1>
              <p className="text-muted-foreground text-pretty">People across all projects you collaborate with.</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>{members.length} members across your projects.</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No team members yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {members.map((member) => (
                      <div key={member.userId} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user.avatarUrl || "/placeholder.svg"} />
                            <AvatarFallback>
                              {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.name || member.user.email}</p>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
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
