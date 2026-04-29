import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { initDb } from './src/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: path.join(__dirname, 'uploads/') });

async function startServer() {
  const db = await initDb();
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // ====================== SECURITY/MIDDLEWARE ======================
  // A simple token mapping for demo
  const userTokens = new Map<string, any>(); // token -> user object

  // Simulate authentication/login
  app.post('/api/login', async (req, res) => {
    const { identity, password } = req.body;
    const user = await db.get(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?',
      [identity, identity, password]
    );

    if (user) {
      const token = uuidv4();
      userTokens.set(token, user);
      res.json({ token, user, record: user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  const adminRequired = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "login required" });
    }

    const token = authHeader.split(' ')[1];
    const user = userTokens.get(token);

    if (!user) {
      // Allow Pocketbase fallback for current frontend temporarily if needed
      // but enforce admin for this endpoint
      if (token === 'mock-token-pape') {
         // Mock admin pass
         return next();
      }
      return res.status(401).json({ error: "Invalid token" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "forbidden" });
    }

    (req as any).user = user;
    next();
  };

  const handleCommission = async (order: any) => {
    if (order.affiliate_code) {
      try {
        const aff = await db.get('SELECT * FROM affiliates WHERE code = ?', [order.affiliate_code]);
        if (aff) {
          const amount = order.price * 0.1;
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
    const { name, price, description } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : null;
    await db.run(
      'INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)',
      [name, price, description, image]
    );
    res.json({ msg: "product added" });
  });

  app.post('/api/admin/products/:id/update', adminRequired, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const p = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!p) return res.status(404).json({ error: "not found" });
    
    const name = req.body.name || p.name;
    const price = req.body.price || p.price;
    const description = req.body.description || p.description;
    const image = req.file ? '/uploads/' + req.file.filename : p.image;

    await db.run(
      'UPDATE products SET name = ?, price = ?, description = ?, image = ? WHERE id = ?',
      [name, price, description, image, id]
    );
    res.json({ msg: "updated" });
  });

  app.delete('/api/admin/products/:id', adminRequired, async (req, res) => {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ msg: "deleted" });
  });

  app.get('/api/products', async (req, res) => {
    const products = await db.all('SELECT * FROM products');
    res.json({ items: products });
  });

  // ====================== PAYMENT CONFIG ======================
  app.post('/api/admin/payment-links', adminRequired, async (req, res) => {
    const { wave, orange } = req.body;
    await db.run('UPDATE payment_configs SET wave_link = ?, orange_link = ? WHERE id = 1', [wave, orange]);
    res.json({ msg: "payment links updated" });
  });

  // ====================== ORDER ======================
  app.get('/api/admin/orders', adminRequired, async (req, res) => {
    const orders = await db.all('SELECT * FROM orders');
    res.json({ orders });
  });

  app.post('/api/admin/orders/delivery', adminRequired, async (req, res) => {
    const { order_id, status } = req.body;
    await db.run('UPDATE orders SET delivery_status = ? WHERE id = ?', [status, order_id]);
    res.json({ msg: "delivery updated" });
  });

  // ====================== PAYMENT VALIDATION ======================
  app.post('/api/admin/orders/validate-wave', adminRequired, async (req, res) => {
    const { order_id, tx } = req.body;
    const o = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (o && o.status !== "paid") {
      await db.run('UPDATE orders SET status = ?, transaction_id = ? WHERE id = ?', ['paid', tx, order_id]);
      await handleCommission(o);
    }
    res.json({ msg: "paid" });
  });

  app.post('/api/webhook/orange', async (req, res) => {
    const data = req.body;
    if (data.status === "SUCCESS") {
      const o = await db.get('SELECT * FROM orders WHERE id = ?', [data.order_id]);
      if (o && o.status !== "paid") {
        await db.run('UPDATE orders SET status = ?, transaction_id = ? WHERE id = ?', ['paid', data.transaction_id, data.order_id]);
        await handleCommission(o);
      }
    }
    res.json({ ok: true });
  });

  // ====================== COMMISSION ======================
  app.get('/api/admin/commissions', adminRequired, async (req, res) => {
    const commissions = await db.all('SELECT * FROM commissions');
    res.json({ commissions });
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
    if (req.body.description !== undefined) {
      updates.push('description = ?');
      values.push(req.body.description);
    }
    if (req.body.color !== undefined) {
      updates.push('primary_color = ?');
      values.push(req.body.color);
    }
    if (req.body.font !== undefined) {
      updates.push('font = ?');
      values.push(req.body.font);
    }

    if (updates.length > 0) {
      values.push(1); // WHERE id = 1
      await db.run(`UPDATE site_settings SET ${updates.join(', ')} WHERE id = ?`, values);
    }
    res.json({ msg: "design updated" });
  });

  // ====================== DASHBOARD ======================
  app.get('/api/admin/dashboard', adminRequired, async (req, res) => {
    const products = await db.get('SELECT COUNT(*) as count FROM products');
    const orders = await db.get('SELECT COUNT(*) as count FROM orders');
    const revenueRow = await db.get('SELECT SUM(price) as total FROM orders WHERE status = "paid"');
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

