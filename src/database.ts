import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function initDb() {
  const db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'client',
      is_staff BOOLEAN DEFAULT 0,
      is_superuser BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      description TEXT,
      image TEXT,
      category TEXT,
      commission REAL,
      stock INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS payment_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wave_link TEXT,
      orange_link TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      price REAL,
      total REAL,
      status TEXT DEFAULT 'pending',
      method TEXT,
      delivery_status TEXT DEFAULT 'not shipped',
      transaction_id TEXT,
      affiliate_code TEXT,
      customer_json TEXT,
      items_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS affiliates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      code TEXT UNIQUE,
      balance REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      affiliate_id INTEGER,
      amount REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (affiliate_id) REFERENCES affiliates (id)
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      logo TEXT,
      cover TEXT,
      description TEXT DEFAULT 'Bienvenue',
      primary_color TEXT DEFAULT '#8B4513',
      font TEXT DEFAULT 'Poppins',
      secondary_color TEXT DEFAULT '#D4A373',
      homepage_text TEXT DEFAULT 'Bienvenue'
    );
  `);

  // Safe table migrations for existing installs
  try {
    const productsInfo = await db.all("PRAGMA table_info(products)");
    const productsCols = productsInfo.map(c => (c as any).name);
    if (!productsCols.includes('category')) await db.run('ALTER TABLE products ADD COLUMN category TEXT');
    if (!productsCols.includes('commission')) await db.run('ALTER TABLE products ADD COLUMN commission REAL');
    if (!productsCols.includes('stock')) await db.run('ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0');
    if (!productsCols.includes('low_stock_threshold')) await db.run('ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 5');

    const ordersInfo = await db.all("PRAGMA table_info(orders)");
    const ordersCols = ordersInfo.map(c => (c as any).name);
    if (!ordersCols.includes('total')) await db.run('ALTER TABLE orders ADD COLUMN total REAL');
    if (!ordersCols.includes('method')) await db.run('ALTER TABLE orders ADD COLUMN method TEXT');
    if (!ordersCols.includes('customer_json')) await db.run('ALTER TABLE orders ADD COLUMN customer_json TEXT');
    if (!ordersCols.includes('items_json')) await db.run('ALTER TABLE orders ADD COLUMN items_json TEXT');
    if (!ordersCols.includes('created_at')) await db.run('ALTER TABLE orders ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    if (!ordersCols.includes('affiliate_code')) await db.run('ALTER TABLE orders ADD COLUMN affiliate_code TEXT');

    const commissionsInfo = await db.all("PRAGMA table_info(commissions)");
    const commissionsCols = commissionsInfo.map(c => (c as any).name);
    if (!commissionsCols.includes('created_at')) await db.run('ALTER TABLE commissions ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
  } catch (err) {
    console.warn("Migration warning:", err);
  }

  // Insert Admin
  const admins = [
    { email: 'pape@samabutik.com', username: 'Pape', password: process.env.ADMIN_PASSWORD || 'Pape221' },
    { email: 'papesamabutik@gmail.com', username: 'PapeOld', password: process.env.ADMIN_PASSWORD || 'Pape221' },
    { email: '78177233ds@gmail.com', username: '78177233ds', password: process.env.ADMIN_PASSWORD || 'Pape221' }
  ];
  
  for (const admin of admins) {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [admin.email]);
    if (!user) {
      await db.run(
        'INSERT INTO users (username, email, password, role, is_staff, is_superuser) VALUES (?, ?, ?, ?, ?, ?)',
        [admin.username, admin.email, admin.password, 'admin', 1, 1]
      );
    } else {
      // Ensure role and username are correct even if already exists
      await db.run(
        'UPDATE users SET username = ?, role = "admin", is_staff = 1, is_superuser = 1, password = ? WHERE email = ?', 
        [admin.username, admin.password, admin.email]
      );
    }
  }

  // Insert Default Setting/Payment Config 
  const pConf = await db.get('SELECT id FROM payment_configs WHERE id = 1');
  if (!pConf) {
    await db.run('INSERT INTO payment_configs (id, wave_link, orange_link) VALUES (1, "", "")');
  }

  const sConf = await db.get('SELECT id FROM site_settings WHERE id = 1');
  if (!sConf) {
    await db.run('INSERT INTO site_settings (id) VALUES (1)');
  }

  return db;
}
