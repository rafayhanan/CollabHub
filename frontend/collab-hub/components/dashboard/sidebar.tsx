"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useInvitations } from "@/hooks/use-invitations"
import {
  Home,
  FolderOpen,
  CheckSquare,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  ChevronRight,
  Mail,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  projects: Array<{
    id: string
    name: string
    description: string
  }>
  onCreateProject: () => void
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ projects, onCreateProject, onNavigate, className }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { data: invitations = [] } = useInvitations()
  const pendingInvites = useMemo(
    () => invitations.filter((invitation) => invitation.status === "PENDING").length,
    [invitations],
  )
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true)

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "Invitations", href: "/dashboard/invitations", icon: Mail, badge: pendingInvites },
    { name: "Team", href: "/dashboard/team", icon: Users },
  ]

  return (
    <div className={cn("flex h-full min-h-0 w-64 flex-col bg-sidebar border-r border-sidebar-border", className)}>
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-sidebar-foreground">CollabHub</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                  onClick={() => onNavigate?.()}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                  {item.badge ? (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  ) : null}
                </Button>
              </Link>
            )
          })}
        </div>

        <Separator className="my-4 bg-sidebar-border" />

        {/* Projects Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
              className="p-0 h-auto text-sidebar-foreground hover:bg-transparent"
            >
              {isProjectsExpanded ? (
                <ChevronDown className="h-4 w-4 mr-1" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm font-medium">Projects</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {projects.length}
              </Badge>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateProject}
              className="h-6 w-6 p-0 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {isProjectsExpanded && (
            <div className="space-y-1 ml-2">
              {projects.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1">No projects yet</p>
              ) : (
                projects.map((project) => {
                  const isActive =
                    pathname === `/dashboard/projects/${project.id}` ||
                    pathname.startsWith(`/dashboard/projects/${project.id}/`)
                  return (
                    <div key={project.id} className="space-y-1">
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-start text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-auto py-2",
                            isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                          )}
                          onClick={() => onNavigate?.()}
                        >
                          <FolderOpen className="mr-2 h-3 w-3" />
                          <span className="whitespace-normal break-words text-left">{project.name}</span>
                        </Button>
                      </Link>
                      {isActive && (
                        <div className="ml-4 space-y-1">
                          <Link href={`/dashboard/projects/${project.id}/members`}>
                            <Button
                              variant={pathname === `/dashboard/projects/${project.id}/members` ? "secondary" : "ghost"}
                              size="sm"
                              className={cn(
                                "w-full justify-start text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-auto py-2",
                                pathname === `/dashboard/projects/${project.id}/members` &&
                                  "bg-sidebar-accent text-sidebar-accent-foreground",
                              )}
                              onClick={() => onNavigate?.()}
                            >
                              <Users className="mr-2 h-3 w-3" />
                              <span className="whitespace-normal break-words text-left">Members</span>
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center space-x-2 px-2">
          <div className="w-6 h-6 bg-sidebar-primary rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-sidebar-primary-foreground">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground break-words">{user?.email}</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => onNavigate?.()}
          >
            <Settings className="h-3 w-3 mr-1" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout()
              onNavigate?.()
            }}
            className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-3 w-3 mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
