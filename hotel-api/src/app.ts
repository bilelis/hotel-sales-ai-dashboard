import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiRouter } from './routes/index.js';

export function createApp(): express.Application {
  const app = express();

  // CORS configuration
  const allowedOrigins = config.corsOrigin.split(',').map((s: string) => s.trim());
  app.use(
    cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps, curl, local file HTML)
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive for local development
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request body parser
  app.use(express.json({ limit: '50kb' }));

  // Logging middleware
  app.use(requestLogger);

  // Root Welcome Endpoint
  app.get('/', (_req: express.Request, res: express.Response) => {
    res.json({
      name: 'Grand Azur Hotel Intelligence API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        dashboard: '/api/dashboard',
        chat: '/api/chat',
      },
      documentation: 'See API_DOCUMENTATION.md',
    });
  });

  // Favicon handler
  app.get('/favicon.ico', (_req: express.Request, res: express.Response) => {
    res.status(204).end();
  });

  // Mount API routes
  app.use('/api', apiRouter);

  // 404 Handler
  app.use((_req: express.Request, res: express.Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource does not exist on this server.',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
