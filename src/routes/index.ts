import { Router, Request, Response } from 'express';
import { authRoutes } from './auth';
import { productRoutes, userActionsRoutes } from './products';
import { orderRoutes, newsletterRoutes } from './orders';
import { adminRoutes } from '../pages/admin';
import { affiliateRoutes } from './affiliate';
import { generateResponse } from '../services/gemini';
import multer from 'multer';
import { join } from 'path';
import { adminRequired } from './middleware';

export function createApiRouter(db: any, uploadsDir: string) {
  const router = Router();

  // Configure Multer for local storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
  const upload = multer({ storage });

  // --- UPLOAD API ---
  router.post('/upload', adminRequired, upload.single('image'), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
  });

  // --- GEMINI AI ---
  router.post('/gemini/chat', async (req: Request, res: Response) => {
    try {
      const { message, image, history } = req.body;
      if (!message && !image) return res.status(400).json({ error: 'Message ou image requis' });
      
      const response = await generateResponse(message, image, history, db.firebase);
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
      database: db.firebase ? 'connected' : 'disconnected',
      postgres: db.isPostgres ? 'connected' : 'not configured'
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
      if (db.isPostgres) {
        const { rows } = await db.pg.query("SELECT value FROM settings WHERE key = 'config'");
        return res.json({ settings: rows[0]?.value || {} });
      }
      if (!db.firebase) return res.json({ settings: {} });
      const snap = await db.firebase.collection('settings').doc('config').get();
      res.json({ settings: snap.exists ? snap.data() : {} });
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.put('/settings', adminRequired, async (req: Request, res: Response) => {
    try {
      const { logo, cover, primary_color, secondary_color, homepage_text } = req.body;
      const updates: any = {};
      if (logo !== undefined) updates.logo = logo;
      if (cover !== undefined) updates.cover = cover;
      if (primary_color !== undefined) updates.primary_color = primary_color;
      if (secondary_color !== undefined) updates.secondary_color = secondary_color;
      if (homepage_text !== undefined) updates.homepage_text = homepage_text;

      if (db.isPostgres) {
        await db.pg.query(
          "INSERT INTO settings (key, value) VALUES ('config', $1) ON CONFLICT (key) DO UPDATE SET value = settings.value || $1",
          [JSON.stringify(updates)]
        );
        return res.json({ success: true });
      }
      if (!db.firebase) return res.status(500).json({ error: 'Firebase not available' });
      await db.firebase.collection('settings').doc('config').set(updates, { merge: true });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.get('/categories', async (req: Request, res: Response) => {
    try {
      if (db.isPostgres) {
        const { rows } = await db.pg.query("SELECT DISTINCT category FROM products WHERE category IS NOT NULL");
        return res.json({ categories: rows.map((r: any) => r.category) });
      }
      if (!db.firebase) return res.json({ categories: [] });
      const snap = await db.firebase.collection('products').get();
      const catSet = new Set();
      snap.forEach((doc: any) => {
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
