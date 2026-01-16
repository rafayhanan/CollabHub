import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../utils/types';
import logger from '../utils/logger';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const userId = (req.user as { sub: string }).sub;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notifications);
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  const userId = (req.user as { sub: string }).sub;
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  const userId = (req.user as { sub: string }).sub;

  try {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
