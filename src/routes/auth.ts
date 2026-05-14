import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-pour-samabutik';

export function authRoutes(db: FirebaseFirestore.Firestore) {
  const router = Router();

  router.post('/auth/google', async (req, res) => {
    const { email } = req.body;
    const targetEmail = email || 'pape@samabutik.com';
    const usersRef = db.collection('users');
    const snap = await usersRef.where('email', '==', targetEmail).limit(1).get();
    
    let user;
    if (snap.empty) {
       const adminEmails = ['papesamabutik@gmail.com', '78177233ds@gmail.com', 'pape@samabutik.com'];
       const role = adminEmails.includes(targetEmail.toLowerCase()) ? 'admin' : 'client';
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

    const payload = { id: user.id, email: user.email, role: user.role };
    // google auth
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user });
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = email?.trim()?.toLowerCase() || '';
    
    if (!cleanEmail || !password) {
      return res.status(400).json({ error: "L'e-mail et le mot de passe sont requis." });
    }

    const usersRef = db.collection('users');
    const snap = await usersRef.where('email', '==', cleanEmail).limit(1).get();

    if (snap.empty) {
      return res.status(401).json({ error: "Utilisateur introuvable ou identifiants incorrects." });
    }

    const doc = snap.docs[0];
    const user: any = { id: doc.id, ...doc.data() };

    const isPasswordValid = await bcrypt.compare(password, user.password).catch(() => false);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user });
  });

  router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "L'e-mail et le mot de passe sont requis." });
    const adminEmails = ['papesamabutik@gmail.com', '78177233ds@gmail.com', 'pape@samabutik.com'];
    const assignedRole = adminEmails.includes(email?.toLowerCase()) ? 'admin' : (role || 'client');
    try {
      const usersRef = db.collection('users');
      const lowerEmail = email.toLowerCase();
      const existing = await usersRef.where('email', '==', lowerEmail).limit(1).get();
      if (!existing.empty) {
        return res.status(400).json({ error: "Cet e-mail est déjà pris." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const docRef = await usersRef.add({
        username: username || email.split('@')[0], 
        email: lowerEmail, 
        password: hashedPassword, 
        role: assignedRole
      });
      const newSnap = await docRef.get();
      const user: any = { id: newSnap.id, ...newSnap.data() };
      
      const payload = { id: user.id, email: user.email, role: user.role };
      // register auth
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
      const snap = await db.collection('users').doc(decoded.id).get();
      if (!snap.exists) throw new Error('Not found');
      
      const { password, ...safeUser } = snap.data() as any;
      const user = { id: snap.id, ...safeUser };
      res.json({ user });
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
