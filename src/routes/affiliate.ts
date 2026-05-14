import { Router } from 'express';
import { authRequired } from './middleware';
import admin from 'firebase-admin';

export function affiliateRoutes(dbProxy: any) {
  const router = Router();
  const db = dbProxy.firebase;
  const pg = dbProxy.pg;

  router.get('/dashboard', authRequired, async (req, res) => {
    const user = (req as any).user;
    try {
      if (dbProxy.isPostgres) {
        const { rows: affRows } = await pg.query('SELECT * FROM affiliates WHERE user_id = $1', [user.id]);
        if (affRows.length === 0) return res.json({ isAffiliate: false });
        
        const aff = affRows[0];
        const { rows: commissions } = await pg.query(
          'SELECT * FROM commissions WHERE affiliate_id = $1 ORDER BY created_at DESC',
          [aff.id]
        );
        return res.json({ isAffiliate: true, affiliate: aff, commissions });
      }

      if (!db) return res.json({ isAffiliate: false });
      const snap = await db.collection('affiliates').where('user_id', '==', user.id).get();
      if (snap.empty) return res.json({ isAffiliate: false });
      
      const doc = snap.docs[0];
      const aff: any = { id: doc.id, ...doc.data() };
      
      const commSnap = await db.collection('commissions').where('affiliate_id', '==', aff.id).get();
      const comms = commSnap.docs.map((c: any) => ({ id: c.id, ...c.data() }))
        .sort((a: any, b: any) => {
          const at = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
          const bt = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
          return bt - at;
        });
        
      res.json({ isAffiliate: true, affiliate: aff, commissions: comms });
    } catch { res.json({ isAffiliate: false }); }
  });

  router.post('/apply', authRequired, async (req, res) => {
    const user = (req as any).user;
    try {
      if (dbProxy.isPostgres) {
        const { rows } = await pg.query('SELECT id FROM affiliates WHERE user_id = $1', [user.id]);
        if (rows.length > 0) return res.status(400).json({ error: "Déjà affilié" });
        const code = 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await pg.query('INSERT INTO affiliates (user_id, code, balance) VALUES ($1, $2, 0)', [user.id, code]);
        return res.json({ success: true });
      }

      if (!db) return res.status(500).json({ error: 'Firebase not available' });
      const snap = await db.collection('affiliates').where('user_id', '==', user.id).get();
      if (!snap.empty) return res.status(400).json({ error: "Déjà affilié" });
      const code = 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
      await db.collection('affiliates').add({ user_id: user.id, code, balance: 0, created_at: admin.firestore.FieldValue.serverTimestamp() });
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Error' }); }
  });

  return router;
}
