import { Router } from 'express';
import { adminRequired } from '../routes/middleware';
import admin from 'firebase-admin';

export function adminRoutes(db: FirebaseFirestore.Firestore, uploadsDir: string) {
  const router = Router();

  router.get('/dashboard', adminRequired, async (req, res) => {
    try {
      const prodSnap = await db.collection('products').count().get();
      const ordersSnap = await db.collection('orders').get(); // sum total
      const commSnap = await db.collection('commissions').count().get();
      
      let sum = 0;
      ordersSnap.forEach(doc => sum += (doc.data().total || 0));

      res.json({ products: prodSnap.data().count, orders: ordersSnap.size, revenue: sum, commissions: commSnap.data().count });
    } catch {
      res.json({ products: 0, orders: 0, revenue: 0, commissions: 0 });
    }
  });

  router.get('/analytics', adminRequired, async (req, res) => {
    try {
      const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const ordersSnap = await db.collection('orders')
        .where('created_at', '>=', thirtyDaysAgo)
        .orderBy('created_at', 'asc')
        .get();

      const salesMap: any = {};
      const prodCountMap: any = {};

      ordersSnap.forEach(doc => {
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
      
      // for popular products, we need names
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
    const snap = await db.collection('orders').orderBy('created_at', 'desc').get();
    const orders = snap.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          items: typeof data.items_json === 'string' ? JSON.parse(data.items_json || '[]') : (data.items_json || []),
          customer: typeof data.customer_json === 'string' ? JSON.parse(data.customer_json || '{}') : (data.customer_json || {})
        };
    });
    res.json({ orders });
  });

  router.get('/products', adminRequired, async (req, res) => {
    const snap = await db.collection('products').get();
    const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ products });
  });

  // Replaced multer with JSON body for base64 / URLs
  router.post('/products', adminRequired, async (req, res) => {
    const { name, price, description, category, commission, stock, low_stock_threshold, image_url } = req.body;
    await db.collection('products').add({ name, price, description, image: image_url || null, category, commission, stock, low_stock_threshold });
    res.json({ success: true });
  });

  router.post('/products/:id/update', adminRequired, async (req, res) => {
    const { name, price, description, category, commission, stock, low_stock_threshold, image_url } = req.body;
    const ref = db.collection('products').doc(req.params.id);
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (commission !== undefined) updates.commission = commission;
    if (stock !== undefined) updates.stock = stock;
    if (low_stock_threshold !== undefined) updates.low_stock_threshold = low_stock_threshold;
    if (image_url !== undefined) updates.image = image_url;
    
    await ref.update(updates);
    res.json({ success: true });
  });

  router.delete('/products/:id', adminRequired, async (req, res) => {
    await db.collection('products').doc(req.params.id).delete();
    res.json({ success: true });
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
