"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { ProjectMembers } from "@/components/users/project-members"
import { useAuth } from "@/hooks/use-auth"
import { useProject } from "@/hooks/use-projects"

export default function ProjectMembersPage() {
  const params = useParams()
  const { user } = useAuth()
  const projectId = typeof params.id === "string" ? params.id : null
  const { data: project, isLoading } = useProject(projectId)
  const isOwner = useMemo(
    () => project?.members?.some((m) => m.userId === user?.id && m.role === "OWNER") || false,
    [project, user],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.name} - Members</h1>
        <p className="text-muted-foreground">Manage project members and invitations</p>
      </div>

      <ProjectMembers projectId={project.id} currentUserId={user?.id || ""} isOwner={isOwner} />
    </div>
  )
}
