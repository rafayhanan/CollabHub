"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Mail, Clock } from "lucide-react"
import { invitationApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Invitation {
  id: string
  projectId: string
  invitedById: string
  invitedUserEmail: string
  status: "PENDING" | "ACCEPTED" | "DECLINED"
  createdAt: string
  project: {
    id: string
    name: string
  }
  invitedBy: {
    id: string
    name: string
    email: string
  }
}

export function InvitationList() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchInvitations = useCallback(async () => {
    try {
      const data = await invitationApi.getUserInvitations()
      setInvitations(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch invitations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  const handleAccept = async (invitationId: string) => {
    try {
      await invitationApi.acceptInvitation(invitationId)
      toast({
        title: "Invitation accepted",
        description: "You have joined the project",
      })
      fetchInvitations()
    } catch {
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      })
    }
  }

  const handleDecline = async (invitationId: string) => {
    try {
      await invitationApi.declineInvitation(invitationId)
      toast({
        title: "Invitation declined",
        description: "You have declined the invitation",
      })
      fetchInvitations()
    } catch {
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive",
      })
    }
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === "PENDING")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (pendingInvitations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No pending invitations</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {pendingInvitations.map((invitation) => (
        <Card key={invitation.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{invitation.project.name}</CardTitle>
                <CardDescription>
                  Invited by {invitation.invitedBy.name} ({invitation.invitedBy.email})
                </CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleAccept(invitation.id)} className="gap-2">
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDecline(invitation.id)} className="gap-2">
                <X className="h-4 w-4" />
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
