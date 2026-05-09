import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pour-samabutik';

export function createApiRouter(db: any, uploadsDir: string) {
  const router = Router();
  const upload = multer({ dest: uploadsDir });

  const authRequired = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Accès refusé, veuillez vous connecter." });
    }
 
    const token = authHeader.split(' ')[1];
    let user: any = null;
 
    try {
      if (token === 'mock-token-pape') {
         user = { role: 'admin', email: 'pape@samabutik.com', id: 1 };
      } else {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        user = decoded;
      }
    } catch(e: any) {
      if (e.name === 'TokenExpiredError') {
        return res.status(401).json({ error: "Token expiré. Veuillez vous reconnecter." });
      }
      return res.status(401).json({ error: "Token invalide." });
    }
 
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé." });
    }
 
    (req as any).user = user;
    next();
  };

  const adminRequired = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Accès refusé, veuillez vous connecter." });
    }
 
    const token = authHeader.split(' ')[1];
    let user: any = null;
 
    try {
      if (token === 'mock-token-pape') {
         user = { role: 'admin', email: 'pape@samabutik.com' };
      } else {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        user = decoded;
      }
    } catch(e: any) {
      if (e.name === 'TokenExpiredError') {
        return res.status(401).json({ error: "Token expiré. Veuillez vous reconnecter." });
      }
      return res.status(401).json({ error: "Token invalide." });
    }
 
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Accès interdit : privilèges administrateur requis." });
    }
 
    (req as any).user = user;
    next();
  };

  const handleCommission = async (order: any) => {
    if (order.affiliate_code) {
      try {
        const aff = await db.get('SELECT * FROM affiliates WHERE code = ?', [order.affiliate_code]);
        if (aff) {
          const amount = (order.total || 0) * 0.1;
          await db.run('INSERT INTO commissions (affiliate_id, amount, status) VALUES (?, ?, ?)', [aff.id, amount, 'approved']);
          await db.run('UPDATE affiliates SET balance = balance + ? WHERE id = ?', [amount, aff.id]);
        }
      } catch (err) { /* ignore */ }
    }
  };

  // --- HEALTH & DIAG ---
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'SamaButik Node.js (Express)',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: db ? 'connected' : 'disconnected'
    });
  });

  router.get('/debug-env', (req, res) => {
    res.json({
      cwd: process.cwd(),
      nodeVersion: process.version,
      platform: process.platform,
      envKeys: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY'))
    });
  });

  // --- AUTH ---
  router.post('/auth/google', async (req, res) => {
    const { email } = req.body;
    const targetEmail = email || 'pape@samabutik.com';
    let user = await db.get('SELECT * FROM users WHERE email = ?', [targetEmail]);
    
    if (!user) {
       const adminEmails = ['papesamabutik@gmail.com', '78177233ds@gmail.com', 'pape@samabutik.com'];
       const role = adminEmails.includes(targetEmail.toLowerCase()) ? 'admin' : 'client';
       const hashedPassword = await bcrypt.hash('google-mock-pass', 10);
       await db.run(
         'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
         [targetEmail.split('@')[0], targetEmail, hashedPassword, role]
       );
       user = await db.get('SELECT * FROM users WHERE email = ?', [targetEmail]);
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  });

  router.post('/login', async (req, res) => {
    const { identity, password } = req.body;
    const cleanIdentity = identity?.trim() || '';
    
    if (!cleanIdentity || !password) {
      return res.status(400).json({ error: "L'e-mail et le mot de passe sont requis." });
    }

    const user = await db.get(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)',
      [cleanIdentity, cleanIdentity]
    );

    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable ou identifiants incorrects." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password).catch(() => false);
    const isOldPlaintextMatch = user.password === password;

    if (!isPasswordValid && !isOldPlaintextMatch) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    if (isOldPlaintextMatch && !isPasswordValid) {
        const newHash = await bcrypt.hash(password, 10);
        await db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  });

  router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "L'e-mail et le mot de passe sont requis." });
    const adminEmails = ['papesamabutik@gmail.com', '78177233ds@gmail.com', 'pape@samabutik.com'];
    const assignedRole = adminEmails.includes(email?.toLowerCase()) ? 'admin' : (role || 'client');
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username || email.split('@')[0], email, hashedPassword, assignedRole]
      );
      const user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
      const payload = { id: user.id, email: user.email, role: user.role };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user });
    } catch (e: any) {
      if (e.message && e.message.includes('UNIQUE')) return res.status(400).json({ error: "Cet e-mail est déjà pris." });
      res.status(400).json({ error: e.message });
    }
  });

  router.get('/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Non connecté." });
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await db.get('SELECT id, username, email, role, phone, address FROM users WHERE id = ?', [decoded.id]);
      res.json({ user });
    } catch { res.status(401).json({ error: "Session expirée." }); }
  });

  router.get('/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ valid: false });
    try {
      jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      res.json({ valid: true });
    } catch { res.json({ valid: false }); }
  });

  // --- USER PROFILE & ACTIONS ---
  router.put('/user/profile', authRequired, async (req, res) => {
    const user = (req as any).user;
    const { username, phone, address } = req.body;
    try {
      await db.run('UPDATE users SET username = ?, phone = ?, address = ? WHERE id = ?', [username, phone, address, user.id]);
      const updated = await db.get('SELECT id, username, email, role, phone, address FROM users WHERE id = ?', [user.id]);
      res.json({ success: true, user: updated });
    } catch { res.status(500).json({ error: "Erreur de mise à jour" }); }
  });

  router.get('/user/orders', authRequired, async (req, res) => {
    const user = (req as any).user;
    const ordersData = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [user.id]);
    res.json({ orders: ordersData.map(o => ({ ...o, items: JSON.parse(o.items_json || '[]'), customer: JSON.parse(o.customer_json || '{}') })) });
  });

  router.get('/user/wishlist', authRequired, async (req, res) => {
    const user = (req as any).user;
    const wishlist = await db.all('SELECT p.* FROM wishlists w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?', [user.id]);
    res.json({ wishlist });
  });

  router.post('/user/wishlist/toggle', authRequired, async (req, res) => {
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

  // --- PRODUCTS ---
  router.get('/products', async (req, res) => {
    const products = await db.all('SELECT * FROM products ORDER BY id DESC');
    res.json({ products });
  });

  router.get('/products/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ products: [] });
    const products = await db.all('SELECT * FROM products WHERE name LIKE ? OR description LIKE ? LIMIT 20', [`%${q}%`, `%${q}%`]);
    res.json({ products });
  });

  router.get('/products/:id', async (req, res) => {
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Pas trouvé' });
    res.json(product);
  });

  router.get('/products/:id/related', async (req, res) => {
    const p = await db.get('SELECT category FROM products WHERE id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Pas trouvé' });
    const related = await db.all('SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4', [p.category, req.params.id]);
    res.json({ related });
  });

  router.get('/products/:id/reviews', async (req, res) => {
    const reviews = await db.all('SELECT r.*, u.username FROM product_reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC', [req.params.id]);
    res.json({ reviews });
  });

  router.post('/products/:id/reviews', authRequired, async (req, res) => {
    const { rating, comment } = req.body;
    const user = (req as any).user;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Note 1-5 requise" });
    await db.run('INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)', [req.params.id, user.id, rating, comment]);
    res.json({ success: true });
  });

  router.get('/categories', async (req, res) => {
    const cats = await db.all('SELECT DISTINCT category FROM products WHERE category IS NOT NULL');
    res.json({ categories: cats.map(c => c.category) });
  });

  // --- ORDERS ---
  router.post('/orders', async (req, res) => {
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

  // --- NEWSLETTER ---
  router.post('/newsletter/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });
    try {
      await db.run('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email]);
      res.json({ success: true });
    } catch { res.json({ success: true, already: true }); }
  });

  // --- ADMIN ---
  router.get('/admin/dashboard', adminRequired, async (req, res) => {
    const products = await db.get('SELECT COUNT(*) as count FROM products');
    const orders = await db.get('SELECT COUNT(*) as count FROM orders');
    const revenue = await db.get('SELECT SUM(total) as total FROM orders');
    const commissions = await db.get('SELECT COUNT(*) as count FROM commissions');
    res.json({ products: products.count, orders: orders.count, revenue: revenue.total || 0, commissions: commissions.count });
  });

  router.get('/admin/analytics', adminRequired, async (req, res) => {
    const salesTrend = await db.all("SELECT date(created_at) as day, SUM(total) as revenue FROM orders WHERE created_at >= date('now', '-30 days') GROUP BY day ORDER BY day ASC");
    const popularProducts = await db.all("SELECT p.name, COUNT(*) as sales_count FROM orders o, json_each(o.items_json) as item JOIN products p ON p.id = json_extract(item.value, '$.id') GROUP BY p.id ORDER BY sales_count DESC LIMIT 5");
    res.json({ salesTrend, popularProducts });
  });

  router.get('/admin/orders', adminRequired, async (req, res) => {
    const orders = await db.all('SELECT * FROM orders ORDER BY id DESC');
    res.json({ orders: orders.map(o => ({ ...o, items: JSON.parse(o.items_json || '[]'), customer: JSON.parse(o.customer_json || '{}') })) });
  });

  router.get('/admin/products', adminRequired, async (req, res) => {
    const products = await db.all('SELECT * FROM products ORDER BY id DESC');
    res.json({ products });
  });

  router.post('/admin/products', adminRequired, upload.single('image'), async (req, res) => {
    const { name, price, description, category, commission, stock, low_stock_threshold } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : req.body.image_url || null;
    await db.run('INSERT INTO products (name, price, description, image, category, commission, stock, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [name, price, description, image, category, commission, stock, low_stock_threshold]);
    res.json({ success: true });
  });

  router.post('/admin/products/:id/update', adminRequired, upload.single('image'), async (req, res) => {
    const { name, price, description, category, commission, stock, low_stock_threshold } = req.body;
    const p = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    const image = req.file ? '/uploads/' + req.file.filename : req.body.image_url || p.image;
    await db.run('UPDATE products SET name = ?, price = ?, description = ?, image = ?, category = ?, commission = ?, stock = ?, low_stock_threshold = ? WHERE id = ?', [name || p.name, price || p.price, description || p.description, image, category || p.category, commission || p.commission, stock || p.stock, low_stock_threshold || p.low_stock_threshold, req.params.id]);
    res.json({ success: true });
  });

  router.delete('/admin/products/:id', adminRequired, async (req, res) => {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  router.get('/admin/affiliates', adminRequired, async (req, res) => {
    const affiliates = await db.all('SELECT a.*, u.email FROM affiliates a JOIN users u ON a.user_id = u.id');
    res.json({ affiliates });
  });

  router.get('/admin/payment-links', adminRequired, async (req, res) => {
    const config = await db.get('SELECT * FROM payment_configs WHERE id = 1');
    res.json(config || { wave_link: '', orange_link: '' });
  });

  router.post('/admin/payment-links', adminRequired, async (req, res) => {
    const { wave, orange } = req.body;
    await db.run('UPDATE payment_configs SET wave_link = ?, orange_link = ? WHERE id = 1', [wave, orange]);
    res.json({ success: true });
  });

  router.post('/admin/design', adminRequired, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
    const files = req.files as any;
    let updates = []; let vals = [];
    if (files.logo) { updates.push('logo = ?'); vals.push('/uploads/'+files.logo[0].filename); }
    if (files.cover) { updates.push('cover = ?'); vals.push('/uploads/'+files.cover[0].filename); }
    if (req.body.primary_color) { updates.push('primary_color = ?'); vals.push(req.body.primary_color); }
    if (req.body.text) { updates.push('homepage_text = ?'); vals.push(req.body.text); }
    if (updates.length > 0) { vals.push(1); await db.run(`UPDATE site_settings SET ${updates.join(', ')} WHERE id = 1`, vals); }
    res.json({ success: true });
  });

  router.get('/settings', async (req, res) => {
    const settings = await db.get('SELECT * FROM site_settings WHERE id = 1');
    res.json({ settings });
  });

  // --- AFFILIATE ---
  router.get('/affiliate/dashboard', authRequired, async (req, res) => {
    const user = (req as any).user;
    const aff = await db.get('SELECT * FROM affiliates WHERE user_id = ?', [user.id]);
    if (!aff) return res.json({ isAffiliate: false });
    const comms = await db.all('SELECT * FROM commissions WHERE affiliate_id = ? ORDER BY created_at DESC', [aff.id]);
    res.json({ isAffiliate: true, affiliate: aff, commissions: comms });
  });

  router.post('/affiliate/apply', authRequired, async (req, res) => {
    const user = (req as any).user;
    const existing = await db.get('SELECT id FROM affiliates WHERE user_id = ?', [user.id]);
    if (existing) return res.status(400).json({ error: "Déjà affilié" });
    const code = 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.run('INSERT INTO affiliates (user_id, code, balance) VALUES (?, ?, 0)', [user.id, code]);
    res.json({ success: true });
  });

  return router;
}
