import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { acceptInvitation, declineInvitation, getUserInvitations, sendInvitation, getProjectInvitations, resendInvitation } from "@/lib/api/services/invitations"
import { projectKeys } from "@/hooks/use-projects"

export const invitationKeys = {
  all: ["invitations"] as const,
}

export const useInvitations = () => {
  return useQuery({
    queryKey: invitationKeys.all,
    queryFn: getUserInvitations,
  })
}

export const useSendInvitation = () => {
  return useMutation({
    mutationFn: ({ projectId, email }: { projectId: string; email: string }) => sendInvitation(projectId, email),
  })
}

export const useProjectInvitations = (projectId: string | null, enabled = true) => {
  return useQuery({
    queryKey: projectId ? ["invitations", "project", projectId] : ["invitations", "project", "none"],
    queryFn: () => getProjectInvitations(projectId as string),
    enabled: enabled && !!projectId,
  })
}

export const useResendInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, invitationId }: { projectId: string; invitationId: string }) =>
      resendInvitation(projectId, invitationId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["invitations", "project", projectId] })
    },
  })
}

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all })
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

export const useDeclineInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => declineInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all })
    },
  })
}
