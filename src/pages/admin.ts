import { Router } from 'express';
import { adminRequired } from '../routes/middleware';
import admin from 'firebase-admin';

export function adminRoutes(dbProxy: any, uploadsDir: string) {
  const router = Router();
  const db = dbProxy.firebase;
  const pg = dbProxy.pg;

  router.get('/dashboard', adminRequired, async (req, res) => {
    try {
      if (dbProxy.isPostgres) {
        const { rows: pCount } = await pg.query('SELECT COUNT(*) FROM products');
        const { rows: oCount } = await pg.query('SELECT COUNT(*), SUM(total) as revenue FROM orders');
        
        return res.json({ 
          products: parseInt(pCount[0].count), 
          orders: parseInt(oCount[0].count), 
          revenue: parseFloat(oCount[0].revenue || 0), 
          commissions: 0 // Placeholder
        });
      }

      if (!db) return res.json({ products: 0, orders: 0, revenue: 0, commissions: 0 });
      const prodSnap = await db.collection('products').count().get();
      const ordersSnap = await db.collection('orders').get(); // sum total
      const commSnap = await db.collection('commissions').count().get();
      
      let sum = 0;
      ordersSnap.forEach((doc: any) => sum += (doc.data().total || 0));

      res.json({ products: prodSnap.data().count, orders: ordersSnap.size, revenue: sum, commissions: commSnap.data().count });
    } catch {
      res.json({ products: 0, orders: 0, revenue: 0, commissions: 0 });
    }
  });

  router.get('/analytics', adminRequired, async (req, res) => {
    try {
      if (dbProxy.isPostgres) {
        const { rows: salesTrend } = await pg.query(`
          SELECT DATE_TRUNC('day', created_at)::date as day, SUM(total) as revenue 
          FROM orders 
          WHERE created_at >= NOW() - INTERVAL '30 days' 
          GROUP BY day ORDER BY day ASC
        `);
        // Simple mock for popular products in postgres for now
        return res.json({ salesTrend, popularProducts: [] });
      }

      if (!db) return res.json({ salesTrend: [], popularProducts: [] });
      const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const ordersSnap = await db.collection('orders')
        .where('created_at', '>=', thirtyDaysAgo)
        .orderBy('created_at', 'asc')
        .get();

      const salesMap: any = {};
      const prodCountMap: any = {};

      ordersSnap.forEach((doc: any) => {
        const data = doc.data();
        const dateStr = data.created_at?.toDate().toISOString().split('T')[0] || '';
        salesMap[dateStr] = (salesMap[dateStr] || 0) + (data.total || 0);

        if (Array.isArray(data.items_json)) {
          for (const item of data.items_json) {
            prodCountMap[item.id] = (prodCountMap[item.id] || 0) + 1;
          }
        }
      });

      const salesTrend = Object.keys(salesMap).map(day => ({ day, revenue: salesMap[day] }));
      
      const popularArr = [];
      const keys = Object.keys(prodCountMap).sort((a,b) => prodCountMap[b] - prodCountMap[a]).slice(0, 5);
      for (const pid of keys) {
        const pDoc = await db.collection('products').doc(pid).get();
        if (pDoc.exists) {
          popularArr.push({ name: pDoc.data()?.name, sales_count: prodCountMap[pid] });
        }
      }

      res.json({ salesTrend, popularProducts: popularArr });
    } catch {
      res.json({ salesTrend: [], popularProducts: [] });
    }
  });

  router.get('/orders', adminRequired, async (req, res) => {
    try {
      if (dbProxy.isPostgres) {
        const { rows: orders } = await pg.query('SELECT * FROM orders ORDER BY created_at DESC');
        return res.json({ orders });
      }

      if (!db) return res.json({ orders: [] });
      const snap = await db.collection('orders').orderBy('created_at', 'desc').get();
      const orders = snap.docs.map((doc: any) => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            items: typeof data.items_json === 'string' ? JSON.parse(data.items_json || '[]') : (data.items_json || []),
            customer: typeof data.customer_json === 'string' ? JSON.parse(data.customer_json || '{}') : (data.customer_json || {})
          };
      });
      res.json({ orders });
    } catch { res.json({ orders: [] }); }
  });

  router.get('/products', adminRequired, async (req, res) => {
    try {
      if (dbProxy.isPostgres) {
        const { rows: products } = await pg.query('SELECT * FROM products ORDER BY name ASC');
        return res.json({ products });
      }

      if (!db) return res.json({ products: [] });
      const snap = await db.collection('products').get();
      const products = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ products });
    } catch { res.json({ products: [] }); }
  });

  router.get('/affiliates', adminRequired, async (req, res) => {
    const snap = await db.collection('affiliates').get();
    const affiliates = await Promise.all(snap.docs.map(async doc => {
        const uSnap = await db.collection('users').doc(doc.data().user_id).get();
        return { id: doc.id, ...doc.data(), email: uSnap.data()?.email };
    }));
    res.json({ affiliates });
  });

  router.get('/payment-links', adminRequired, async (req, res) => {
    const snap = await db.collection('settings').doc('payment_configs').get();
    res.json(snap.exists ? snap.data() : { wave_link: '', orange_link: '' });
  });

  router.post('/payment-links', adminRequired, async (req, res) => {
    const { wave, orange } = req.body;
    await db.collection('settings').doc('payment_configs').update({ wave_link: wave, orange_link: orange });
    res.json({ success: true });
  });

  router.post('/design', adminRequired, async (req, res) => {
    // Assuming body parses json directly now without multer
    const { logo_url, cover_url, primary_color, secondary_color, text } = req.body;
    const updates: any = {};
    if (logo_url !== undefined) updates.logo = logo_url;
    if (cover_url !== undefined) updates.cover = cover_url;
    if (primary_color !== undefined) updates.primary_color = primary_color;
    if (secondary_color !== undefined) updates.secondary_color = secondary_color;
    if (text !== undefined) updates.homepage_text = text;
    
    if (Object.keys(updates).length > 0) {
      await db.collection('settings').doc('config').update(updates);
    }
    res.json({ success: true });
  });

  return router;
}
