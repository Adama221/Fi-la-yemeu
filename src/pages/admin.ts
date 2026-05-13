import { Router } from 'express';
import { adminRequired } from '../routes/middleware';
import multer from 'multer';

export function adminRoutes(db: any, uploadsDir: string) {
  const router = Router();
  const upload = multer({ dest: uploadsDir });

  router.get('/dashboard', adminRequired, async (req, res) => {
    const products = await db.get('SELECT COUNT(*) as count FROM products');
    const orders = await db.get('SELECT COUNT(*) as count FROM orders');
    const revenue = await db.get('SELECT SUM(total) as total FROM orders');
    const commissions = await db.get('SELECT COUNT(*) as count FROM commissions');
    res.json({ products: products.count, orders: orders.count, revenue: revenue.total || 0, commissions: commissions.count });
  });

  router.get('/analytics', adminRequired, async (req, res) => {
    const salesTrend = await db.all("SELECT date(created_at) as day, SUM(total) as revenue FROM orders WHERE created_at >= date('now', '-30 days') GROUP BY day ORDER BY day ASC");
    const popularProducts = await db.all("SELECT p.name, COUNT(*) as sales_count FROM orders o, json_each(o.items_json) as item JOIN products p ON p.id = json_extract(item.value, '$.id') GROUP BY p.id ORDER BY sales_count DESC LIMIT 5");
    res.json({ salesTrend, popularProducts });
  });

  router.get('/orders', adminRequired, async (req, res) => {
    const orders = await db.all('SELECT * FROM orders ORDER BY id DESC');
    res.json({ orders: orders.map((o: any) => ({ ...o, items: JSON.parse(o.items_json || '[]'), customer: JSON.parse(o.customer_json || '{}') })) });
  });

  router.get('/products', adminRequired, async (req, res) => {
    const products = await db.all('SELECT * FROM products ORDER BY id DESC');
    res.json({ products });
  });

  router.post('/products', adminRequired, upload.single('image'), async (req, res) => {
    const { name, price, description, category, commission, stock, low_stock_threshold } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : req.body.image_url || null;
    await db.run('INSERT INTO products (name, price, description, image, category, commission, stock, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [name, price, description, image, category, commission, stock, low_stock_threshold]);
    res.json({ success: true });
  });

  router.post('/products/:id/update', adminRequired, upload.single('image'), async (req, res) => {
    const { name, price, description, category, commission, stock, low_stock_threshold } = req.body;
    const p = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    const image = req.file ? '/uploads/' + req.file.filename : req.body.image_url || p.image;
    await db.run('UPDATE products SET name = ?, price = ?, description = ?, image = ?, category = ?, commission = ?, stock = ?, low_stock_threshold = ? WHERE id = ?', [name || p.name, price || p.price, description || p.description, image, category || p.category, commission || p.commission, stock || p.stock, low_stock_threshold || p.low_stock_threshold, req.params.id]);
    res.json({ success: true });
  });

  router.delete('/products/:id', adminRequired, async (req, res) => {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  router.get('/affiliates', adminRequired, async (req, res) => {
    const affiliates = await db.all('SELECT a.*, u.email FROM affiliates a JOIN users u ON a.user_id = u.id');
    res.json({ affiliates });
  });

  router.get('/payment-links', adminRequired, async (req, res) => {
    const config = await db.get('SELECT * FROM payment_configs WHERE id = 1');
    res.json(config || { wave_link: '', orange_link: '' });
  });

  router.post('/payment-links', adminRequired, async (req, res) => {
    const { wave, orange } = req.body;
    await db.run('UPDATE payment_configs SET wave_link = ?, orange_link = ? WHERE id = 1', [wave, orange]);
    res.json({ success: true });
  });

  router.post('/design', adminRequired, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
    const files = req.files as any;
    let updates = []; let vals = [];
    if (files && files.logo) { updates.push('logo = ?'); vals.push('/uploads/'+files.logo[0].filename); }
    else if (req.body.logo_url) { updates.push('logo = ?'); vals.push(req.body.logo_url); }
    
    if (files && files.cover) { updates.push('cover = ?'); vals.push('/uploads/'+files.cover[0].filename); }
    
    if (req.body.primary_color) { updates.push('primary_color = ?'); vals.push(req.body.primary_color); }
    if (req.body.secondary_color) { updates.push('secondary_color = ?'); vals.push(req.body.secondary_color); }
    if (req.body.text) { updates.push('homepage_text = ?'); vals.push(req.body.text); }
    
    if (updates.length > 0) { vals.push(1); await db.run(`UPDATE site_settings SET ${updates.join(', ')} WHERE id = 1`, vals); }
    res.json({ success: true });
  });

  return router;
}
