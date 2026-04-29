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
      image TEXT
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
      status TEXT DEFAULT 'pending',
      delivery_status TEXT DEFAULT 'not shipped',
      transaction_id TEXT,
      affiliate_code TEXT,
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
      FOREIGN KEY (affiliate_id) REFERENCES affiliates (id)
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      logo TEXT,
      cover TEXT,
      description TEXT DEFAULT 'Bienvenue',
      primary_color TEXT DEFAULT '#8B4513',
      font TEXT DEFAULT 'Poppins'
    );
  `);

  // Insert Admin
  const admin = await db.get('SELECT * FROM users WHERE username = ?', ['Pape']);
  if (!admin) {
    await db.run(
      'INSERT INTO users (username, email, password, role, is_staff, is_superuser) VALUES (?, ?, ?, ?, ?, ?)',
      ['Pape', 'papesamabutik@gmail.com', 'Pape221', 'admin', 1, 1]
    );
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
