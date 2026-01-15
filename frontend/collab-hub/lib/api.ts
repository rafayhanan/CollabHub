import { authenticatedFetch } from "./auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  members?: ProjectMember[]
  tasks?: Task[]
}

export interface ProjectMember {
  userId: string
  projectId: string
  role: "OWNER" | "MEMBER"
  joinedAt: string
  user: {
    id: string
    email: string
    name?: string
    avatarUrl?: string
  }
}

export interface Task {
  id: string
  title: string
  description: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  dueDate?: string
  projectId: string
  assignments: TaskAssignment[]
  createdAt: string
  updatedAt: string
}

export interface TaskAssignment {
  user: {
    id: string
    name?: string
    email: string
  }
  note?: string
}

export interface Channel {
  id: string
  name: string
  type: "PROJECT_GENERAL" | "TASK_SPECIFIC" | "PRIVATE_DM" | "ANNOUNCEMENTS"
  description?: string
  projectId?: string
  taskId?: string
  members: ChannelMember[]
  createdAt: string
  updatedAt: string
}

export interface ChannelMember {
  userId: string
  role: "ADMIN" | "MEMBER"
  joinedAt: string
  user: {
    id: string
    name?: string
    email: string
    avatarUrl?: string
  }
}

export interface Message {
  id: string
  content: string
  channelId: string
  authorId: string
  author: {
    id: string
    name?: string
    email: string
    avatarUrl?: string
  }
  channel?: {
    id: string
    name: string
    type: Channel["type"]
  }
  createdAt: string
  updatedAt: string
}

// Project API calls
export const getProjects = async (): Promise<Project[]> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects`)
  if (!response.ok) {
    throw new Error("Failed to fetch projects")
  }
  return response.json()
}

const getProject = async (projectId: string): Promise<Project> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`)
  if (!response.ok) {
    throw new Error("Failed to fetch project")
  }
  return response.json()
}

export const createProject = async (name: string, description: string): Promise<Project> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    body: JSON.stringify({ name, description }),
  })
  if (!response.ok) {
    throw new Error("Failed to create project")
  }
  return response.json()
}

export const updateProject = async (id: string, name: string, description: string): Promise<Project> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, description }),
  })
  if (!response.ok) {
    throw new Error("Failed to update project")
  }
  return response.json()
}

export const deleteProject = async (id: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to delete project")
  }
}

const removeMember = async (projectId: string, userId: string) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to remove member")
  }
  return response.json()
}

// Task API calls
export const getProjectTasks = async (projectId: string): Promise<Task[]> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/tasks`)
  if (!response.ok) {
    throw new Error("Failed to fetch tasks")
  }
  return response.json()
}

export const getUserTasks = async (): Promise<Task[]> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/users/me/tasks`)
  if (!response.ok) {
    throw new Error("Failed to fetch user tasks")
  }
  return response.json()
}

export const createTask = async (
  projectId: string,
  title: string,
  description: string,
  dueDate?: string,
): Promise<Task> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ title, description, dueDate }),
  })
  if (!response.ok) {
    throw new Error("Failed to create task")
  }
  return response.json()
}

export const updateTask = async (
  taskId: string,
  updates: Partial<Pick<Task, "title" | "description" | "status" | "dueDate">>,
): Promise<Task> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    throw new Error("Failed to update task")
  }
  return response.json()
}

export const deleteTask = async (taskId: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to delete task")
  }
}

export const assignTask = async (taskId: string, userId: string, note?: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}/assignments`, {
    method: "POST",
    body: JSON.stringify({ userId, note }),
  })
  if (!response.ok) {
    throw new Error("Failed to assign task")
  }
}

export const unassignTask = async (taskId: string, userId: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}/assignments/${userId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to unassign task")
  }
}

// Channel API calls
export const getProjectChannels = async (projectId: string): Promise<Channel[]> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/channels/project/${projectId}`)
  if (!response.ok) {
    throw new Error("Failed to fetch project channels")
  }
  return response.json()
}

export const createChannel = async (
  name: string,
  type: Channel["type"],
  description?: string,
  projectId?: string,
  taskId?: string,
): Promise<Channel> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/channels`, {
    method: "POST",
    body: JSON.stringify({ name, type, description, projectId, taskId }),
  })
  if (!response.ok) {
    throw new Error("Failed to create channel")
  }
  return response.json()
}

export const addChannelMember = async (channelId: string, userId: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/channels/${channelId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  })
  if (!response.ok) {
    throw new Error("Failed to add channel member")
  }
}

// Message API calls
export const getChannelMessages = async (channelId: string, limit = 50, offset = 0): Promise<Message[]> => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/channels/${channelId}/messages?limit=${limit}&offset=${offset}`,
  )
  if (!response.ok) {
    throw new Error("Failed to fetch messages")
  }
  return response.json()
}

export const sendMessage = async (channelId: string, content: string): Promise<Message> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })
  if (!response.ok) {
    throw new Error("Failed to send message")
  }
  return response.json()
}

export const editMessage = async (messageId: string, content: string): Promise<Message> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/messages/${messageId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  })
  if (!response.ok) {
    throw new Error("Failed to edit message")
  }
  return response.json()
}

export const deleteMessage = async (messageId: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/messages/${messageId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to delete message")
  }
}

// Invitation API functions
const sendInvitation = async (projectId: string, email: string) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email }),
  })
  if (!response.ok) {
    throw new Error("Failed to send invitation")
  }
  return response.json()
}

const getUserInvitations = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/users/me/invitations`)
  if (!response.ok) {
    throw new Error("Failed to fetch invitations")
  }
  return response.json()
}

const acceptInvitation = async (invitationId: string) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/invitations/${invitationId}/accept`)
  if (!response.ok) {
    throw new Error("Failed to accept invitation")
  }
  return response.json()
}

const declineInvitation = async (invitationId: string) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/invitations/${invitationId}/decline`)
  if (!response.ok) {
    throw new Error("Failed to decline invitation")
  }
  return response.json()
}

export const invitationApi = {
  sendInvitation,
  getUserInvitations,
  acceptInvitation,
  declineInvitation,
}

export const projectApi = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  removeMember,
}
