"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Crown } from "lucide-react"
import { projectApi, type ProjectMember } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { InviteUserDialog } from "./invite-user-dialog"

interface ProjectMembersProps {
  projectId: string
  currentUserId?: string // Optional - for future use when remove member is implemented
  isOwner: boolean
}

export function ProjectMembers({ projectId, isOwner }: ProjectMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchMembers = useCallback(async () => {
    try {
      const project = await projectApi.getProject(projectId)
      setMembers(project.members || [])
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch project members",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [projectId, toast])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "ADMIN":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Project Members
            </CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          {isOwner && <InviteUserDialog projectId={projectId} onInviteSent={fetchMembers} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.user.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>{getInitials(member.user.name || member.user.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.user.name || member.user.email}</p>
                    {member.role === "OWNER" && <Crown className="h-4 w-4 text-emerald-600" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getRoleColor(member.role)}>
                  {member.role}
                </Badge>
                {/* Remove member button hidden - backend endpoint not implemented yet */}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
