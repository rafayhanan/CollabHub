export type {
  Channel,
  ChannelMember,
  Invitation,
  Message,
  Notification,
  Project,
  ProjectMember,
  Task,
  TaskAssignment,
  User,
} from "./types"

export * from "./services/auth"
export * from "./services/projects"
export * from "./services/tasks"
export * from "./services/chat"
export * from "./services/invitations"
export * from "./services/notifications"
export * from "./error"

import * as invitationService from "./services/invitations"
import * as projectService from "./services/projects"

export const invitationApi = {
  sendInvitation: invitationService.sendInvitation,
  getUserInvitations: invitationService.getUserInvitations,
  acceptInvitation: invitationService.acceptInvitation,
  declineInvitation: invitationService.declineInvitation,
}

export const projectApi = {
  getProjects: projectService.getProjects,
  getProject: projectService.getProject,
  createProject: projectService.createProject,
  updateProject: projectService.updateProject,
  deleteProject: projectService.deleteProject,
  removeMember: projectService.removeMember,
}
