import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import documentRoutes from './routes/document.routes';
import chatRoutes from './routes/chat.routes';
import searchRoutes from './routes/search.routes';
import authRoutes from './routes/auth.routes';

export const app = express();

// Enable CORS for frontend origins (port 3000 & 3001)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during development
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'KnowledgeHub Express Backend API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Bind API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);

// 404 Fallback Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});
