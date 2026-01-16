import IORedis from 'ioredis';
import logger from '../utils/logger';

const redisUrl = process.env.REDIS_URL;

export const createRedisConnection = () => {
    if (!redisUrl) {
        throw new Error('REDIS_URL is not set');
    }

    return new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
};

export const isRedisConfigured = Boolean(redisUrl);

export const logRedisStatus = () => {
    if (!redisUrl) {
        logger.warn('REDIS_URL not set. Background jobs will be disabled.');
    }
};
