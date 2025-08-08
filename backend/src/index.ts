import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import leadRoutes from './routes/leads';
import taskRoutes from './routes/tasks';
import dashboardRoutes from './routes/dashboard';
import userRoutes from './routes/users';
import interactionRoutes from './routes/interactions';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';

// Import middlewares
import { errorHandler } from './middlewares/errorHandler';
import { authenticateJWT } from './middlewares/auth';
import { securityHeaders, apiLimiter } from './middlewares/security';
import { monitoringMiddleware, errorMonitoringMiddleware, performanceMiddleware } from './middlewares/monitoring';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
app.use(securityHeaders);

// Rate limiting
const limiter = apiLimiter;
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env['CORS_ORIGIN'] || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Monitoring middleware
app.use(monitoringMiddleware);
app.use(performanceMiddleware);

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CRM API is running',
    version: '1.0.0',
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/api/customers', authenticateJWT, customerRoutes);
app.use('/api/leads', authenticateJWT, leadRoutes);
app.use('/api/tasks', authenticateJWT, taskRoutes);
app.use('/api/dashboard', authenticateJWT, dashboardRoutes);
app.use('/api/users', authenticateJWT, userRoutes);
app.use('/api/interactions', authenticateJWT, interactionRoutes);
app.use('/api/reports', authenticateJWT, reportRoutes);
app.use('/api/admin', authenticateJWT, adminRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Database connection test
prisma.$connect()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

const PORT = process.env['PORT'] || 3001;

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
  });
}

export default app; 