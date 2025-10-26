import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { createQueueDashboard } from './dashboard';
import { testConnection } from './database/connections';
import { ErrorMiddleware } from './middlewares/error.middleware';
import routes from './routes';
import './workers'; // Start verification worker

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:4000', // Admin dashboard
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Wallet-Address',
        'X-Signature',
        'X-Message',
        'X-Timestamp',
      ],
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  app.use('/admin/queues', createQueueDashboard());

  // API routes
  app.use('/api/v1', routes);

  // 404 handler
  app.use(ErrorMiddleware.notFound);

  // Global error handler
  app.use(ErrorMiddleware.handle);

  return app;
}

// Test database connection on startup
testConnection().catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});
