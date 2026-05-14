import { Router } from 'express';
import { authRequired, adminRequired } from './middleware';
import admin from 'firebase-admin';

export function productRoutes(dbProxy: any) {
  const router = Router();
  const db = dbProxy.firebase;
  const pg = dbProxy.pg;

  router.get('/', async (req, res) => {
    try {
      if (dbProxy.isPostgres) {
        const { rows } = await pg.query('SELECT * FROM products ORDER BY name ASC');
        return res.json({ products: rows });
      }
      
      if (!db) return res.json({ products: [] });
      const snap = await db.collection('products').orderBy('name').get();
      const products = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ products });
    } catch (e: any) {
      console.error('API Error:', e);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // --- ADMIN ACTIONS ---
  router.post('/', adminRequired, async (req, res) => {
    const { name, price, description, category, commission, stock, low_stock_threshold, image_url } = req.body;
    try {
      if (dbProxy.isPostgres) {
        const { rows } = await pg.query(
          `INSERT INTO products (name, price, description, image, category, commission, stock, low_stock_threshold) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [name, Number(price), description, image_url || null, category, commission ? Number(commission) : null, Number(stock) || 0, Number(low_stock_threshold) || 5]
        );
        return res.json({ success: true, id: rows[0].id });
      }

      if (!db) return res.status(500).json({ error: 'Firebase not available' });
      const ref = await db.collection('products').add({ 
        name, 
        price: Number(price), 
        description, 
        image: image_url || null, 
        category, 
        commission: commission ? Number(commission) : null, 
        stock: Number(stock) || 0, 
        low_stock_threshold: Number(low_stock_threshold) || 5,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, id: ref.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/:id', adminRequired, async (req, res) => {
    const { name, price, description, category, commission, stock, low_stock_threshold, image_url } = req.body;
    try {
      if (dbProxy.isPostgres) {
        await pg.query(
          `UPDATE products SET name = $1, price = $2, description = $3, image = $4, category = $5, commission = $6, stock = $7, low_stock_threshold = $8 
           WHERE id = $9`,
          [name, Number(price), description, image_url, category, commission ? Number(commission) : null, Number(stock) || 0, Number(low_stock_threshold) || 5, req.params.id]
        );
        return res.json({ success: true });
      }

      if (!db) return res.status(500).json({ error: 'Firebase not available' });
      const ref = db.collection('products').doc(req.params.id);
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (price !== undefined) updates.price = price !== null ? Number(price) : null;
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      if (commission !== undefined) updates.commission = commission !== null ? Number(commission) : null;
      if (stock !== undefined) updates.stock = stock !== null ? Number(stock) : 0;
      if (low_stock_threshold !== undefined) updates.low_stock_threshold = low_stock_threshold !== null ? Number(low_stock_threshold) : 5;
      if (image_url !== undefined) updates.image = image_url;
      
      await ref.update(updates);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/:id', adminRequired, async (req, res) => {
    try {
      if (dbProxy.isPostgres) {
        await pg.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        return res.json({ success: true });
      }

      if (!db) return res.status(500).json({ error: 'Firebase not available' });
      await db.collection('products').doc(req.params.id).delete();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  // --- END ADMIN ACTIONS ---

  router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') return res.json({ products: [] });
    
    try {
      if (dbProxy.isPostgres) {
        const { rows } = await pg.query(
          'SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1 LIMIT 20',
          [`%${q}%`]
        );
        return res.json({ products: rows });
      }

      if (!db) return res.json({ products: [] });
      const snap = await db.collection('products').get();
      const query = q.toLowerCase();
      const products = snap.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as any))
        .filter((p: any) => (p.name && p.name.toLowerCase().includes(query)) || (p.description && p.description.toLowerCase().includes(query)))
        .slice(0, 20);
      res.json({ products });
    } catch {
      res.json({ products: [] });
    }
  });

  router.get('/categories', async (req, res) => {
    try {
      if (dbProxy.isPostgres) {
        const { rows } = await pg.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL');
        return res.json({ categories: rows.map((r: any) => r.category) });
      }

      if (!db) return res.json({ categories: [] });
      const snap = await db.collection('products').get();
      const catSet = new Set();
      snap.forEach((doc: any) => {
        const data = doc.data();
        if (data.category) catSet.add(data.category);
      });
      res.json({ categories: Array.from(catSet) });
    } catch {
      res.json({ categories: [] });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      if (dbProxy.isPostgres) {
        const { rows } = await pg.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Pas trouvé' });
        return res.json(rows[0]);
      }

      if (!db) return res.status(404).json({ error: 'Firebase not available' });
      const snap = await db.collection('products').doc(req.params.id).get();
      if (!snap.exists) return res.status(404).json({ error: 'Pas trouvé' });
      res.json({ id: snap.id, ...snap.data() });
    } catch {
      res.status(500).json({ error: 'Error' });
    }
  });

  router.get('/:id/related', async (req, res) => {
    try {
      if (dbProxy.isPostgres) {
        const { rows: pRows } = await pg.query('SELECT category FROM products WHERE id = $1', [req.params.id]);
        if (pRows.length === 0) return res.status(404).json({ error: 'Pas trouvé' });
        const { rows: related } = await pg.query(
          'SELECT * FROM products WHERE category = $1 AND id != $2 LIMIT 5',
          [pRows[0].category, req.params.id]
        );
        return res.json({ related });
      }

      if (!db) return res.json({ related: [] });
      const pSnap = await db.collection('products').doc(req.params.id).get();
      if (!pSnap.exists) return res.status(404).json({ error: 'Pas trouvé' });
      const cat = pSnap.data()?.category;
      if (!cat) return res.json({ related: [] });
      
      let relatedSnap = await db.collection('products').where('category', '==', cat).limit(5).get();
      let related = relatedSnap.docs
        .filter((doc: any) => doc.id !== req.params.id)
        .map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ related });
    } catch {
      res.json({ related: [] });
    }
  });

  router.get('/:id/reviews', async (req, res) => {
    try {
      if (dbProxy.isPostgres) {
        const { rows: reviews } = await pg.query(
          `SELECT r.*, u.username FROM product_reviews r 
           LEFT JOIN users u ON r.user_id = u.id 
           WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
          [req.params.id]
        );
        return res.json({ reviews });
      }

      if (!db) return res.json({ reviews: [] });
      const snap = await db.collection('product_reviews').where('product_id', '==', req.params.id).get();
      const reviews = await Promise.all(snap.docs.map(async (doc: any) => {
        const data = doc.data();
        const userSnap = await db.collection('users').doc(data.user_id).get();
        return { id: doc.id, ...data, username: userSnap.data()?.username || 'Anonyme' };
      }));
      res.json({ reviews });
    } catch {
      res.json({ reviews: [] });
    }
  });

  router.post('/:id/reviews', authRequired, async (req, res) => {
    const { rating, comment } = req.body;
    const user = (req as any).user;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Note 1-5 requise" });
    
    try {
      if (dbProxy.isPostgres) {
        await pg.query(
          'INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)',
          [req.params.id, user.id, rating, comment]
        );
        return res.json({ success: true });
      }

      if (!db) return res.status(500).json({ error: 'Firebase not available' });
      await db.collection('product_reviews').add({
        product_id: req.params.id,
        user_id: user.id,
        rating,
        comment,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Error' });
    }
  });

  return router;
}

export function userActionsRoutes(dbProxy: any) {
  const router = Router();
  const db = dbProxy.firebase;
  const pg = dbProxy.pg;

  router.put('/profile', authRequired, async (req, res) => {
    const user = (req as any).user;
    const { username, phone, address } = req.body;
    try {
      if (dbProxy.isPostgres) {
        await pg.query(
          'UPDATE users SET username = $1, phone = $2, address = $3 WHERE id = $4',
          [username, phone, address, user.id]
        );
        const { rows } = await pg.query('SELECT * FROM users WHERE id = $1', [user.id]);
        const { password, ...safeUser } = rows[0];
        return res.json({ success: true, user: safeUser });
      }

      if (!db) return res.status(500).json({ error: 'Firebase not available' });
      const ref = db.collection('users').doc(user.id);
      await ref.update({ username, phone, address });
      const snap = await ref.get();
      const { password, ...safeUser } = snap.data() as any;
      res.json({ success: true, user: { id: snap.id, ...safeUser } });
    } catch { res.status(500).json({ error: "Erreur de mise à jour" }); }
  });

  router.get('/orders', authRequired, async (req, res) => {
    const user = (req as any).user;
    try {
      if (dbProxy.isPostgres) {
        const { rows: orders } = await pg.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
        return res.json({ orders });
      }

      if (!db) return res.json({ orders: [] });
      const snap = await db.collection('orders').where('user_id', '==', user.id).get();
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

  router.get('/wishlist', authRequired, async (req, res) => {
    const user = (req as any).user;
    try {
      if (dbProxy.isPostgres) {
        const { rows } = await pg.query(
          'SELECT p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = $1',
          [user.id]
        );
        return res.json({ wishlist: rows });
      }

      if (!db) return res.json({ wishlist: [] });
      const snap = await db.collection('wishlists').where('user_id', '==', user.id).get();
      const wishlist = await Promise.all(snap.docs.map(async (doc: any) => {
        const pSnap = await db.collection('products').doc(doc.data().product_id).get();
        return { id: pSnap.id, ...pSnap.data() };
      }));
      res.json({ wishlist });
    } catch { res.json({ wishlist: [] }); }
  });

  router.post('/wishlist/toggle', authRequired, async (req, res) => {
    const { product_id } = req.body;
    const user = (req as any).user;
    try {
      if (dbProxy.isPostgres) {
        const { rows } = await pg.query('SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2', [user.id, product_id]);
        if (rows.length > 0) {
          await pg.query('DELETE FROM wishlist WHERE id = $1', [rows[0].id]);
          return res.json({ action: 'removed' });
        } else {
          await pg.query('INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)', [user.id, product_id]);
          return res.json({ action: 'added' });
        }
      }

      if (!db) return res.status(500).json({ error: 'Firebase not available' });
      const snap = await db.collection('wishlists').where('user_id', '==', user.id).where('product_id', '==', product_id).get();
      
      if (!snap.empty) {
        await snap.docs[0].ref.delete();
        res.json({ action: 'removed' });
      } else {
        await db.collection('wishlists').add({ user_id: user.id, product_id, created_at: admin.firestore.FieldValue.serverTimestamp() });
        res.json({ action: 'added' });
      }
    } catch { res.status(500).json({ error: 'Error' }); }
  });

  return router;
}
