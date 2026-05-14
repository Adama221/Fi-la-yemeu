import { Router, Request, Response } from 'express';
import { authRoutes } from './auth';
import { productRoutes, userActionsRoutes } from './products';
import { orderRoutes, newsletterRoutes } from './orders';
import { adminRoutes } from '../pages/admin';
import { affiliateRoutes } from './affiliate';
import { generateResponse } from '../services/gemini';

export function createApiRouter(db: any, uploadsDir: string) {
  const router = Router();

  // --- GEMINI AI ---
  router.post('/gemini/chat', async (req: Request, res: Response) => {
    try {
      const { message, image } = req.body;
      if (!message) return res.status(400).json({ error: 'Message requis' });
      
      const response = await generateResponse(message, image);
      res.json({ response });
    } catch (error: any) {
      console.error('Gemini Error:', error);
      res.status(500).json({ error: 'Erreur AI', message: error.message });
    }
  });

  // --- HEALTH & DIAG ---
  router.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      server: 'SamaButik Node.js (Express)',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: db ? 'connected' : 'disconnected'
    });
  });

  router.get('/debug-env', (req: Request, res: Response) => {
    res.json({
      cwd: process.cwd(),
      nodeVersion: process.version,
      platform: process.platform,
      envKeys: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY'))
    });
  });

  // --- SUB-ROUTERS ---
  router.use('/', authRoutes(db));
  router.use('/products', productRoutes(db));
  router.use('/user', userActionsRoutes(db));
  router.use('/orders', orderRoutes(db));
  router.use('/newsletter', newsletterRoutes(db));
  router.use('/admin', adminRoutes(db, uploadsDir));
  router.use('/affiliate', affiliateRoutes(db));

  // --- MISC ---
  router.get('/settings', async (req: Request, res: Response) => {
    try {
      const snap = await db.collection('settings').doc('config').get();
      res.json({ settings: snap.exists ? snap.data() : {} });
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.get('/categories', async (req: Request, res: Response) => {
    try {
      const snap = await db.collection('products').get();
      const catSet = new Set();
      snap.forEach(doc => {
        const data = doc.data();
        if (data.category) catSet.add(data.category);
      });
      res.json({ categories: Array.from(catSet) });
    } catch (e) {
      res.status(500).json({ error: 'Database error', categories: [] });
    }
  });

  return router;
}
