import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-pour-samabutik';

export function authRoutes(dbProxy: any) {
  const router = Router();
  const db = dbProxy.firebase;
  const pg = dbProxy.pg;

  router.post('/auth/google', async (req, res) => {
    const { email } = req.body;
    const targetEmail = (email || 'pape@samabutik.com').toLowerCase();
    
    try {
      let user;
      if (dbProxy.isPostgres) {
        let { rows } = await pg.query('SELECT * FROM users WHERE email = $1', [targetEmail]);
        if (rows.length === 0) {
          const adminEmails = ['papesamabutik@gmail.com', '78177233ds@gmail.com', 'pape@samabutik.com'];
          const role = adminEmails.includes(targetEmail) ? 'admin' : 'client';
          const hashedPassword = await bcrypt.hash('google-mock-pass', 10);
          const result = await pg.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [targetEmail.split('@')[0], targetEmail, hashedPassword, role]
          );
          user = result.rows[0];
        } else {
          user = rows[0];
        }
      } else if (db) {
        const usersRef = db.collection('users');
        const snap = await usersRef.where('email', '==', targetEmail).limit(1).get();
        if (snap.empty) {
           const adminEmails = ['papesamabutik@gmail.com', '78177233ds@gmail.com', 'pape@samabutik.com'];
           const role = adminEmails.includes(targetEmail) ? 'admin' : 'client';
           const hashedPassword = await bcrypt.hash('google-mock-pass', 10);
           const docRef = await usersRef.add({
             username: targetEmail.split('@')[0],
             email: targetEmail,
             password: hashedPassword,
             role: role
           });
           const newSnap = await docRef.get();
           user = { id: newSnap.id, ...newSnap.data() };
        } else {
           const doc = snap.docs[0];
           user = { id: doc.id, ...doc.data() };
        }
      } else {
        return res.status(500).json({ error: 'No database available' });
      }

      const payload = { id: user.id || user.id.toString(), email: user.email, role: user.role };
      const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
      res.json({ token, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = email?.trim()?.toLowerCase() || '';
    
    if (!cleanEmail || !password) {
      return res.status(400).json({ error: "L'e-mail et le mot de passe sont requis." });
    }

    try {
      let user;
      if (dbProxy.isPostgres) {
        const { rows } = await pg.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
        if (rows.length === 0) return res.status(401).json({ error: "Utilisateur introuvable." });
        user = rows[0];
      } else if (db) {
        const snap = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
        if (snap.empty) return res.status(401).json({ error: "Utilisateur introuvable." });
        const doc = snap.docs[0];
        user = { id: doc.id, ...doc.data() };
      } else {
        return res.status(500).json({ error: 'No database available' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password).catch(() => false);
      if (!isPasswordValid) return res.status(401).json({ error: "Mot de passe incorrect." });

      const payload = { id: user.id.toString(), email: user.email, role: user.role };
      const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
      res.json({ token, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "L'e-mail et le mot de passe sont requis." });
    const lowerEmail = email.toLowerCase();
    const adminEmails = ['papesamabutik@gmail.com', '78177233ds@gmail.com', 'pape@samabutik.com'];
    const assignedRole = adminEmails.includes(lowerEmail) ? 'admin' : (role || 'client');
    
    try {
      let user;
      if (dbProxy.isPostgres) {
        const { rows: existing } = await pg.query('SELECT id FROM users WHERE email = $1', [lowerEmail]);
        if (existing.length > 0) return res.status(400).json({ error: "Cet e-mail est déjà pris." });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pg.query(
          'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
          [username || lowerEmail.split('@')[0], lowerEmail, hashedPassword, assignedRole]
        );
        user = result.rows[0];
      } else if (db) {
        const usersRef = db.collection('users');
        const existing = await usersRef.where('email', '==', lowerEmail).limit(1).get();
        if (!existing.empty) return res.status(400).json({ error: "Cet e-mail est déjà pris." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const docRef = await usersRef.add({
          username: username || lowerEmail.split('@')[0], 
          email: lowerEmail, 
          password: hashedPassword, 
          role: assignedRole
        });
        const newSnap = await docRef.get();
        user = { id: docRef.id, ...newSnap.data() };
      } else {
        return res.status(500).json({ error: 'No database available' });
      }

      const payload = { id: user.id.toString(), email: user.email, role: user.role };
      const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
      res.json({ token, user });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  router.get('/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Non connecté." });
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, SECRET_KEY) as any;
      
      let user;
      if (dbProxy.isPostgres) {
        const { rows } = await pg.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        if (rows.length === 0) throw new Error('Not found');
        user = rows[0];
      } else if (db) {
        const snap = await db.collection('users').doc(decoded.id).get();
        if (!snap.exists) throw new Error('Not found');
        user = { id: snap.id, ...snap.data() };
      } else {
        throw new Error('No database');
      }
      
      const { password, ...safeUser } = user as any;
      res.json({ user: safeUser });
    } catch { res.status(401).json({ error: "Session expirée." }); }
  });

  router.get('/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ valid: false });
    try {
      jwt.verify(authHeader.split(' ')[1], SECRET_KEY);
      res.json({ valid: true });
    } catch { res.json({ valid: false }); }
  });

  return router;
}
