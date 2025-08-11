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
import taskRoutes from './routes/task.routes';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

// Conditionally enable rate limiters (skip in tests)
const isTest = process.env.NODE_ENV === 'test';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    legacyHeaders: false,
    standardHeaders: true,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication requests from this IP, please try again after 15 minutes',
    legacyHeaders: false,
    standardHeaders: true,
});

// Global middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(cookieParser());
if (!isTest) app.use(limiter);

setupSwagger(app);

// Routes
app.use('/api/auth', !isTest ? authLimiter : (_req, _res, next) => next(), authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', invitationRoutes);
app.use('/api', taskRoutes);

// Error handler
app.use(errorHandler);

export default app;


