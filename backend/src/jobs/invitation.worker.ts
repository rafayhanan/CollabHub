import { ConnectionOptions, Worker } from 'bullmq';
import logger from '../utils/logger';
import { createRedisConnection, isRedisConfigured } from '../config/redis';
import { INVITATION_QUEUE, InvitationJobPayload } from '../queues/invitation.queue';
import { getInviteEmailTemplate, isMailerConfigured, sendEmail } from '../utils/mailer';

export const startInvitationWorker = () => {
    if (!isRedisConfigured) {
        logger.warn('Invitation worker not started (REDIS_URL not set).');
        return null;
    }

    if (!isMailerConfigured) {
        logger.warn('Invitation worker not started (SMTP not configured).');
        return null;
    }

    const connection = createRedisConnection();

    const worker = new Worker<InvitationJobPayload>(
        INVITATION_QUEUE,
        async (job) => {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const invitationLink = `${frontendUrl.replace(/\/$/, '')}/dashboard/invitations`;
            const emailTemplate = getInviteEmailTemplate({
                projectName: job.data.projectName,
                inviterName: job.data.inviterName,
                inviterEmail: job.data.inviterEmail || undefined,
                invitationLink,
            });

            await sendEmail({
                to: job.data.invitedUserEmail,
                subject: emailTemplate.subject,
                text: emailTemplate.text,
                html: emailTemplate.html,
            });

            logger.info(`Invitation email sent to ${job.data.invitedUserEmail}`);
        },
        { connection: connection as ConnectionOptions },
    );

    worker.on('failed', (job, err) => {
        logger.error(`Invitation job failed ${job?.id}: ${err.message}`);
    });

    return worker;
};
