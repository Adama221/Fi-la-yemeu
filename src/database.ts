import { open } from 'sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';
import fs from 'fs';

export async function initDb() {
  const isReadOnlyEnv = !!process.env.K_SERVICE || !!process.env.VERCEL;
  console.log('[initDb] isReadOnlyEnv:', isReadOnlyEnv);
  
  const dataDir = isReadOnlyEnv ? '/tmp/data' : path.join(process.cwd(), 'data');
  console.log('[initDb] dataDir:', dataDir);
  
  if (!fs.existsSync(dataDir)) {
    console.log('[initDb] Creating dataDir...');
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'database.sqlite');
  console.log('[initDb] dbPath:', dbPath);
  
  if (isReadOnlyEnv) {
    const originalDbPath = path.join(process.cwd(), 'data', 'database.sqlite');
    console.log('[initDb] Checking originalDbPath:', originalDbPath);
    if (fs.existsSync(originalDbPath) && !fs.existsSync(dbPath)) {
      try {
        console.log('[initDb] Copying initial database...');
        fs.copyFileSync(originalDbPath, dbPath);
        console.log('Copied database to /tmp/data/database.sqlite for read-only environment');
      } catch (e) {
        console.error('Failed to copy initial database:', e);
      }
    }
  }
  
  let sqlite3;
  console.log('[initDb] Loading sqlite3 module...');
  try {
    const sqlite3Module = await import('sqlite3');
    sqlite3 = sqlite3Module.default || sqlite3Module;
    console.log('[initDb] sqlite3 module loaded, keys:', Object.keys(sqlite3));
    
    if (!sqlite3.Database) {
      // Fallback for some bundling environments
      if (sqlite3.verbose) {
        console.log('[initDb] Using sqlite3.verbose().Database');
        sqlite3 = sqlite3.verbose();
      }
    }
    
    if (!sqlite3.Database) {
      throw new Error("sqlite3.Database is undefined after loading.");
    }
  } catch (err: any) {
    console.error("Failed to load sqlite3 native module.", err);
    throw new Error(`Erreur de chargement du module SQLite: ${err.message}`);
  }

  let db;
  console.log('[initDb] Opening database...');
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('[initDb] Database opened');

    // Quick test query to verify integrity
    await db.get("PRAGMA schema_version");
    console.log('[initDb] PRAGMA check passed');
  } catch (err: any) {
    if (err.message && err.message.includes('SQLITE_CORRUPT')) {
      console.warn("Database is corrupt. Deleting and recreating...");
      try {
        fs.unlinkSync(dbPath);
      } catch (e) {
        // Ignorer si la suppression échoue (ex: fichier inexistant)
      }
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
    } else {
      throw err;
    }
  }

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

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      user_id INTEGER,
      rating INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
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
  const adminPassword = process.env.ADMIN_PASSWORD || 'Pape221';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  
  const admins = [
    { email: 'papesamabutik@gmail.com', username: 'Pape' },
    { email: 'pape@samabutik.com', username: 'PapeAdmin' },
    { email: '78177233ds@gmail.com', username: '78177233ds' }
  ];
  
  for (const admin of admins) {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [admin.email]);
    if (!user) {
      await db.run(
        'INSERT INTO users (username, email, password, role, is_staff, is_superuser) VALUES (?, ?, ?, ?, ?, ?)',
        [admin.username, admin.email, hashedAdminPassword, 'admin', 1, 1]
      );
    } else {
      // Ensure role and username are correct even if already exists
      // Force update password to ensure it matches current default
      const needsPasswordUpdate = true;
      
      if (needsPasswordUpdate || user.role !== 'admin') {
        await db.run(
          'UPDATE users SET username = ?, role = "admin", is_staff = 1, is_superuser = 1, password = ? WHERE email = ?', 
          [admin.username, hashedAdminPassword, admin.email]
        );
      }
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

  // Insert Default Products
  const prodCountRes = await db.get('SELECT COUNT(*) as count FROM products');
  if (prodCountRes && prodCountRes.count === 0) {
    await db.run('INSERT INTO products (name, price, description, image, category, commission, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Robe Éclat', 120000, 'Une robe élégante de soirée en soie', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80', 'Femme', 10, 15]
    );
    await db.run('INSERT INTO products (name, price, description, image, category, commission, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Costume Minuit', 250000, 'Costume trois pièces sur-mesure', 'https://images.unsplash.com/photo-1593030761756-1d8dd2a7e8bf?auto=format&fit=crop&q=80', 'Homme', 15, 5]
    );
    await db.run('INSERT INTO products (name, price, description, image, category, commission, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Sac Signature Noir', 85000, 'Sac à main en cuir véritable avec finitions dorées', 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80', 'Accessoires', 10, 8]
    );
    await db.run('INSERT INTO products (name, price, description, image, category, commission, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Veste d\'Automne', 145000, 'Veste légère et résistante pour la saison', 'https://plus.unsplash.com/premium_photo-1673356301535-224a0efcbdfc?auto=format&fit=crop&q=80', 'Femme', 12, 10]
    );
  }

  return db;
}
