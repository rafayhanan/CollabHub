import { Queue } from 'bullmq';
import logger from '../utils/logger';
import { createRedisConnection, isRedisConfigured } from '../config/redis';

export const NOTIFICATION_QUEUE = 'notification';

export type NotificationJobPayload = {
  to: string;
  title: string;
  body: string;
  link?: string;
};

export const notificationQueue = (() => {
  if (!isRedisConfigured) {
    logger.warn('Notification queue disabled (REDIS_URL not set).');
    return null;
  }

  const connection = createRedisConnection();
  return new Queue<NotificationJobPayload>(NOTIFICATION_QUEUE, { connection: connection as any });
})();
