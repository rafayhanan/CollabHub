import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../utils/types';
import { addChannelMembers, getProjectManagerIds } from '../services/channel.service';
import { emitToChannel } from '../realtime/socket';

// Channel role constants
const CHANNEL_ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

/**
 * Create a new channel
 */
export const createChannel = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, description, projectId, taskId, memberIds = [] } = req.body;
    const userId = (req.user as { sub: string }).sub;

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

      if (!['OWNER', 'MANAGER'].includes(userProject.role)) {
        return res.status(403).json({ error: 'Only project owners or managers can create channels' });
      }
    }

    // Verify task belongs to project if both are specified
    if (taskId && projectId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          projectId,
        },
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found in this project' });
      }
    }

    // Validate member IDs are part of the project (if provided)
    if (projectId && memberIds.length > 0) {
      const memberRecords = await prisma.userProject.findMany({
        where: {
          projectId,
          userId: { in: memberIds },
        },
        select: { userId: true },
      });
      if (memberRecords.length !== memberIds.length) {
        return res.status(400).json({ error: 'One or more selected users are not members of this project' });
      }
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        type: type as any,
        description,
        projectId,
        taskId,
      },
    });

    const managerIds = projectId ? await getProjectManagerIds(projectId) : [userId];
    await addChannelMembers({
      channelId: channel.id,
      adminUserIds: managerIds,
      memberUserIds: memberIds,
    });

    const channelWithMembers = await prisma.channel.findUnique({
      where: { id: channel.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(201).json(channelWithMembers);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get channels for a project
 */
export const getProjectChannels = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req.user as { sub: string }).sub;

    // Verify user has access to the project
    const userProject = await prisma.userProject.findFirst({
      where: {
        userId,
        projectId,
      },
    });

    if (!userProject) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const channels = await prisma.channel.findMany({
      where: {
        projectId,
        ...(userProject.role === 'OWNER' || userProject.role === 'MANAGER'
          ? {}
          : {
              members: {
                some: {
                  userId,
                },
              },
            }),
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(channels);
  } catch (error) {
    console.error('Error fetching project channels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get channel details
 */
export const getChannel = async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    const userId = (req.user as { sub: string }).sub;

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found or access denied' });
    }

    const isMember = channel.members.some((member: any) => member.userId === userId);
    if (!isMember && channel.projectId) {
      const projectRole = await prisma.userProject.findFirst({
        where: { userId, projectId: channel.projectId, role: { in: ['OWNER', 'MANAGER'] } },
      });
      if (!projectRole) {
        return res.status(404).json({ error: 'Channel not found or access denied' });
      }
    } else if (!isMember) {
      return res.status(404).json({ error: 'Channel not found or access denied' });
    }

    res.json(channel);
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add member to channel
 */
export const addChannelMember = async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    const { userId: targetUserId, role = CHANNEL_ROLES.MEMBER } = req.body;
    const currentUserId = (req.user as { sub: string }).sub;

    // First verify the channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { project: true },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Check if current user is admin of the channel
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

    // Verify target user has access to the project (if it's a project channel)
    if (channel.projectId) {
      const targetUserProject = await prisma.userProject.findFirst({
        where: {
          userId: targetUserId,
          projectId: channel.projectId,
        },
      });

      if (!targetUserProject) {
        return res.status(403).json({ error: 'User is not a member of this project' });
      }
    }

    // Add the member (upsert to handle duplicate additions)
    const channelMember = await prisma.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId,
          userId: targetUserId,
        },
      },
      update: {
        role: role as string,
      },
      create: {
        channelId,
        userId: targetUserId,
        role: role as string,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(channelMember);
  } catch (error) {
    console.error('Error adding channel member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Send a message to a channel
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;
    const userId = (req.user as { sub: string }).sub;

    // First verify the channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify user is a member of the channel or a project manager
    let channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId,
      },
    });

    if (!channelMember && channel.projectId) {
      const projectRole = await prisma.userProject.findFirst({
        where: { userId, projectId: channel.projectId, role: { in: ['OWNER', 'MANAGER'] } },
      });

      if (projectRole) {
        channelMember = await prisma.channelMember.upsert({
          where: {
            channelId_userId: {
              channelId,
              userId,
            },
          },
          update: { role: CHANNEL_ROLES.ADMIN },
          create: { channelId, userId, role: CHANNEL_ROLES.ADMIN },
        });
      }
    }

    if (!channelMember) {
      return res.status(403).json({ error: 'You are not a member of this channel' });
    }

    if (channel.type === 'ANNOUNCEMENTS' && channelMember.role !== CHANNEL_ROLES.ADMIN) {
      return res.status(403).json({ error: 'Only owners and managers can post in announcements' });
    }

    const message = await prisma.message.create({
      data: {
        content,
        channelId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    emitToChannel(channelId, 'message_created', { channelId, message });
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get messages from a channel
 */
export const getChannelMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    const userId = (req.user as { sub: string }).sub;

    // Verify user is a member of the channel or a project manager
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId,
      },
    });

    if (!channelMember && channel.projectId) {
      const projectRole = await prisma.userProject.findFirst({
        where: { userId, projectId: channel.projectId, role: { in: ['OWNER', 'MANAGER'] } },
      });
      if (!projectRole) {
        return res.status(403).json({ error: 'You are not a member of this channel' });
      }
    } else if (!channelMember) {
      return res.status(403).json({ error: 'You are not a member of this channel' });
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Oldest first for proper pagination
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json(messages); // No need to reverse since we want oldest first
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a message
 */
export const updateMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = (req.user as { sub: string }).sub;

    // Find the message and verify ownership
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        authorId: userId,
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or access denied' });
    }

    const updatedMessage = await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    emitToChannel(updatedMessage.channelId, 'message_updated', { channelId: updatedMessage.channelId, message: updatedMessage });
    res.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = (req.user as { sub: string }).sub;

    // Find the message and verify ownership or admin rights
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
      },
      include: {
        channel: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the author or a channel admin
    const isAuthor = message.authorId === userId;
    const isChannelAdmin = message.channel.members.some(
      (member: any) => member.userId === userId && member.role === CHANNEL_ROLES.ADMIN
    );

    if (!isAuthor && !isChannelAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.message.delete({
      where: {
        id: messageId,
      },
    });

    emitToChannel(message.channelId, 'message_deleted', { channelId: message.channelId, messageId });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
