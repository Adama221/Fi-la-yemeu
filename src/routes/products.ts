import { Router } from 'express';
import { authRequired } from './middleware';
import admin from 'firebase-admin';

export function productRoutes(db: FirebaseFirestore.Firestore) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const snap = await db.collection('products').orderBy('name').get();
      const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ products });
    } catch {
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') return res.json({ products: [] });
    // Firestore lacks native wildcard text search, doing simple client side after fetch
    const snap = await db.collection('products').get();
    const query = q.toLowerCase();
    const products = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(p => (p.name && p.name.toLowerCase().includes(query)) || (p.description && p.description.toLowerCase().includes(query)))
      .slice(0, 20);
    res.json({ products });
  });

  router.get('/categories', async (req, res) => {
    const snap = await db.collection('products').get();
    const catSet = new Set();
    snap.forEach(doc => {
      const data = doc.data();
      if (data.category) catSet.add(data.category);
    });
    res.json({ categories: Array.from(catSet) });
  });

  router.get('/:id', async (req, res) => {
    const snap = await db.collection('products').doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: 'Pas trouvé' });
    res.json({ id: snap.id, ...snap.data() });
  });

  router.get('/:id/related', async (req, res) => {
    const pSnap = await db.collection('products').doc(req.params.id).get();
    if (!pSnap.exists) return res.status(404).json({ error: 'Pas trouvé' });
    const cat = pSnap.data()?.category;
    if (!cat) return res.json({ related: [] });
    
    let relatedSnap = await db.collection('products').where('category', '==', cat).limit(5).get();
    let related = relatedSnap.docs
      .filter(doc => doc.id !== req.params.id)
      .map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ related });
  });

  router.get('/:id/reviews', async (req, res) => {
    const snap = await db.collection('product_reviews').where('product_id', '==', req.params.id).get();
    const reviews = await Promise.all(snap.docs.map(async doc => {
      const data = doc.data();
      const userSnap = await db.collection('users').doc(data.user_id).get();
      return { id: doc.id, ...data, username: userSnap.data()?.username || 'Anonyme' };
    }));
    res.json({ reviews });
  });

  router.post('/:id/reviews', authRequired, async (req, res) => {
    const { rating, comment } = req.body;
    const user = (req as any).user;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Note 1-5 requise" });
    await db.collection('product_reviews').add({
      product_id: req.params.id,
      user_id: user.id,
      rating,
      comment,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  });

  return router;
}

export function userActionsRoutes(db: FirebaseFirestore.Firestore) {
  const router = Router();

  router.put('/profile', authRequired, async (req, res) => {
    const user = (req as any).user;
    const { username, phone, address } = req.body;
    try {
      const ref = db.collection('users').doc(user.id);
      await ref.update({ username, phone, address });
      const snap = await ref.get();
      const { password, ...safeUser } = snap.data() as any;
      res.json({ success: true, user: { id: snap.id, ...safeUser } });
    } catch { res.status(500).json({ error: "Erreur de mise à jour" }); }
  });

  router.get('/orders', authRequired, async (req, res) => {
    const user = (req as any).user;
    const snap = await db.collection('orders').where('user_id', '==', user.id).get();
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

  router.get('/wishlist', authRequired, async (req, res) => {
    const user = (req as any).user;
    const snap = await db.collection('wishlists').where('user_id', '==', user.id).get();
    const wishlist = await Promise.all(snap.docs.map(async doc => {
      const pSnap = await db.collection('products').doc(doc.data().product_id).get();
      return { id: pSnap.id, ...pSnap.data() };
    }));
    res.json({ wishlist });
  });

  router.post('/wishlist/toggle', authRequired, async (req, res) => {
    const { product_id } = req.body;
    const user = (req as any).user;
    const snap = await db.collection('wishlists').where('user_id', '==', user.id).where('product_id', '==', product_id).get();
    
    if (!snap.empty) {
      await snap.docs[0].ref.delete();
      res.json({ action: 'removed' });
    } else {
      await db.collection('wishlists').add({ user_id: user.id, product_id, created_at: admin.firestore.FieldValue.serverTimestamp() });
      res.json({ action: 'added' });
    }
  });

  return router;
}
