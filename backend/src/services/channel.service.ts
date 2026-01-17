import prisma from '../config/prisma';

export const getProjectManagerIds = async (projectId: string) => {
  const managers = await prisma.userProject.findMany({
    where: {
      projectId,
      role: { in: ['OWNER', 'MANAGER'] },
    },
    select: { userId: true },
  });

  return managers.map((manager) => manager.userId);
};

export const addChannelMembers = async (params: {
  channelId: string;
  adminUserIds?: string[];
  memberUserIds?: string[];
}) => {
  const adminUserIds = Array.from(new Set(params.adminUserIds || []));
  const memberUserIds = Array.from(new Set(params.memberUserIds || []));

  const members = [
    ...adminUserIds.map((userId) => ({
      channelId: params.channelId,
      userId,
      role: 'ADMIN',
    })),
    ...memberUserIds
      .filter((userId) => !adminUserIds.includes(userId))
      .map((userId) => ({
        channelId: params.channelId,
        userId,
        role: 'MEMBER',
      })),
  ];

  if (!members.length) return;

  await prisma.channelMember.createMany({
    data: members,
    skipDuplicates: true,
  });
};

export const createDefaultChannels = async (params: { projectId: string; ownerId: string }) => {
  const { projectId, ownerId } = params;

  const generalChannel = await prisma.channel.create({
    data: {
      name: 'General',
      description: 'General project discussion',
      type: 'PROJECT_GENERAL',
      projectId,
    },
  });

  const announcementsChannel = await prisma.channel.create({
    data: {
      name: 'Announcements',
      description: 'Important updates and announcements',
      type: 'ANNOUNCEMENTS',
      projectId,
    },
  });

  await addChannelMembers({
    channelId: generalChannel.id,
    adminUserIds: [ownerId],
  });

  await addChannelMembers({
    channelId: announcementsChannel.id,
    adminUserIds: [ownerId],
  });
};

export const addUserToDefaultChannels = async (params: { projectId: string; userId: string }) => {
  const { projectId, userId } = params;

  const defaultChannels = await prisma.channel.findMany({
    where: {
      projectId,
      type: { in: ['PROJECT_GENERAL', 'ANNOUNCEMENTS'] },
    },
    select: { id: true },
  });

  if (!defaultChannels.length) return;

  await prisma.channelMember.createMany({
    data: defaultChannels.map((channel) => ({
      channelId: channel.id,
      userId,
      role: 'MEMBER',
    })),
    skipDuplicates: true,
  });
};
