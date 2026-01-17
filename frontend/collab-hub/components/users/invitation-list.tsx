"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Mail, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAcceptInvitation, useDeclineInvitation, useInvitations } from "@/hooks/use-invitations"
import { getApiErrorMessage } from "@/lib/api/error"

export function InvitationList() {
  const { toast } = useToast()
  const { data: invitations = [], isLoading, error } = useInvitations()
  const { mutateAsync: acceptInvitation } = useAcceptInvitation()
  const { mutateAsync: declineInvitation } = useDeclineInvitation()
  const [actionState, setActionState] = useState<{ id: string; type: "accept" | "decline" } | null>(null)

  const handleAccept = async (invitationId: string) => {
    setActionState({ id: invitationId, type: "accept" })
    try {
      await acceptInvitation(invitationId)
      toast({
        title: "Invitation accepted",
        description: "You have joined the project",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: getApiErrorMessage(err, "Failed to accept invitation"),
        variant: "destructive",
      })
    } finally {
      setActionState(null)
    }
  }

  const handleDecline = async (invitationId: string) => {
    setActionState({ id: invitationId, type: "decline" })
    try {
      await declineInvitation(invitationId)
      toast({
        title: "Invitation declined",
        description: "You have declined the invitation",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: getApiErrorMessage(err, "Failed to decline invitation"),
        variant: "destructive",
      })
    } finally {
      setActionState(null)
    }
  }

  const pendingInvitations = useMemo(
    () => invitations.filter((inv) => inv.status === "PENDING"),
    [invitations],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error) {
    const errorMessage = getApiErrorMessage(error, "Failed to load invitations")
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{errorMessage}</p>
        </CardContent>
      </Card>
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">{invitation.project.name}</CardTitle>
                <CardDescription>
                  Invited by {invitation.invitedBy.name || invitation.invitedBy.email} ({invitation.invitedBy.email})
                </CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1 w-fit">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="sm"
                onClick={() => handleAccept(invitation.id)}
                className="gap-2 w-full sm:w-auto"
                disabled={actionState?.id === invitation.id}
              >
                {actionState?.id === invitation.id && actionState.type === "accept" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {actionState?.id === invitation.id && actionState.type === "accept" ? "Accepting..." : "Accept"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecline(invitation.id)}
                className="gap-2 w-full sm:w-auto"
                disabled={actionState?.id === invitation.id}
              >
                {actionState?.id === invitation.id && actionState.type === "decline" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {actionState?.id === invitation.id && actionState.type === "decline" ? "Declining..." : "Decline"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
