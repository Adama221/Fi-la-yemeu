import express from 'express';
import { createServer as createViteServer } from 'vite';
import { resolve, join } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import { initDb } from './src/database';
import { createApiRouter } from './src/routes/index';

const PORT = 3000;

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
  
  app.use('/uploads', express.static(uploadsDir));

  // Initialize DB and API router
  const db = await initDb();
  app.use('/api', createApiRouter(db, uploadsDir));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(join(distPath, 'index.html'));
    });
  }

  // Only listen if not running in Vercel serverless environment
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

if (!process.env.VERCEL && process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.cjs'))) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
