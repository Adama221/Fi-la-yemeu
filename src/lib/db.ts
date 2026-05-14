import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};

// Simple helper to mimic some firestore-like behavior if needed, 
// but we'll probably favor raw SQL for performance and clarity on Postgres.

export async function initPostgres() {
  if (!process.env.DATABASE_URL) return;

  console.log('[SamaButik] Initializing PostgreSQL schema...');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_staff BOOLEAN DEFAULT FALSE,
        is_superuser BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        description TEXT,
        image TEXT,
        category TEXT,
        commission DECIMAL(5, 2),
        stock INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total DECIMAL(12, 2) NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        shipping_address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Order items
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(12, 2) NOT NULL
      )
    `);

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      )
    `);

    await client.query('COMMIT');
    console.log('[SamaButik] PostgreSQL schema initialized.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[SamaButik] PostgreSQL init error:', e);
  } finally {
    client.release();
  }
}
