import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { acceptInvitation, declineInvitation, getUserInvitations, sendInvitation } from "@/lib/api/services/invitations"
import type { Invitation } from "@/lib/api/types"

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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, email }: { projectId: string; email: string }) => sendInvitation(projectId, email),
    onSuccess: (invitation) => {
      queryClient.setQueryData<Invitation[]>(invitationKeys.all, (old) =>
        old ? [invitation, ...old] : [invitation],
      )
    },
  })
}

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all })
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
