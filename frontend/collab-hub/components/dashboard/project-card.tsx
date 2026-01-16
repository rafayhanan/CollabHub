"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Users, CheckSquare, Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"
import type { Project } from "@/lib/api/types"

interface ProjectCardProps {
  project: Project & {
    taskStats?: {
      total: number
      completed: number
      inProgress: number
    }
    memberCount?: number
    lastActivity?: string
  }
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const completionRate = project.taskStats
    ? Math.round((project.taskStats.completed / project.taskStats.total) * 100) || 0
    : 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg text-balance">
              <Link href={`/dashboard/projects/${project.id}`} className="hover:text-primary transition-colors">
                {project.name}
              </Link>
            </CardTitle>
            <CardDescription className="text-sm text-pretty">{project.description}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>Edit Project</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(project)} className="text-destructive">
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {project.taskStats && project.taskStats.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            {project.taskStats && (
              <div className="flex items-center space-x-1 text-muted-foreground">
                <CheckSquare className="h-3 w-3" />
                <span>
                  {project.taskStats.completed}/{project.taskStats.total}
                </span>
              </div>
            )}
            {project.memberCount && (
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{project.memberCount}</span>
              </div>
            )}
          </div>

          {project.lastActivity && (
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(project.lastActivity).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Team Members Preview */}
        {project.members && project.members.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {project.members.slice(0, 3).map((member) => (
                <Avatar key={member.userId} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">{member.user.email.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              ))}
              {project.members.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{project.members.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              <CheckSquare className="h-3 w-3 mr-1" />
              Tasks
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${project.id}/chat`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              <MessageSquare className="h-3 w-3 mr-1" />
              Chat
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
