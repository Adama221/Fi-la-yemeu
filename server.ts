import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { initDb } from './src/database.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: path.join(__dirname, 'uploads/') });

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pour-samabutik';

async function startServer() {
  const db = await initDb();
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.post('/api/auth/google', async (req, res) => {
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

  app.post('/api/login', async (req, res) => {
    const { identity, password } = req.body;
    
    if (!identity || !password) {
      return res.status(400).json({ error: "L'e-mail et le mot de passe sont requis." });
    }

    const user = await db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [identity, identity]
    );

    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable ou identifiants incorrects." });
    }

    // Check if the hashed password matches (fallback to plain text check if not hashed yet to support older records)
    const isPasswordValid = await bcrypt.compare(password, user.password).catch(() => false);
    const isOldPlaintextMatch = user.password === password;

    if (!isPasswordValid && !isOldPlaintextMatch) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    // If it was a plaintext match from an old database record, update it to hashed
    if (isOldPlaintextMatch && !isPasswordValid) {
        const newHash = await bcrypt.hash(password, 10);
        await db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user, record: user });
  });

  app.post('/api/register', async (req, res) => {
    const { username, email, password, name, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "L'e-mail et le mot de passe sont requis." });
    }
    
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
      if (e.message && e.message.includes('UNIQUE constraint failed')) {
         return res.status(400).json({ error: "Cet e-mail ou nom d'utilisateur est déjà pris." });
      }
      res.status(400).json({ error: e.message });
    }
  });

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
      } catch (err) {
        // pass
      }
    }
  };

  // ====================== PRODUCT ======================
  app.post('/api/admin/products', adminRequired, upload.single('image'), async (req, res) => {
    const { name, price, description, category, commission, stock, low_stock_threshold } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : req.body.image_url || null;
    const result = await db.run(
      'INSERT INTO products (name, price, description, image, category, commission, stock, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, Number(price), description, image, category, Number(commission), Number(stock || 0), Number(low_stock_threshold || 5)]
    );
    res.json({ 
      message: "Produit ajouté avec succès",
      product: {
        id: result.lastID,
        name,
        price: Number(price),
        image,
        stock: Number(stock || 0),
        low_stock_threshold: Number(low_stock_threshold || 5)
      }
    });
  });

  app.post('/api/admin/products/:id/update', adminRequired, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const p = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!p) return res.status(404).json({ error: "not found" });
    
    const name = req.body.name || p.name;
    const price = Number(req.body.price || p.price);
    const description = req.body.description || p.description;
    const category = req.body.category || p.category;
    const commission = Number(req.body.commission || p.commission);
    const stock = req.body.stock !== undefined ? Number(req.body.stock) : p.stock;
    const low_stock_threshold = req.body.low_stock_threshold !== undefined ? Number(req.body.low_stock_threshold) : p.low_stock_threshold;
    const image = req.file ? '/uploads/' + req.file.filename : req.body.image_url || p.image;

    await db.run(
      'UPDATE products SET name = ?, price = ?, description = ?, image = ?, category = ?, commission = ?, stock = ?, low_stock_threshold = ? WHERE id = ?',
      [name, price, description, image, category, commission, stock, low_stock_threshold, id]
    );
    res.json({ msg: "updated" });
  });

  app.delete('/api/admin/products/:id', adminRequired, async (req, res) => {
    const { id } = req.params;
    console.log(`DELETE request for product ID: ${id}`);
    try {
      const result = await db.run('DELETE FROM products WHERE id = ?', [id]);
      console.log(`Delete result: ${JSON.stringify(result)}`);
      res.json({ msg: "deleted", id });
    } catch (err: any) {
      console.error(`Error deleting product ${id}:`, err);
      res.status(500).json({ error: "Database error", details: err.message });
    }
  });

  app.get('/api/products', async (req, res) => {
    const products = await db.all('SELECT * FROM products ORDER BY id DESC');
    res.json({ products: products });
  });

  app.get('/api/products/:id', async (req, res) => {
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'not found' });
    res.json(product);
  });

  // ====================== PAYMENT CONFIG ======================
  app.get('/api/admin/payment-links', adminRequired, async (req, res) => {
    const config = await db.get('SELECT * FROM payment_configs WHERE id = 1');
    res.json(config || { wave_link: '', orange_link: '' });
  });

  app.post('/api/admin/payment-links', adminRequired, async (req, res) => {
    const { wave, orange } = req.body;
    await db.run('UPDATE payment_configs SET wave_link = ?, orange_link = ? WHERE id = 1', [wave, orange]);
    res.json({ msg: "payment links updated" });
  });

  // ====================== ORDER ======================
  app.post('/api/orders', async (req, res) => {
    const { total, status, method, items, customer, affiliate_code } = req.body;
    try {
      await db.run('BEGIN TRANSACTION');
      const result = await db.run(
        'INSERT INTO orders (total, status, method, items_json, customer_json, affiliate_code) VALUES (?, ?, ?, ?, ?, ?)', 
        [total, status, method, JSON.stringify(items), JSON.stringify(customer), affiliate_code || null]
      );

      // Decrement stock for each ordered item
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.id && item.quantity) {
             const product = await db.get('SELECT stock FROM products WHERE id = ?', [item.id]);
             if (product) {
                 const newStock = Math.max(0, product.stock - item.quantity);
                 await db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, item.id]);
             }
          }
        }
      }

      await db.run('COMMIT');
      res.json({ id: result.lastID, msg: "order created" });
    } catch(err) {
      await db.run('ROLLBACK').catch(() => {});
      console.error(err);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get('/api/admin/orders', adminRequired, async (req, res) => {
    const ordersData = await db.all('SELECT * FROM orders ORDER BY id DESC');
    const orders = ordersData.map(o => ({
       ...o,
       items: JSON.parse(o.items_json || '[]'),
       customer: JSON.parse(o.customer_json || '{}')
    }));
    res.json({ orders });
  });

  app.post('/api/admin/orders/delivery', adminRequired, async (req, res) => {
    const { order_id, status } = req.body;
    await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, order_id]);
    
    // If setting to EFFECTUÉ, maybe trigger commissions if not already paid?
    // But since admin is manually setting it, we'll just update the status field.
    res.json({ msg: "status updated" });
  });

  // ====================== PAYMENT VALIDATION ======================
  app.post('/api/admin/orders/validate-wave-payment', adminRequired, async (req, res) => {
    const { order_id, transaction_id } = req.body;
    const o = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);
    
    if (!o) return res.status(404).json({ error: "Order not found" });

    if (o.status === "paid") {
      return res.status(400).json({ error: "Déjà payé" });
    }

    await db.run('UPDATE orders SET status = ?, transaction_id = ? WHERE id = ?', ['paid', transaction_id, order_id]);
    await handleCommission(o);
    
    res.json({ message: "Paiement validé" });
  });

  app.post('/api/pay/orange', async (req, res) => {
    const { amount, orderId } = req.body;
    // Mock Orange Money payment URL generation
    res.json({ 
      payment_url: `/success?orderId=${orderId}&amount=${amount}&method=orange`,
      msg: "Mock orange payment initiated" 
    });
  });

  app.post('/api/webhook/orange', async (req, res) => {
    const data = req.body;
    const order_id = data.order_id;
    const status = data.status;

    if (status === "SUCCESS") {
      const o = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);
      if (o && o.status !== "paid") {
        await db.run('UPDATE orders SET status = ?, transaction_id = ? WHERE id = ?', ['paid', data.transaction_id, order_id]);
        await handleCommission(o);
      }
    }
    res.json({ ok: true });
  });

  // ====================== COMMISSIONS / AFFILIATES ======================
  app.get('/api/admin/affiliates', adminRequired, async (req, res) => {
    try {
      const affiliates = await db.all(`
        SELECT a.*, u.email 
        FROM affiliates a 
        JOIN users u ON a.user_id = u.id
      `);
      res.json({ affiliates: affiliates || [] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/commissions', adminRequired, async (req, res) => {
    const commissions = await db.all('SELECT * FROM commissions');
    res.json({ commissions });
  });

  // Client Affiliate Routes
  app.get('/api/affiliate/dashboard', authRequired, async (req, res) => {
    try {
      const user = (req as any).user;
      let affiliate = await db.get('SELECT * FROM affiliates WHERE user_id = ?', [user.id]);
      
      if (!affiliate) {
         return res.json({ isAffiliate: false });
      }

      const commissions = await db.all('SELECT * FROM commissions WHERE affiliate_id = ? ORDER BY created_at DESC', [affiliate.id]);
      
      res.json({
        isAffiliate: true,
        affiliate,
        commissions
      });
    } catch (error) {
      console.error('Affiliate Dashboard Error:', error);
      res.status(500).json({ error: 'Intrenal server error' });
    }
  });

  app.post('/api/affiliate/apply', authRequired, async (req, res) => {
    try {
      const user = (req as any).user;
      let affiliate = await db.get('SELECT * FROM affiliates WHERE user_id = ?', [user.id]);
      
      if (affiliate) {
        return res.status(400).json({ error: 'Vous êtes déjà affilié.' });
      }

      const code = 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const result = await db.run(
        'INSERT INTO affiliates (user_id, code, balance) VALUES (?, ?, 0)',
        [user.id, code]
      );
      
      affiliate = await db.get('SELECT * FROM affiliates WHERE id = ?', [result.lastID]);
      res.json({ success: true, affiliate });
    } catch(err) {
      console.error('Affiliate Apply Error:', err);
      res.status(500).json({ error: 'Failed to create affiliate account' });
    }
  });

  // ====================== DESIGN ======================
  app.post('/api/admin/design', adminRequired, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let updates: string[] = [];
    let values: any[] = [];

    if (files.logo) {
      updates.push('logo = ?');
      values.push('/uploads/' + files.logo[0].filename);
    }
    if (files.cover) {
      updates.push('cover = ?');
      values.push('/uploads/' + files.cover[0].filename);
    }
    if (req.body.primary_color !== undefined) {
      updates.push('primary_color = ?');
      values.push(req.body.primary_color);
    } else if (req.body.color !== undefined) {
      updates.push('primary_color = ?');
      values.push(req.body.color);
    }
    
    if (req.body.secondary_color !== undefined) {
      updates.push('secondary_color = ?');
      values.push(req.body.secondary_color);
    }
    if (req.body.text !== undefined) {
      updates.push('homepage_text = ?');
      values.push(req.body.text);
    }
    
    if (req.body.description !== undefined) {
      updates.push('description = ?');
      values.push(req.body.description);
    }
    if (req.body.font !== undefined) {
      updates.push('font = ?');
      values.push(req.body.font);
    }

    if (updates.length > 0) {
      values.push(1); // WHERE id = 1
      await db.run(`UPDATE site_settings SET ${updates.join(', ')} WHERE id = ?`, values);
    }
    res.json({ message: "Design modifié" });
  });

  app.get('/api/settings', async (req, res) => {
    const settings = await db.get('SELECT * FROM site_settings WHERE id = 1');
    res.json({ settings });
  });

  // ====================== DASHBOARD ======================
  app.get('/api/admin/dashboard', adminRequired, async (req, res) => {
    const products = await db.get('SELECT COUNT(*) as count FROM products');
    const orders = await db.get('SELECT COUNT(*) as count FROM orders');
    const revenueRow = await db.get('SELECT SUM(total) as total FROM orders');
    const commissions = await db.get('SELECT COUNT(*) as count FROM commissions');

    res.json({
      products: products.count,
      orders: orders.count,
      revenue: revenueRow.total || 0,
      commissions: commissions.count
    });
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

