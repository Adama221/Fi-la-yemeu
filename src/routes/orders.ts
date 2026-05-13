import { Router } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pour-samabutik';

export function orderRoutes(db: any) {
  const router = Router();

  router.post('/', async (req, res) => {
    const { total, status, method, items, customer, affiliate_code } = req.body;
    const authHeader = req.headers.authorization;
    let userId = null;
    if (authHeader) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
        userId = decoded.id;
      } catch { /* guest */ }
    }
    
    try {
      await db.run('BEGIN TRANSACTION');
      const result = await db.run('INSERT INTO orders (user_id, total, status, method, items_json, customer_json, affiliate_code) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, total, status, method, JSON.stringify(items), JSON.stringify(customer), affiliate_code]);
      if (Array.isArray(items)) {
        for (const i of items) {
          await db.run('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [i.quantity || 1, i.id]);
        }
      }
      await db.run('COMMIT');
      res.json({ id: result.lastID, success: true });
    } catch(err) {
      await db.run('ROLLBACK').catch(() => {});
      res.status(500).json({ error: "Erreur commande" });
    }
  });

  router.post('/pay/orange', async (req, res) => {
    // Simulated Orange Money API
    const { amount, orderId } = req.body;
    res.json({ success: true, payment_url: null, transaction_id: `OM-${Date.now()}` });
  });

  return router;
}

export function newsletterRoutes(db: any) {
  const router = Router();

  router.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });
    try {
      await db.run('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email]);
      res.json({ success: true });
    } catch { res.json({ success: true, already: true }); }
  });

  return router;
}
