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
import chatRoutes from './routes/chat.routes';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

// Trust proxy for Railway / reverse proxies (needed for rate limiting)
app.set('trust proxy', 1);

// Conditionally enable rate limiters (skip in tests)
const isTest = process.env.NODE_ENV === 'test';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    legacyHeaders: false,
    standardHeaders: true,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many authentication requests from this IP, please try again after 15 minutes',
    legacyHeaders: false,
    standardHeaders: true,
});

// Global middleware
const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');

const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow non-browser requests or same-origin
            if (!origin) return callback(null, true);

            const normalizedOrigin = normalizeOrigin(origin);
            if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
    }),
);
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
app.use('/api/channels', chatRoutes);

// Error handler
app.use(errorHandler);

export default app;


