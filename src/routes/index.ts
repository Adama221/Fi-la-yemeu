import { Router } from 'express';
import { authRoutes } from './auth.js';
import { productRoutes, userActionsRoutes } from './products.js';
import { orderRoutes, newsletterRoutes } from './orders.js';
import { adminRoutes } from './admin.js';
import { affiliateRoutes } from './affiliate.js';

export function createApiRouter(db: any, uploadsDir: string) {
  const router = Router();

  // --- HEALTH & DIAG ---
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'SamaButik Node.js (Express)',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: db ? 'connected' : 'disconnected'
    });
  });

  router.get('/debug-env', (req, res) => {
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
  router.get('/settings', async (req, res) => {
    const settings = await db.get('SELECT * FROM site_settings WHERE id = 1');
    res.json({ settings });
  });

  router.get('/categories', async (req, res) => {
    const cats = await db.all('SELECT DISTINCT category FROM products WHERE category IS NOT NULL');
    res.json({ categories: cats.map((c: any) => c.category) });
  });

  return router;
}
