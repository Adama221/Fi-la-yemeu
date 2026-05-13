import { Request, Response } from 'express';
import startServer from '../server';

let app: any;

export default async function handler(req: Request, res: Response) {
  console.log(`[Vercel Handler] ${req.method} ${req.url}`);
  try {
    if (!app) {
      console.log('[Vercel Handler] Initializing server...');
      console.log('[Vercel Handler] Current directory:', process.cwd());
      app = await startServer();
      console.log('[Vercel Handler] Server initialized successfully');
    }
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Handler] Fatal Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Backend Initialization Failed',
        message: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN',
        stack: error.stack
      });
    }
  }
}
