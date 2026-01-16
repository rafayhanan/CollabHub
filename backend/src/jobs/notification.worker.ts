import { Worker } from 'bullmq';
import logger from '../utils/logger';
import { createRedisConnection, isRedisConfigured } from '../config/redis';
import { NOTIFICATION_QUEUE, NotificationJobPayload } from '../queues/notification.queue';
import { getNotificationEmailTemplate, isMailerConfigured, sendEmail } from '../utils/mailer';

export const startNotificationWorker = () => {
  if (!isRedisConfigured) {
    logger.warn('Notification worker not started (REDIS_URL not set).');
    return null;
  }

  if (!isMailerConfigured) {
    logger.warn('Notification worker not started (SMTP not configured).');
    return null;
  }

  const connection = createRedisConnection();

  const worker = new Worker<NotificationJobPayload>(
    NOTIFICATION_QUEUE,
    async (job) => {
      const emailTemplate = getNotificationEmailTemplate({
        title: job.data.title,
        body: job.data.body,
        link: job.data.link,
      });

      await sendEmail({
        to: job.data.to,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      logger.info(`Notification email sent to ${job.data.to}`);
    },
    { connection: connection as any },
  );

  worker.on('failed', (job, err) => {
    logger.error(`Notification job failed ${job?.id}: ${err.message}`);
  });

  return worker;
};
