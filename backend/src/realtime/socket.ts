import http from 'http';
import { Server, Socket } from 'socket.io';
import prisma from '../config/prisma';
import logger from '../utils/logger';
import { verifyAccessToken } from '../utils/jwt';

type AuthenticatedSocket = Socket & {
  data: {
    userId?: string;
    userName?: string;
  };
};

const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');

const getAllowedOrigins = () => {
  return (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);
};

let io: Server | null = null;

export const initSocket = (server: http.Server) => {
  if (io) return io;

  const allowedOrigins = getAllowedOrigins();
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = normalizeOrigin(origin);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    },
    path: process.env.SOCKET_IO_PATH || '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token || socket.handshake.query?.token;
      const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
      if (!token) {
        return next(new Error('Unauthorized: missing token'));
      }

      const payload = verifyAccessToken(String(token));
      const userId = payload.sub as string | undefined;
      if (!userId) {
        return next(new Error('Unauthorized: invalid token'));
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      socket.data.userId = userId;
      socket.data.userName = user?.name || user?.email || 'User';
      return next();
    } catch (error) {
      return next(new Error('Unauthorized: invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_channel', async ({ channelId }: { channelId: string }) => {
      if (!channelId || !socket.data.userId) return;

      let isMember = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId, userId: socket.data.userId } },
      });

      if (!isMember) {
        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (channel?.projectId) {
          const projectRole = await prisma.userProject.findFirst({
            where: { userId: socket.data.userId, projectId: channel.projectId, role: { in: ['OWNER', 'MANAGER'] } },
          });
          if (projectRole) {
            isMember = await prisma.channelMember.upsert({
              where: { channelId_userId: { channelId, userId: socket.data.userId } },
              update: { role: 'ADMIN' },
              create: { channelId, userId: socket.data.userId, role: 'ADMIN' },
            });
          }
        }
      }

      if (!isMember) return;
      socket.join(channelId);
    });

    socket.on('leave_channel', ({ channelId }: { channelId: string }) => {
      if (!channelId) return;
      socket.leave(channelId);
    });

    socket.on('typing_start', async ({ channelId }: { channelId: string }) => {
      if (!channelId || !socket.data.userId) return;
      const isMember = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId, userId: socket.data.userId } },
      });
      if (!isMember) return;
      socket.to(channelId).emit('typing_start', {
        channelId,
        userId: socket.data.userId,
        userName: socket.data.userName,
      });
    });

    socket.on('typing_stop', async ({ channelId }: { channelId: string }) => {
      if (!channelId || !socket.data.userId) return;
      const isMember = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId, userId: socket.data.userId } },
      });
      if (!isMember) return;
      socket.to(channelId).emit('typing_stop', {
        channelId,
        userId: socket.data.userId,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = () => io;

export const emitToChannel = (channelId: string, event: string, payload: unknown) => {
  if (!io) {
    logger.warn('Socket.io not initialized. Skipping emit.');
    return;
  }
  io.to(channelId).emit(event, payload);
};
