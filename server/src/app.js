import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import healthRouter from './routes/health.js';
import showcaseRouter from './routes/showcase.js';
import buildRouter from './routes/build.js';
import { WEB_DIST_DIR } from './config.js';

export function createApp() {
  const app = express();

  // CORS configuration allowing all origins for hackathon development & demo
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/health', healthRouter);
  app.use('/api/showcase', showcaseRouter);
  app.use('/api/build', buildRouter);

  // Serve static production build from web/dist when present
  if (fs.existsSync(WEB_DIST_DIR)) {
    console.log(`[server] Serving static files from: ${WEB_DIST_DIR}`);
    app.use(express.static(WEB_DIST_DIR));

    // Client-side routing fallback (SPA)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      const indexPath = path.join(WEB_DIST_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next();
      }
    });
  } else {
    // Helpful landing page when web/dist is not yet built
    app.get('/', (req, res) => {
      res.json({
        message: 'Solder API server is running',
        endpoints: [
          'GET /api/health',
          'GET /api/showcase/:id (e.g. /api/showcase/sip)',
          'POST /api/build { prompt: string }',
          'GET /api/build/stream?prompt=...',
        ],
        hint: 'Build web/ to enable static frontend serving from web/dist',
      });
    });
  }

  // 404 for unmatched API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'not_found', message: `Cannot ${req.method} ${req.originalUrl}` });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('[server error]', err);
    res.status(err.status || 500).json({
      error: 'internal_server_error',
      message: err.message || 'An unexpected error occurred',
    });
  });

  return app;
}
