import { apiClient } from "../http-client"
import type { Project } from "../types"

export const getProjects = async (): Promise<Project[]> => {
  const response = await apiClient.get<Project[]>("/projects")
  return response.data
}

export const getProject = async (projectId: string): Promise<Project> => {
  const response = await apiClient.get<Project>(`/projects/${projectId}`)
  return response.data
}

export const createProject = async (name: string, description: string): Promise<Project> => {
  const response = await apiClient.post<Project>("/projects", { name, description })
  return response.data
}

export const updateProject = async (id: string, name: string, description: string): Promise<Project> => {
  const response = await apiClient.put<Project>(`/projects/${id}`, { name, description })
  return response.data
}

export const deleteProject = async (id: string): Promise<void> => {
  await apiClient.delete(`/projects/${id}`)
}

export const removeMember = async (projectId: string, userId: string) => {
  const response = await apiClient.delete(`/projects/${projectId}/members/${userId}`)
  return response.data
}

export const updateMemberRole = async (projectId: string, userId: string, role: "MANAGER" | "MEMBER") => {
  const response = await apiClient.put(`/projects/${projectId}/members/${userId}/role`, { role })
  return response.data
}