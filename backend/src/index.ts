import dotenv from 'dotenv';
import app from './app';
import logger from './utils/logger';
import { startInvitationWorker } from './jobs/invitation.worker';
import { startNotificationWorker } from './jobs/notification.worker';
import { logRedisStatus } from './config/redis';
import { logMailerStatus } from './utils/mailer';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

logRedisStatus();
logMailerStatus();
startInvitationWorker();
startNotificationWorker();

const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
