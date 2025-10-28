import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/error.middleware';
import { logger } from './utils/logger';
import { rateLimiter } from './middlewares/rateLimiter.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import incidentRoutes from './routes/incident.routes';
import investigationRoutes from './routes/investigation.routes';
import hazardRoutes from './routes/hazard.routes';
import auditRoutes from './routes/audit.routes';
import trainingRoutes from './routes/training.routes';
import ppeRoutes from './routes/ppe.routes';
import mockDrillRoutes from './routes/mockDrill.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Behind proxies (e.g., Codespaces, Docker, reverse proxies), trust proxy so rate limiter and IP extraction work correctly
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/investigations', investigationRoutes);
app.use('/api/v1/hazards', hazardRoutes);
app.use('/api/v1/audits', auditRoutes);
app.use('/api/v1/training', trainingRoutes);
app.use('/api/v1/ppe', ppeRoutes);
app.use('/api/v1/mock-drills', mockDrillRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 BFCL Safety API running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
});

export default app;
