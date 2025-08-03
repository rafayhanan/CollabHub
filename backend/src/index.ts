import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import invitationRoutes from './routes/invitation.routes';
import { setupSwagger } from './config/swagger';
import logger from './utils/logger';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth-related requests per windowMs
  message: 'Too many authentication requests from this IP, please try again after 15 minutes',
});

// Setup middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Set security headers
app.use(compression()); // Compress responses
app.use(express.json());
app.use(cookieParser());
app.use(limiter); // Apply general rate limiting

setupSwagger(app);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/projects', authLimiter, projectRoutes);
app.use('/api', authLimiter, invitationRoutes);

// Centralized error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);