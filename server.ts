import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDb } from './src/database';
import { setupMcpServer } from './src/mcp';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/index.js';
import { createApiRouter } from './src/routes/index';

dotenv.config();

// Path resolution shim
const getPaths = () => {
  try {
    const filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(filename);
    return { filename, dirname };
  } catch {
    return { filename: __filename, dirname: __dirname };
  }
};

const { filename: CURRENT_FILE, dirname: CURRENT_DIR } = getPaths();
const ROOT_DIR = CURRENT_FILE.includes('dist') ? path.resolve(CURRENT_DIR, '..') : process.cwd();
const distPath = path.resolve(ROOT_DIR, 'dist');
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.resolve(ROOT_DIR, 'uploads');
const dataDir = process.env.VERCEL ? '/tmp/data' : path.resolve(ROOT_DIR, 'data');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Logging for production
if (process.env.NODE_ENV === 'production') {
  console.log('--- PRODUCTION STARTUP ---');
  console.log('CWD:', ROOT_DIR);
}

async function startServer() {
  const db = await initDb();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. Logging Middleware (PRIORITY)
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API REQUEST] ${req.method} ${req.url} - ${new Date().toISOString()}`);
      if (req.method === 'POST') {
        console.log(`[API BODY]`, { ...req.body, password: '***' });
      }
    }
    next();
  });

  // 2. CORS configuration
  const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*';
  app.use(cors({
    origin: allowedOrigins, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.use('/uploads', express.static(uploadsDir));

  // --- API ROUTES ---
  app.use('/api', createApiRouter(db, uploadsDir));

  // API 404 Handler (Must be after all API routes but before frontend routes)
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // --- MCP Server ---
  const mcpServer = await setupMcpServer();
  let transport: SSEServerTransport | null = null;
  app.get('/mcp/messages', async (req, res) => {
    transport = new SSEServerTransport('/mcp/messages', res);
    await mcpServer.connect(transport);
  });
  app.post('/mcp/messages', async (req, res) => {
    if (transport) await transport.handlePostMessage(req, res);
    else res.status(400).send('MCP not initialized');
  });

  // --- FRONTEND ROUTES ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log(`[PROD] Searching frontend in: ${distPath}`);
    if (fs.existsSync(distPath)) {
      console.log(`[PROD] Found dist folder at: ${distPath}`);
      app.use(express.static(distPath, { index: false }));
      app.get('*', (req, res) => {
        // Skip already handled paths
        if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) return; 
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      app.get('*', (req, res) => {
        if (req.url.startsWith('/api')) return;
        res.status(404).send('Application non prête (dist manquant).');
      });
    }
  }

  // Global Express Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Only listen if not in a test environment or Vercel
  if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  
  return app;
}

export default startServer;

// Start the server if this file is run directly
const isMain = 
  (typeof require !== 'undefined' && require.main === module) || 
  (process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.cjs')));

if (isMain && !process.env.VERCEL) {
  startServer().catch(err => {
    console.error("Critical error during server boot:", err);
    process.exit(1);
  });
}


