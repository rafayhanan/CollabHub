"use client"

import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, Settings, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { NotificationBell } from "@/components/notifications/notification-bell"

interface DashboardHeaderProps {
  onCreateProject: () => void
  mobileSidebar?: ReactNode
}

export function DashboardHeader({ onCreateProject, mobileSidebar }: DashboardHeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Search */}
        <div className="flex items-center space-x-2 flex-1">
          {mobileSidebar ? <div className="md:hidden">{mobileSidebar}</div> : null}
          <div className="relative hidden md:block md:flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects, tasks, or messages..." className="pl-10 bg-muted/50" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Button onClick={onCreateProject} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Project</span>
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:inline">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
