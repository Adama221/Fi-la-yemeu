import startServer from '../server.js';

let app: any;

export default async function handler(req: any, res: any) {
  console.log(`[Vercel] Handler called for ${req.method} ${req.url}`);
  try {
    if (!app) {
      console.log('[Vercel] Initializing startServer...');
      app = await startServer();
      console.log('[Vercel] app initialized successfully');
    }
    // Express app is a function (req, res) => { ... }
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel] Fatal error in handler:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to initialize server', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}
