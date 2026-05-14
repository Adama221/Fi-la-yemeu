import express from 'express';
import { createServer as createViteServer } from 'vite';
import { resolve, join } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import { initDb } from './src/database';
import { initPostgres, db as pgDb } from './src/lib/db.ts';
import { createApiRouter } from './src/routes/index';

const PORT = process.env.PORT || 3000;

export default async function startServer() {
  const app = express();
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use(cors({ origin: true, credentials: true }));
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use(express.json());
  
  // Serve static files
  app.use('/uploads', express.static(uploadsDir));

  // Initialize DBs
  const firebaseDb = await initDb();
  await initPostgres();

  // Unified DB object for injection
  const db = {
    firebase: firebaseDb,
    pg: pgDb,
    // Provide a helper to know which one is preferred
    isPostgres: !!process.env.DATABASE_URL
  };

  const apiRouter = createApiRouter(db, uploadsDir);
  
  // API routes mount
  app.use('/api', apiRouter);

  // Health check for reverse proxy
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Catch-all for API to prevent returning HTML for unknown API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // The catch-all MUST be last and NOT intercept /api or /uploads
    app.get('*', (req, res) => {
      // If the request is for an API or upload that reached here, it's a 404
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[SamaButik] Server running on http://0.0.0.0:${PORT}`);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
