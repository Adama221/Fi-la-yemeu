import { Router } from 'express';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pour-samabutik';

export function orderRoutes(dbProxy: any) {
  const router = Router();
  const db = dbProxy.firebase;
  const pg = dbProxy.pg;

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
      if (dbProxy.isPostgres) {
        const client = await pg.pool.connect();
        try {
          await client.query('BEGIN');
          const { rows } = await client.query(
            "INSERT INTO orders (user_id, total, status, payment_method, shipping_address) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [userId, total, status || 'pending', method, JSON.stringify(customer)]
          );
          const orderId = rows[0].id;

          if (Array.isArray(items)) {
            for (const i of items) {
              await client.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
                [orderId, i.id, i.quantity || 1, i.price]
              );
              // Simple stock decrement
              await client.query(
                "UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2",
                [i.quantity || 1, i.id]
              );
            }
          }

          await client.query('COMMIT');
          return res.json({ id: orderId, success: true });
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      }

      if (!db) return res.status(500).json({ error: 'Database not available' });
      let orderId: string = '';
      await db.runTransaction(async (t: any) => {
        const orderRef = db.collection('orders').doc();
        orderId = orderRef.id;
        t.set(orderRef, {
          user_id: userId,
          total,
          status,
          method,
          items_json: items,
          customer_json: customer,
          affiliate_code,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        if (Array.isArray(items)) {
          for (const i of items) {
            const prodRef = db.collection('products').doc(i.id);
            const prodSnap = await t.get(prodRef);
            if (prodSnap.exists) {
              const currentStock = prodSnap.data()?.stock || 0;
              const newStock = Math.max(0, currentStock - (i.quantity || 1));
              t.update(prodRef, { stock: newStock });
            }
          }
        }
      });

      res.json({ id: orderId, success: true });
    } catch(err) {
      console.error('Order Error:', err);
      res.status(500).json({ error: "Erreur commande" });
    }
  });

  router.post('/pay/orange', async (req, res) => {
    // Simulated Orange Money API
    res.json({ success: true, payment_url: null, transaction_id: `OM-${Date.now()}` });
  });

  return router;
}

export function newsletterRoutes(dbProxy: any) {
  const router = Router();
  const db = dbProxy.firebase;
  const pg = dbProxy.pg;

  router.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });
    try {
      if (dbProxy.isPostgres) {
        await pg.query(
          "INSERT INTO settings (key, value) VALUES ('newsletter_subs', jsonb_build_array($1)) ON CONFLICT (key) DO UPDATE SET value = settings.value || jsonb_build_array($1)",
          [email]
        );
        return res.json({ success: true });
      }

      if (!db) return res.json({ success: true });
      const snap = await db.collection('newsletter_subscribers').where('email', '==', email).get();
      if (snap.empty) {
        await db.collection('newsletter_subscribers').add({
          email,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      res.json({ success: true });
    } catch { res.json({ success: true, already: true }); }
  });

  return router;
}
