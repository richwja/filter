import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import webhookRoutes from './routes/webhooks';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import triageRoutes from './routes/triage';
import contactRoutes from './routes/contacts';
import contentRoutes from './routes/content';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${_res.statusCode} ${ms}ms`);
  });
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'filter-api' });
});

// Routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/triage', triageRoutes);
app.use('/api/projects/:projectId/contacts', contactRoutes);
app.use('/api/projects/:projectId', contentRoutes);
app.use('/api/projects/:projectId/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Filter API running on port ${PORT}`);
});

export default app;
