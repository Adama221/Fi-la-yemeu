import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pour-samabutik';

export function authRoutes(db: any) {
  const router = Router();

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

  return router;
}
