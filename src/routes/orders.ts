import { Router } from 'express';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pour-samabutik';

export function orderRoutes(db: FirebaseFirestore.Firestore) {
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
      let orderId;
      await db.runTransaction(async (t) => {
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

export function newsletterRoutes(db: FirebaseFirestore.Firestore) {
  const router = Router();

  router.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });
    try {
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
