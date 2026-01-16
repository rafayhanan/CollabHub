import { apiClient } from "../http-client"
import type { Task } from "../types"

export const getProjectTasks = async (projectId: string): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`)
  return response.data
}

export const getUserTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>("/users/me/tasks")
  return response.data
}

export const createTask = async (
  projectId: string,
  title: string,
  description: string,
  dueDate?: string,
): Promise<Task> => {
  const response = await apiClient.post<Task>(`/projects/${projectId}/tasks`, {
    title,
    description,
    dueDate,
  })
  return response.data
}

export const updateTask = async (
  taskId: string,
  updates: Partial<Pick<Task, "title" | "description" | "status" | "dueDate">>,
): Promise<Task> => {
  const response = await apiClient.put<Task>(`/tasks/${taskId}`, updates)
  return response.data
}

export const deleteTask = async (taskId: string): Promise<void> => {
  await apiClient.delete(`/tasks/${taskId}`)
}

export const assignTask = async (taskId: string, userId: string, note?: string): Promise<void> => {
  await apiClient.post(`/tasks/${taskId}/assignments`, { userId, note })
}

export const unassignTask = async (taskId: string, userId: string): Promise<void> => {
  await apiClient.delete(`/tasks/${taskId}/assignments/${userId}`)
}
