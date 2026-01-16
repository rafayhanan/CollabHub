import { ConnectionOptions, Queue } from 'bullmq';
import logger from '../utils/logger';
import { createRedisConnection, isRedisConfigured } from '../config/redis';


export const INVITATION_QUEUE = 'invitation';

export type InvitationJobPayload = {
    invitationId: string;
    projectName: string;
    invitedUserEmail: string;
    inviterName: string;
    inviterEmail?: string | null;
};

export const invitationQueue = (() => {
    if (!isRedisConfigured) {
        logger.warn('Invitation queue disabled (REDIS_URL not set).');
        return null;
    }

    const connection = createRedisConnection();
    return new Queue<InvitationJobPayload>(INVITATION_QUEUE, { connection: connection as ConnectionOptions });
})();
