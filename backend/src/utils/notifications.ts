import prisma from '../config/prisma';
import logger from './logger';
import { notificationQueue } from '../queues/notification.queue';

export type NotificationType = 'INVITATION_SENT' | 'INVITATION_ACCEPTED' | 'TASK_ASSIGNED';

export const createNotification = async (params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  sendEmail?: boolean;
  userEmail?: string | null;
}) => {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });

  if (params.sendEmail && notificationQueue) {
    const email = params.userEmail
      ? params.userEmail
      : (
          await prisma.user.findUnique({
            where: { id: params.userId },
            select: { email: true },
          })
        )?.email;

    if (email) {
      notificationQueue
        .add('send-notification-email', {
          to: email,
          title: params.title,
          body: params.body,
          link: params.link,
        })
        .catch((error) => logger.error('Failed to enqueue notification email:', error));
    }
  }

  return notification;
};
