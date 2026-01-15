"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ProjectMembers } from "@/components/users/project-members"
import { projectApi, type Project } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

export default function ProjectMembersPage() {
  const params = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectData = await projectApi.getProject(params.id as string)
        setProject(projectData)
      } catch (error) {
        console.error("Failed to fetch project:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchProject()
    }
  }, [params.id])

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

  const isOwner = project.ownerId === user?.id

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
