import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { initDb } from './src/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { setupMcpServer } from './src/mcp';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse';

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
const uploadsDir = path.resolve(ROOT_DIR, 'uploads');
const dataDir = path.resolve(ROOT_DIR, 'data');

console.log('--- DIAGNOSTIC HOSTINGER ---');
console.log('Current CWD:', ROOT_DIR);
console.log('Target Dist Path:', distPath);
console.log('Dist Folder Exists:', fs.existsSync(distPath));
if (fs.existsSync(distPath)) {
  console.log('Files in Dist:', fs.readdirSync(distPath));
}
console.log('---------------------------');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Redirect stdout/stderr to a file in production for Hostinger debugging
if (process.env.NODE_ENV === 'production') {
  const logFile = path.resolve(ROOT_DIR, 'data', 'server.log');
  if (!fs.existsSync(path.dirname(logFile))) fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  process.stdout.write = (chunk: any) => {
    logStream.write(`[${new Date().toISOString()}] STDOUT: ${chunk}`);
    return true;
  };
  process.stderr.write = (chunk: any) => {
    logStream.write(`[${new Date().toISOString()}] STDERR: ${chunk}`);
    return true;
  };

  console.log('--- PRODUCTION STARTUP ---');
  console.log('CWD:', ROOT_DIR);
}

const upload = multer({ dest: uploadsDir });

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pour-samabutik';

async function startServer() {
  console.log(`Server starting in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Root directory: ${ROOT_DIR}`);
  
  const db = await initDb();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. Logging Middleware (PRIORITY)
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API REQUEST] ${req.method} ${req.url}`);
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
  const { createApiRouter } = await import('./src/api-routes');
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
    if (fs.existsSync(distPath)) {
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
const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('server.ts');
if (isMain && !process.env.VERCEL) {
  startServer().catch(err => {
    console.error("Critical error during server boot:", err);
    process.exit(1);
  });
}


