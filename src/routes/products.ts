import { Router } from 'express';
import { authRequired } from './middleware';

export function productRoutes(db: any) {
  const router = Router();

  router.get('/', async (req, res) => {
    const products = await db.all('SELECT * FROM products ORDER BY id DESC');
    res.json({ products });
  });

  router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ products: [] });
    const products = await db.all('SELECT * FROM products WHERE name LIKE ? OR description LIKE ? LIMIT 20', [`%${q}%`, `%${q}%`]);
    res.json({ products });
  });

  router.get('/categories', async (req, res) => {
    const cats = await db.all('SELECT DISTINCT category FROM products WHERE category IS NOT NULL');
    res.json({ categories: cats.map((c: any) => c.category) });
  });

  router.get('/:id', async (req, res) => {
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Pas trouvé' });
    res.json(product);
  });

  router.get('/:id/related', async (req, res) => {
    const p = await db.get('SELECT category FROM products WHERE id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Pas trouvé' });
    const related = await db.all('SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4', [p.category, req.params.id]);
    res.json({ related });
  });

  router.get('/:id/reviews', async (req, res) => {
    const reviews = await db.all('SELECT r.*, u.username FROM product_reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC', [req.params.id]);
    res.json({ reviews });
  });

  router.post('/:id/reviews', authRequired, async (req, res) => {
    const { rating, comment } = req.body;
    const user = (req as any).user;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Note 1-5 requise" });
    await db.run('INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)', [req.params.id, user.id, rating, comment]);
    res.json({ success: true });
  });

  return router;
}

export function userActionsRoutes(db: any) {
  const router = Router();

  router.put('/profile', authRequired, async (req, res) => {
    const user = (req as any).user;
    const { username, phone, address } = req.body;
    try {
      await db.run('UPDATE users SET username = ?, phone = ?, address = ? WHERE id = ?', [username, phone, address, user.id]);
      const updated = await db.get('SELECT id, username, email, role, phone, address FROM users WHERE id = ?', [user.id]);
      res.json({ success: true, user: updated });
    } catch { res.status(500).json({ error: "Erreur de mise à jour" }); }
  });

  router.get('/orders', authRequired, async (req, res) => {
    const user = (req as any).user;
    const ordersData = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [user.id]);
    res.json({ orders: ordersData.map((o: any) => ({ ...o, items: JSON.parse(o.items_json || '[]'), customer: JSON.parse(o.customer_json || '{}') })) });
  });

  router.get('/wishlist', authRequired, async (req, res) => {
    const user = (req as any).user;
    const wishlist = await db.all('SELECT p.* FROM wishlists w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?', [user.id]);
    res.json({ wishlist });
  });

  router.post('/wishlist/toggle', authRequired, async (req, res) => {
    const { product_id } = req.body;
    const user = (req as any).user;
    const existing = await db.get('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', [user.id, product_id]);
    if (existing) {
      await db.run('DELETE FROM wishlists WHERE id = ?', [existing.id]);
      res.json({ action: 'removed' });
    } else {
      await db.run('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [user.id, product_id]);
      res.json({ action: 'added' });
    }
  });

  return router;
}
