export interface User {
    id: string
    email: string
    name?: string
    avatarUrl?: string
}

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
    id?: string
    userId: string
    projectId: string
    role: "OWNER" | "ADMIN" | "MEMBER"
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
    project?: {
        id: string
        name: string
    }
    createdAt: string
    updatedAt: string
}

export interface TaskAssignment {
    user?: {
        id: string
        name?: string
        email: string
    }
    note?: string
    assignedAt?: string
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

export interface Invitation {
    id: string
    projectId: string
    invitedById: string
    invitedUserEmail: string
    status: "PENDING" | "ACCEPTED" | "DECLINED"
    createdAt: string
    updatedAt: string
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
