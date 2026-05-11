import { Router } from 'express';
import { authRequired } from './middleware';

export function affiliateRoutes(db: any) {
  const router = Router();

  router.get('/dashboard', authRequired, async (req, res) => {
    const user = (req as any).user;
    const aff = await db.get('SELECT * FROM affiliates WHERE user_id = ?', [user.id]);
    if (!aff) return res.json({ isAffiliate: false });
    const comms = await db.all('SELECT * FROM commissions WHERE affiliate_id = ? ORDER BY created_at DESC', [aff.id]);
    res.json({ isAffiliate: true, affiliate: aff, commissions: comms });
  });

  router.post('/apply', authRequired, async (req, res) => {
    const user = (req as any).user;
    const existing = await db.get('SELECT id FROM affiliates WHERE user_id = ?', [user.id]);
    if (existing) return res.status(400).json({ error: "Déjà affilié" });
    const code = 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.run('INSERT INTO affiliates (user_id, code, balance) VALUES (?, ?, 0)', [user.id, code]);
    res.json({ success: true });
  });

  return router;
}
