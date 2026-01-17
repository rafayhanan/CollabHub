import { apiClient } from "../http-client"
import type { Invitation } from "../types"

export const sendInvitation = async (projectId: string, email: string): Promise<Invitation> => {
  const response = await apiClient.post<Invitation>(`/projects/${projectId}/invitations`, { email })
  return response.data
}

export const getProjectInvitations = async (projectId: string): Promise<Invitation[]> => {
  const response = await apiClient.get<Invitation[]>(`/projects/${projectId}/invitations`)
  return response.data
}

export const resendInvitation = async (projectId: string, invitationId: string): Promise<Invitation> => {
  const response = await apiClient.post<Invitation>(`/projects/${projectId}/invitations/${invitationId}/resend`)
  return response.data
}

export const getUserInvitations = async (): Promise<Invitation[]> => {
  const response = await apiClient.get<Invitation[]>("/invitations")
  return response.data
}

export const acceptInvitation = async (invitationId: string): Promise<void> => {
  await apiClient.post(`/invitations/${invitationId}/accept`)
}

export const declineInvitation = async (invitationId: string): Promise<void> => {
  await apiClient.post(`/invitations/${invitationId}/decline`)
}
