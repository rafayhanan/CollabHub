## CollabHub RBAC & Authorization Audit (Copy‑Friendly)

### [1] Detected Authorization Points

- backend/src/middleware/auth.middleware.ts: Global JWT auth guard applied on protected routes (verifies Bearer token, attaches req.user, rejects invalid/expired tokens)

```typescript
// backend/src/middleware/auth.middleware.ts
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Access token is required' });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
  }
};
```

- backend/src/controllers/project.controller.ts (createProject): Creator becomes OWNER (persists UserProject with role 'OWNER')

```typescript
// backend/src/controllers/project.controller.ts
const newProject = await prisma.$transaction(async (tx) => {
  const project = await tx.project.create({
    data: {
      name,
      description,
    },
  });

  await tx.userProject.create({
    data: {
      userId,
      projectId: project.id,
      role: 'OWNER',
    },
  });

  return project;
});
```

- backend/src/controllers/project.controller.ts (getProjectById): Member-only read (requires members.some.userId = req.user.sub)

```typescript
// backend/src/controllers/project.controller.ts
const project = await prisma.project.findFirst({
  where: {
    id,
    members: {
      some: {
        userId,
      },
    },
  },
});

if (!project) {
  return res.status(404).json({ message: 'Project not found or you do not have access' });
}
```

- backend/src/controllers/project.controller.ts (updateProject/deleteProject): Owner-only mutations (checks UserProject role 'OWNER')

```typescript
// backend/src/controllers/project.controller.ts
const userProject = await prisma.userProject.findFirst({
  where: {
    userId,
    projectId: id,
    role: 'OWNER',
  },
});

if (!userProject) {
  return res.status(403).json({ message: 'Forbidden: You are not the owner of this project' });
}
```

```typescript
// backend/src/controllers/project.controller.ts
const userProject = await prisma.userProject.findFirst({
  where: {
    projectId: id,
    userId,
    role: 'OWNER',
  },
});

if (!userProject) {
  return res.status(403).json({ message: 'Forbidden: You are not the owner of this project' });
}
```

- backend/src/controllers/task.controller.ts (createTask): Member-only create (requires UserProject membership)

```typescript
// backend/src/controllers/task.controller.ts
const member = await tx.userProject.findUnique({
  where: {
    userId_projectId: { userId, projectId },
  },
});

if (!member) {
  // This will cause the transaction to roll back
  throw new Error('Forbidden: You are not a member of this project.');
}
```

- backend/src/controllers/task.controller.ts (createTask with assignments): Owner-only; assignees must be project members

```typescript
// backend/src/controllers/task.controller.ts
const ownerRecord = await tx.userProject.findFirst({
  where: { userId, projectId, role: 'OWNER' },
});
if (!ownerRecord) {
  throw new Error('Forbidden: Only the project owner can assign users at creation.');
}

const assigneeMembers = await tx.userProject.findMany({
  where: { projectId, userId: { in: assigneeIds } },
});
if (assigneeMembers.length !== assigneeIds.length) {
  throw new Error('Bad Request: One or more assigned users are not members of this project.');
}
```

- backend/src/controllers/task.controller.ts (getTasks): Member-only list

```typescript
// backend/src/controllers/task.controller.ts
const member = await prisma.userProject.findUnique({
  where: {
    userId_projectId: { userId, projectId },
  },
});

if (!member) {
  return res.status(403).json({ message: 'Forbidden: You are not a member of this project.' });
}
```

- backend/src/controllers/task.controller.ts (getTaskById): Member-only read

```typescript
// backend/src/controllers/task.controller.ts
const member = await prisma.userProject.findUnique({
  where: {
    userId_projectId: { userId, projectId: task.projectId },
  },
});

if (!member) {
  return res.status(403).json({ message: 'Forbidden: You are not a member of this project.' });
}
```

- backend/src/controllers/task.controller.ts (updateTask): Member-only update

```typescript
// backend/src/controllers/task.controller.ts
const member = await prisma.userProject.findUnique({
  where: {
    userId_projectId: { userId, projectId: task.projectId },
  },
});

if (!member) {
  return res.status(403).json({ message: 'Forbidden: You are not a member of this project.' });
}
```

- backend/src/controllers/task.controller.ts (deleteTask): Owner-only delete

```typescript
// backend/src/controllers/task.controller.ts
const ownerRecord = await prisma.userProject.findFirst({
  where: {
    userId,
    projectId: task.projectId,
    role: 'OWNER',
  },
});

if (!ownerRecord) {
  return res.status(403).json({ message: 'Forbidden: Only the project owner can delete tasks.' });
}
```

- backend/src/controllers/task.controller.ts (assignTask): Owner-only; assignees must be members

```typescript
// backend/src/controllers/task.controller.ts
const ownerRecord = await prisma.userProject.findFirst({ where: { userId, projectId, role: 'OWNER' } });
if (!ownerRecord) {
  return res.status(403).json({ message: 'Forbidden: Only the project owner can assign users to tasks.' });
}

const assigneeMembers = await prisma.userProject.findMany({ where: { projectId, userId: { in: assigneeIds } } });
if (assigneeMembers.length !== assigneeIds.length) {
  return res.status(400).json({ message: 'Bad Request: One or more assigned users are not members of this project.' });
}
```

- backend/src/controllers/task.controller.ts (unassignTask): Owner-only

```typescript
// backend/src/controllers/task.controller.ts
const ownerRecord = await prisma.userProject.findFirst({
  where: {
    userId,
    projectId: task.projectId,
    role: 'OWNER',
  },
});

if (!ownerRecord) {
  return res.status(403).json({ message: 'Forbidden: Only the project owner can unassign users from tasks.' });
}
```

- backend/src/controllers/invitation.controller.ts (sendInvitation): Owner-only invite

```typescript
// backend/src/controllers/invitation.controller.ts
const invitingUser = await prisma.userProject.findFirst({
  where: {
    userId: invitedById,
    projectId,
    role: 'OWNER',
  },
});

if (!invitingUser) {
  return res.status(403).json({ message: 'Forbidden: Only project owners can send invitations' });
}
```

- backend/src/controllers/invitation.controller.ts (acceptInvitation): Only intended recipient (by email)

```typescript
// backend/src/controllers/invitation.controller.ts
const invitation = await prisma.invitation.findFirst({ where: { id: invitationId, status: 'PENDING' } });

if (!invitation) {
  return res.status(404).json({ message: 'Invitation not found or not pending' });
}

const user = await prisma.user.findUnique({ where: { id: userId } });
if (!user || user.email !== invitation.invitedUserEmail) {
  return res.status(403).json({ message: 'Forbidden: This invitation is not for you' });
}
```

- backend/src/controllers/chat.controller.ts (createChannel): Project access required if projectId is provided

```typescript
// backend/src/controllers/chat.controller.ts
// Verify user has access to the project
if (projectId) {
  const userProject = await prisma.userProject.findFirst({
    where: {
      userId,
      projectId,
    },
  });

  if (!userProject) {
    return res.status(403).json({ error: 'Access denied to this project' });
  }
}
```

- backend/src/controllers/chat.controller.ts (getProjectChannels): Member-only list

```typescript
// backend/src/controllers/chat.controller.ts
const userProject = await prisma.userProject.findFirst({
  where: {
    userId,
    projectId,
  },
});

if (!userProject) {
  return res.status(403).json({ error: 'Access denied to this project' });
}
```

- backend/src/controllers/chat.controller.ts (getChannel): Member-only channel read

```typescript
// backend/src/controllers/chat.controller.ts
const channel = await prisma.channel.findFirst({
  where: {
    id: channelId,
    members: {
      some: {
        userId,
      },
    },
  },
  include: { /* ... */ },
});

if (!channel) {
  return res.status(404).json({ error: 'Channel not found or access denied' });
}
```

- backend/src/controllers/chat.controller.ts (addChannelMember): Channel ADMIN-only

```typescript
// backend/src/controllers/chat.controller.ts
const currentMember = await prisma.channelMember.findFirst({
  where: {
    channelId,
    userId: currentUserId,
    role: CHANNEL_ROLES.ADMIN,
  },
});

if (!currentMember) {
  return res.status(403).json({ error: 'Only channel admins can add members' });
}
```

- backend/src/controllers/chat.controller.ts (sendMessage): Channel membership required

```typescript
// backend/src/controllers/chat.controller.ts
const channelMember = await prisma.channelMember.findFirst({
  where: {
    channelId,
    userId,
  },
});

if (!channelMember) {
  return res.status(403).json({ error: 'You are not a member of this channel' });
}
```

- backend/src/controllers/chat.controller.ts (getChannelMessages): Channel membership required

```typescript
// backend/src/controllers/chat.controller.ts
const channelMember = await prisma.channelMember.findFirst({
  where: {
    channelId,
    userId,
  },
});

if (!channelMember) {
  return res.status(403).json({ error: 'You are not a member of this channel' });
}
```

- backend/src/controllers/chat.controller.ts (updateMessage): Only author can update

```typescript
// backend/src/controllers/chat.controller.ts
const message = await prisma.message.findFirst({
  where: {
    id: messageId,
    authorId: userId,
  },
});

if (!message) {
  return res.status(404).json({ error: 'Message not found or access denied' });
}
```

- backend/src/controllers/chat.controller.ts (deleteMessage): Author or Channel ADMIN can delete

```typescript
// backend/src/controllers/chat.controller.ts
const isAuthor = message.authorId === userId;
const isChannelAdmin = message.channel.members.some(
  (member: any) => member.userId === userId && member.role === CHANNEL_ROLES.ADMIN
);

if (!isAuthor && !isChannelAdmin) {
  return res.status(403).json({ error: 'Access denied' });
}
```

### [2] Role Model Presence
- Project roles: OWNER and MEMBER are enforced; ADMIN exists in schema but is unused in controllers.
- Channel roles: ChannelMember has ADMIN and MEMBER. Admins can add members; authorship governs message updates; deletes allowed by author or channel admin.
- Most other permissions are membership checks (exists in UserProject) plus resource ownership where relevant.

### [3] Current Capability Matrix (in words)
Project owner can:
- Update/delete own project
- Send invitations
- Assign/unassign users to tasks
- Delete tasks
- Do everything regular members can do

Member can:
- View projects they belong to
- Create tasks; read tasks; update task fields
- Create channels (creator becomes channel ADMIN)
- Read/send messages in channels they belong to; edit own messages; delete own messages

Unauthenticated user can:
- Register, log in, refresh token, log out only

### [4] Conclusion
partial — Project-level RBAC distinguishes OWNER vs MEMBER; channel-level RBAC distinguishes ADMIN vs MEMBER with author checks. However, project-level ADMIN is unused, policies are controller-scattered (no centralized policy layer), and several permissions default to simple membership checks rather than a comprehensive role matrix.



